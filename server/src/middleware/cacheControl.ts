/**
 * What a browser, a CDN, or a proxy is allowed to keep.
 *
 * Two rules, and the default is the safe one. Every answer is `no-store` unless
 * a route opts into being cacheable, because the API serves order history,
 * account details, a wishlist, and a cart, and a shared cache that keeps one
 * customer's answer to hand out to the next is the worst failure this file could
 * cause. Opting in is therefore an explicit list of reads that cannot depend on
 * who is asking.
 *
 * The public reads are the catalog. They vary by the query string — the language
 * a name is rendered in, the filters, the page — and a query string is part of
 * the cache key, so two shoppers asking the same question get the same answer by
 * construction. A short `max-age` with a long `stale-while-revalidate` is the
 * trade a catalog wants: a product page or a listing is served from the browser's
 * copy for a minute, and for five minutes after that the browser serves the
 * stale copy immediately and refreshes it in the background, so a navigation
 * back to a listing the shopper just saw costs no request at all and never
 * blocks on one.
 *
 * `Vary: Accept-Encoding` is added here rather than only by the compressor,
 * because a response that was never compressed is still a response whose bytes
 * depend on that header, and a cache that mixes the two hands a compressed body
 * to a client that cannot read it.
 */

import type { NextFunction, Request, Response } from 'express';

/**
 * The prefix of every path a stranger may be handed, as seen from the mount
 * point this middleware is installed at — it is mounted on `/api`, so these are
 * the router-relative paths. A route under one of these that answered
 * differently per visitor would be a mistake in the route, not here: the paths
 * below are the catalog, which is the same for everybody.
 */
const PUBLIC_READ_PREFIXES = ['/products', '/categories', '/delivery', '/search'];

/** How long a browser may reuse a catalog answer without asking. */
const PUBLIC_MAX_AGE_SECONDS = 60;

/** How long past that it may serve the stale copy while it refreshes it. */
const PUBLIC_STALE_SECONDS = 300;

const PUBLIC_CACHE_VALUE =
  `public, max-age=${PUBLIC_MAX_AGE_SECONDS}, ` + `stale-while-revalidate=${PUBLIC_STALE_SECONDS}`;

/**
 * Answers that must never be stored: anything authenticated, anything that
 * changes state, and anything a POST asked for. This is the default, so a route
 * added later is private until somebody decides otherwise.
 */
const PRIVATE_CACHE_VALUE = 'no-store';

function isPublicRead(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  // A credentialed read is never shared, even on a path that is public without
  // one: the review list marks the caller's own votes, and the caller's own
  // review sits under the same prefix. The token is what makes the answer
  // personal, so its presence is what decides.
  if (request.headers.authorization !== undefined) {
    return false;
  }

  const path = request.path;

  return PUBLIC_READ_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function cacheControl(request: Request, response: Response, next: NextFunction): void {
  response.setHeader(
    'Cache-Control',
    isPublicRead(request) ? PUBLIC_CACHE_VALUE : PRIVATE_CACHE_VALUE,
  );
  response.vary('Accept-Encoding');

  next();
}
