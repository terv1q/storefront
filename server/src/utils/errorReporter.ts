/**
 * Where a failure goes when somebody has to be told.
 *
 * The server's log is a stream that a person reads while they are looking, and
 * a 5xx at three in the morning is not read by anybody until morning. This
 * module is the seam where a deployment attaches something that is not a
 * person: set `ERROR_REPORT_URL` and every failure whose status says the server
 * is at fault is posted there as one small JSON object.
 *
 * Two deliberate limits on what is sent and when:
 *
 *  - Only the server's own faults. A 4xx is the caller's mistake and is already
 *    answered; reporting every 404 would make the channel noisy enough that the
 *    5xx beside it stops being read, which is the same failure mode the request
 *    log was built to avoid.
 *  - Nothing about the request body, the headers, or the customer. The message,
 *    the code, the route, and when it happened is what somebody needs to find
 *    the code; a token or an address in a reporting service is a leak with an
 *    audience.
 *
 * The call is fire-and-forget. A reporting endpoint that is slow, down, or
 * unreachable must not slow down or break the request that was already
 * answered, so the promise is never awaited and every failure to report is
 * itself only worth a debug line.
 */

import { env } from '../config/env.js';
import { logger } from './logger.js';

/** How long the reporting endpoint has to accept the report. */
const REPORT_TIMEOUT_MS = 5_000;

export type ErrorReport = {
  /** Stable machine-readable code, the same one the client received. */
  code: string;
  /** The message the client received. */
  message: string;
  /** HTTP status the failure was answered with. */
  status: number;
  /** Which request it was, without the query string. */
  method: string;
  path: string;
  /** The thrown value, for the stack. Never sent as it stands. */
  thrown: unknown;
};

/** The body a reporting endpoint receives. Flat, small, and free of identifiers. */
function payloadOf(report: ErrorReport): Record<string, unknown> {
  const stack = report.thrown instanceof Error ? report.thrown.stack : undefined;

  return {
    code: report.code,
    message: report.message,
    status: report.status,
    method: report.method,
    path: report.path,
    at: new Date().toISOString(),
    environment: env.NODE_ENV,
    // The stack is the only part with a chance of naming a file and a line, and
    // a stack that reaches a third party is source disclosure with a delay, so
    // only the first frame is sent.
    frame: stack === undefined ? undefined : stack.split('\n')[1]?.trim(),
  };
}

/**
 * Reports a server-side failure, if a deployment has said where to report it.
 *
 * Never throws and never awaits: the caller's response has already been sent by
 * the time this runs, and nothing about it may depend on an outside service.
 */
export function reportServerError(report: ErrorReport): void {
  const url = env.ERROR_REPORT_URL;

  if (url === undefined || url.length === 0) {
    return;
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadOf(report)),
    signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
  }).catch((error: unknown) => {
    // A reporter that cannot report is not the failure being handled, and it
    // must not become a second one. Worth a debug line rather than a warning:
    // an endpoint that is down would otherwise fill the log it was meant to
    // save somebody from reading.
    logger.debug('Error report could not be delivered.', error);
  });
}
