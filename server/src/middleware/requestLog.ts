/**
 * The request line, written only when a request is worth one.
 *
 * Healthy traffic is silent. A log that lists every 200 is a log an operator
 * learns to skim past, which costs them the one line that mattered — so this
 * middleware watches every request and prints almost none of them. Two kinds of
 * request earn a line: one that failed, and one that took long enough that the
 * failure to come would start here.
 *
 * The level follows the meaning. A 5xx is the server's problem and is logged as
 * an error; a 4xx is the caller's, which is worth a warning and not an alarm —
 * a 404 on a route somebody mistyped is not an incident. A slow request that
 * answered correctly is a warning too, because nothing is broken yet.
 *
 * The whole record is one line, because a log is read by scrolling and by
 * searching, and both want a request to be one line rather than four. The route
 * is the path alone: the query string can hold a search term, and a log is not
 * the place a shopper's words are kept.
 */

import { performance } from 'node:perf_hooks';
import type { NextFunction, Request, Response } from 'express';

import { logger } from '../utils/logger.js';

/** How long a request may take before it is worth a line, in milliseconds. */
const SLOW_REQUEST_MS = 500;

/** What the error handler leaves behind for the request line to print. */
export type Failure = {
  /** The machine-readable code the client was given. */
  code: string;
  /** The message the client was given. */
  message: string;
  /** The original throwable, for the stack the logger prints in development. */
  thrown?: unknown;
};

/**
 * Hands the error handler's account of a failure to the request line.
 *
 * A failure is one event, so it is one line. The error handler knows what went
 * wrong and the request log knows how long it took and where it came from; the
 * two are joined here rather than printed as two lines that have to be read
 * together to make one sentence.
 */
export function recordFailure(response: Response, failure: Failure): void {
  response.locals.failure = failure;
}

/** The failure recorded for this response, if the error handler saw one. */
function failureOf(response: Response): Failure | undefined {
  const { failure } = response.locals as { failure?: Failure };

  return failure;
}

/**
 * The address a request was made against, without what it carried.
 *
 * `originalUrl` rather than `url`, because inside a router `url` is the path
 * with the router's own prefix already stripped, and a log that says `/facets`
 * is a log that does not say which resources it counted. The query string is
 * dropped for the same reason the recent-search store caps a term: a log is not
 * where a shopper's words are kept.
 */
function route(request: Request): string {
  const [path] = request.originalUrl.split('?');

  return path ?? request.originalUrl;
}

export function requestLog(request: Request, response: Response, next: NextFunction): void {
  const startedAt = performance.now();

  // `finish` rather than the response's own callback: it fires on the end of the
  // response whatever wrote it, so a request answered by a handler, by the
  // not-found handler, or by the error handler is measured the same way.
  response.on('finish', () => {
    const elapsedMs = Math.round(performance.now() - startedAt);
    const status = response.statusCode;
    const failure = failureOf(response);
    const failed = status >= 500;
    const noteworthy = failed || status >= 400 || elapsedMs >= SLOW_REQUEST_MS;

    if (!noteworthy) {
      return;
    }

    const line =
      `${request.method} ${route(request)} ${status} — ${elapsedMs} ms` +
      (request.ip === undefined ? '' : ` from ${request.ip}`) +
      (failure === undefined ? '' : ` — ${failure.code}: ${failure.message}`) +
      (status < 400 && elapsedMs >= SLOW_REQUEST_MS ? ' (slow)' : '');

    if (failed) {
      logger.error(line, failure?.thrown);
    } else {
      logger.warn(line);
    }
  });

  next();
}
