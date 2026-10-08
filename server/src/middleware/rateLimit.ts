/**
 * Rate limiting.
 *
 * A small in-memory fixed-window limiter, so the API does not need another
 * dependency for what is a handful of counters. A window is a start time, a
 * count and a limit; a request past the limit is answered with the same
 * `500`-free envelope as every other failure.
 *
 * Counters live in this process, so the limits are per instance. That is the
 * right trade for a single-process deployment; a fleet behind a load balancer
 * would move the counters into Redis and keep this interface.
 *
 * The key is the client address by default. Routes behind `requireAuth` can key
 * on the account instead, so one customer's retries do not count against
 * everybody else sharing an address.
 */

import type { Request, RequestHandler } from 'express';

import { ApiError } from '../utils/apiError.js';

export type RateLimitOptions = {
  /** Length of the window in milliseconds. */
  windowMs: number;
  /** Requests allowed per key per window. The next one is rejected. */
  max: number;
  /** Prefix, so two limiters never share a counter by accident. */
  name: string;
  /** Stable error code for the client. */
  code?: string;
  /** Message shown to the client. */
  message?: string;
  /** Counter key. Defaults to the client address. */
  key?: (request: Request) => string | undefined;
  /**
   * Requests this limiter does not count. A platform probe hits the health
   * endpoint on a timer, and counting it would spend the allowance of whatever
   * address the probe comes from — which, behind a load balancer, is every
   * address at once.
   */
  skip?: (request: Request) => boolean;
};

type Counter = {
  count: number;
  resetAt: number;
};

/**
 * Counters are dropped when their window ends, but only when the map is swept,
 * so the sweep also runs once the map grows past this size. Without it a flood
 * of distinct keys would grow the map faster than the windows expire.
 */
const SWEEP_THRESHOLD = 5_000;

export function rateLimit(options: RateLimitOptions): RequestHandler {
  const counters = new Map<string, Counter>();
  const { windowMs, max, name } = options;

  function sweep(now: number): void {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= now) {
        counters.delete(key);
      }
    }
  }

  return (request, response, next) => {
    if (options.skip?.(request) === true) {
      next();
      return;
    }

    const now = Date.now();
    const suffix = options.key?.(request) ?? request.ip ?? 'unknown';
    const key = `${name}:${suffix}`;

    let counter = counters.get(key);

    if (counter === undefined || counter.resetAt <= now) {
      if (counters.size >= SWEEP_THRESHOLD) {
        sweep(now);
      }

      counter = { count: 0, resetAt: now + windowMs };
      counters.set(key, counter);
    }

    counter.count += 1;

    const remaining = Math.max(0, max - counter.count);
    const resetSeconds = Math.ceil((counter.resetAt - now) / 1000);

    // The draft `RateLimit-*` fields, so a well-behaved client can pace itself
    // instead of discovering the limit by being rejected.
    response.setHeader('RateLimit-Limit', String(max));
    response.setHeader('RateLimit-Remaining', String(remaining));
    response.setHeader('RateLimit-Reset', String(resetSeconds));

    if (counter.count > max) {
      response.setHeader('Retry-After', String(resetSeconds));
      next(
        new ApiError(
          429,
          options.code ?? 'too_many_requests',
          options.message ?? 'Too many requests. Please try again shortly.',
          { retryAfter: resetSeconds },
        ),
      );
      return;
    }

    next();
  };
}

/** Fifteen minutes, the window the auth and order limits are set in. */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

/**
 * Counts per signed-in account. Used after `requireAuth`, so it reads the user
 * the middleware has already resolved. Falls back to the client address for the
 * requests that arrive without one.
 */
export function accountKey(request: Request): string | undefined {
  return request.user?.id;
}
