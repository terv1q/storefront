/**
 * Central error handler. Every failure leaves the API in the shape the client
 * already expects: `{ error: { code, message, details } }`.
 *
 * Failures raised as an `ApiError` pass through unchanged. A raw `ZodError`, a
 * Prisma error, or a body-parser error is translated into one first, so a
 * validation or constraint failure that escaped a route's own guard still
 * answers with a status the client can act on instead of a blanket 500.
 * Anything else keeps whatever numeric `status` it carries, and everything
 * unrecognised becomes a 500 with a generic message.
 *
 * Only an `ApiError` contributes a message. Every other failure is described by
 * its status, and the stack is attached in development only, so a production
 * response never carries a stack trace, a Prisma message, or a SQL fragment.
 */

import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { reportServerError } from '../utils/errorReporter.js';
import { MAX_IMAGE_BYTES, MAX_REVIEW_IMAGES } from '../utils/uploads.js';

import { recordFailure } from './requestLog.js';

const STATUS_CODES: Record<number, string> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'validation_failed',
  429: 'too_many_requests',
  503: 'unavailable',
};

/**
 * The message a failure gets when it is not an `ApiError`. A status with a
 * message here is one the API raises itself, so the copy is safe to show.
 * Anything else is a message from somewhere deeper, which the client has no
 * business reading.
 */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'The request could not be understood.',
  401: 'You need to sign in to continue.',
  403: 'You do not have access to this resource.',
  404: 'The requested resource does not exist.',
  405: 'That method is not allowed here.',
  409: 'The request conflicts with the stored data.',
  413: 'The request body is too large.',
  415: 'Send the request body as application/json.',
  422: 'The submitted values are not valid.',
  429: 'Too many requests. Please try again shortly.',
};

/** The shape `body-parser` attaches to the errors it raises. */
type BodyParserError = Error & { type?: string };

/** Turns the error types that carry their own meaning into an `ApiError`. */
function normalize(error: unknown): unknown {
  if (error instanceof ZodError) {
    const fields: Record<string, string> = {};

    for (const issue of error.issues) {
      const key = issue.path.length === 0 ? '_root' : issue.path.map(String).join('.');
      // The first message per field is the one a form shows.
      fields[key] ??= issue.message;
    }

    return ApiError.validationFailed({ fields });
  }

  // The JSON parser reports a malformed body as a `SyntaxError` whose message
  // describes where it gave up. That detail belongs in the log, not in the
  // response.
  if (error instanceof SyntaxError && (error as BodyParserError).type === 'entity.parse.failed') {
    return ApiError.badRequest('The request body is not valid JSON.');
  }

  if (error instanceof Error) {
    const type = (error as BodyParserError).type;

    if (type === 'entity.too.large') {
      return new ApiError(413, 'payload_too_large', 'The request body is too large.');
    }

    if (type === 'encoding.unsupported' || type === 'charset.unsupported') {
      return new ApiError(415, 'unsupported_media_type', 'Send the request body as utf-8 JSON.');
    }
  }

  // Multer refuses an upload before it finishes writing one, which is what keeps
  // a half-stored photograph off the disk. Its codes describe the limit that was
  // crossed, so they are translated into the same envelope as everything else.
  if (error instanceof MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ApiError(
        413,
        'payload_too_large',
        `Each photograph must be at most ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`,
      );
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return ApiError.validationFailed({
        fields: { images: `Attach at most ${MAX_REVIEW_IMAGES} photographs.` },
      });
    }

    return ApiError.badRequest('The upload could not be read.');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const target = error.meta?.target;
    const columns = Array.isArray(target) ? target.map(String).join(', ') : undefined;

    if (error.code === 'P2002') {
      // The column names come from the database. They help a developer reading
      // a development response and say nothing useful to a shopper, so they
      // stay out of a production one.
      const details =
        columns === undefined || env.NODE_ENV === 'production'
          ? undefined
          : { fields: { [columns]: 'Already in use.' } };

      return ApiError.conflict('conflict', 'That value is already taken.', details);
    }

    if (error.code === 'P2025') {
      return ApiError.notFound();
    }

    if (error.code === 'P2003') {
      return ApiError.conflict('conflict', 'A related record is missing or still in use.');
    }

    return new ApiError(409, 'conflict', 'The request conflicts with the stored data.');
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return ApiError.badRequest('The request could not be understood.');
  }

  return error;
}

function statusOf(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status: unknown }).status;

    if (typeof status === 'number' && status >= 400 && status < 600) {
      return status;
    }
  }

  return 500;
}

function messageOf(error: unknown, status: number): string {
  // An `ApiError` carries copy written for the client. Anything else is
  // reported by its status: a 500 is always generic, and a 4xx raised by a
  // layer below is described by the status table rather than by its own
  // message, which may name internals.
  if (error instanceof ApiError) {
    return error.message;
  }

  if (status >= 500) {
    return 'Something went wrong. Please try again.';
  }

  return STATUS_MESSAGES[status] ?? 'The request could not be completed.';
}

function codeOf(error: unknown, status: number): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code: unknown }).code;

    if (typeof code === 'string' && code) {
      return code;
    }
  }

  return STATUS_CODES[status] ?? 'error';
}

function detailsOf(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'details' in error) {
    return (error as { details: unknown }).details;
  }

  return undefined;
}

export const errorHandler: ErrorRequestHandler = (rawError, request, response, next) => {
  // A response that already started streaming cannot be turned into JSON; that
  // case falls back to the default Express handling.
  if (response.headersSent) {
    next(rawError);
    return;
  }

  const error = normalize(rawError);
  const status = statusOf(error);
  const details = detailsOf(error);
  const code = codeOf(error, status);
  const message = messageOf(error, status);

  // The request line prints this. A failure is one event and gets one line: this
  // handler knows what went wrong, the request log knows how long it took and
  // where it came from, and neither has the whole sentence on its own. The
  // original throwable travels with it so the stack reaches the log in
  // development, where the logger prints it and only there.
  recordFailure(response, { code, message, thrown: rawError });

  // A failure the server is responsible for also goes wherever a deployment has
  // said to send it, if anywhere. The response is written first and the report
  // is never awaited, so a reporting endpoint that is slow or down cannot slow
  // down or break the request that has already been answered.
  if (status >= 500) {
    reportServerError({
      code,
      message,
      status,
      method: request.method,
      path: request.path,
      thrown: rawError,
    });
  }

  response.status(status).json({
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
      // The stack is a development aid and never leaves a development server.
      // It comes from the original error so a translated failure does not
      // report the stack of the translation.
      ...(env.NODE_ENV === 'development' && rawError instanceof Error
        ? { stack: rawError.stack }
        : {}),
    },
  });
};
