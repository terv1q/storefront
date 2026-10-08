/**
 * Request validation. A route declares Zod schemas for the parts of the request
 * it reads, and the middleware replaces each of those parts with the parsed
 * result — so a handler works with coerced, trimmed, fully typed values instead
 * of re-checking strings.
 *
 * A failure becomes a 422 carrying `details.fields`, a `{ field: message }` map
 * the client puts straight onto its form inputs.
 */

import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { ApiError } from '../utils/apiError.js';

export type RequestSchemas = {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
};

/** `["items", 0, "quantity"]` becomes `items.0.quantity`. */
function issuePath(path: readonly PropertyKey[]): string {
  return path.length === 0 ? '_root' : path.map((segment) => String(segment)).join('.');
}

function fieldsFrom(error: {
  issues: readonly { path: readonly PropertyKey[]; message: string }[];
}) {
  const fields: Record<string, string> = {};

  for (const issue of error.issues) {
    const key = issuePath(issue.path);
    // The first message per field is the one a form shows.
    fields[key] ??= issue.message;
  }

  return fields;
}

/**
 * The sentence a refusal carries when no field can carry it. A request refused
 * for sending a field the endpoint does not take has no field to hang the
 * message on: the schema says so in a sentence of its own, and that sentence
 * becomes the message of the response. A form showing `error.message` — which
 * is what the forms do when no field is named — then shows what was wrong
 * rather than the generic line.
 */
function refusalMessage(error: {
  issues: readonly { code: string; message: string }[];
}): string | undefined {
  return error.issues.every((issue) => issue.code === 'unrecognized_keys')
    ? error.issues[0]?.message
    : undefined;
}

/**
 * Express 5 exposes `query` through a getter on the request prototype, so a
 * plain assignment would throw in strict mode. Defining an own property
 * shadows the getter and keeps the parsed value readable as `req.query`.
 */
function replaceProperty(request: object, key: 'query' | 'params', value: unknown): void {
  Object.defineProperty(request, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
}

export function validate(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    for (const key of ['body', 'query', 'params'] as const) {
      const schema = schemas[key];

      if (schema === undefined) {
        continue;
      }

      const result = schema.safeParse(request[key]);

      if (!result.success) {
        next(
          ApiError.validationFailed(
            { fields: fieldsFrom(result.error) },
            refusalMessage(result.error),
          ),
        );
        return;
      }

      if (key === 'body') {
        request.body = result.data;
      } else {
        replaceProperty(request, key, result.data);
      }
    }

    next();
  };
}
