/**
 * Express application. Middleware order matters: security headers, CORS, and
 * the content-type guard run before parsing; the API router runs before the
 * not-found handler; and the error handler runs last so it can catch everything
 * above it.
 */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { allowedOrigins, env, trustProxy } from './config/env.js';
import { cacheControl } from './middleware/cacheControl.js';
import { compressResponse } from './middleware/compress.js';
import { requireJsonContentType } from './middleware/contentType.js';
import { errorHandler } from './middleware/error.js';
import { notFoundHandler } from './middleware/notFound.js';
import { rateLimit } from './middleware/rateLimit.js';
import { requestLog } from './middleware/requestLog.js';
import { apiRouter } from './routes/index.js';
import { REVIEW_IMAGE_UPLOAD_PATH } from './routes/product.routes.js';
import { sitemapRouter, robotsRouter } from './routes/sitemap.routes.js';
import { UPLOAD_ROUTE, ensureUploadDirs, uploadDir } from './utils/uploads.js';

/**
 * Request body ceiling. Orders are the largest payload and stay well under
 * this. The parser answers 413 for anything larger, before a handler runs.
 */
const JSON_BODY_LIMIT = '100kb';

/** Methods the browser may use against the API. */
const CORS_METHODS = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];

/** Headers a browser request may send. The API reads these two and no others. */
const CORS_HEADERS = ['Content-Type', 'Authorization'];

/** Seconds a browser may cache a preflight response. */
const CORS_MAX_AGE_SECONDS = { production: 86_400, development: 600, test: 0 } as const;

/**
 * The ceiling on everything under `/api`, per address, per minute.
 *
 * The limits in the routers guard the endpoints where a repeat is expensive —
 * signing in, placing an order, writing a review. This one guards the endpoints
 * where a single repeat is cheap and a flood of them is not: a listing query is
 * a database round trip, and a script asking for one a thousand times a second
 * spends the connection pool of every real customer.
 *
 * It is set high enough that no person can feel it. A page load is under a dozen
 * requests, and the worst browsing session does not approach six hundred in a
 * minute, so a caller who meets this limit is not browsing. Tests are exempt,
 * because a suite makes more requests in a second than a person makes in a day.
 */
const GLOBAL_RATE_LIMIT_MAX = 600;
const GLOBAL_RATE_LIMIT_WINDOW_MS = 60 * 1000;

/** A local development origin, on any port, so a second Vite instance still works. */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * The allowlist is `CLIENT_ORIGIN`, which is the storefront's own address in
 * production. Development also accepts any localhost origin, because the port
 * moves when a second dev server takes the default one.
 *
 * A request with no `Origin` header — curl, a health probe, a server-to-server
 * call — is not a cross-origin request and is allowed through without CORS
 * headers. An origin that is not on the list is refused by omission: the browser
 * blocks the response, and the API does not answer a question about itself to a
 * stranger.
 */
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return env.NODE_ENV !== 'production' && LOCAL_ORIGIN.test(origin);
}

/**
 * A preflight from an origin that is not on the list stops here.
 *
 * `cors` answers a request whose origin it accepts and leaves the rest alone,
 * which would send an `OPTIONS` request on to the router — and on a protected
 * route, to a 401 that says nothing about CORS. Answering the preflight
 * directly keeps the response honest and keeps an unauthenticated `OPTIONS`
 * request out of the authentication middleware.
 *
 * A request with no `Origin` header is not a browser cross-origin request, so
 * it is left to the routes below.
 */
function rejectUnlistedPreflight(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
): void {
  const origin = request.headers.origin;

  if (request.method !== 'OPTIONS' || origin === undefined || isAllowedOrigin(origin)) {
    next();
    return;
  }

  response.status(403).json({
    error: {
      code: 'origin_not_allowed',
      message: 'Requests from this origin are not allowed.',
    },
  });
}

export function createApp(): express.Express {
  const app = express();

  app.disable('x-powered-by');

  // What `request.ip` reads. Off unless the deployment says otherwise, because
  // believing a forwarded header that no proxy wrote lets a caller choose its
  // own address — and with it whose rate-limit allowance it spends. See
  // `config/env.ts` for the shapes the variable accepts.
  app.set('trust proxy', trustProxy);

  // Written once, at startup, so the first upload does not have to create the
  // directory it is writing into.
  ensureUploadDirs();

  app.use(helmet());

  // Before the routes, because it wraps `res.end` — the body is only this
  // middleware's to act on while the response has not been written yet.
  app.use(compressResponse);

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, origin === undefined || isAllowedOrigin(origin));
      },
      // The storefront authenticates with a bearer token, not a cookie, so the
      // browser never has to send credentials with the request. Leaving this
      // off keeps the API from being usable as a cross-site cookie client.
      credentials: false,
      methods: CORS_METHODS,
      allowedHeaders: CORS_HEADERS,
      maxAge: CORS_MAX_AGE_SECONDS[env.NODE_ENV],
    }),
  );

  // First, so the line it writes covers a request that never reaches a route —
  // a refusal by CORS, a body the parser rejected, a path with no handler. It
  // prints nothing unless the request failed or overran; see the middleware.
  app.use(requestLog);

  app.use(rejectUnlistedPreflight);

  app.use(requireJsonContentType({ multipartPaths: [REVIEW_IMAGE_UPLOAD_PATH] }));

  app.use(express.json({ limit: JSON_BODY_LIMIT }));

  /**
   * The flood guard, mounted on the API as a whole.
   *
   * `skip` keeps two kinds of request out of it. The health check is a probe on
   * a timer, and one that is being counted is one that can be refused — the
   * platform would then read a rate-limited 429 as a dead instance. Tests are
   * exempt because a suite issues in a second what a person issues in a day.
   */
  app.use(
    '/api',
    rateLimit({
      windowMs: GLOBAL_RATE_LIMIT_WINDOW_MS,
      max: GLOBAL_RATE_LIMIT_MAX,
      name: 'global',
      skip: (request) => env.NODE_ENV === 'test' || request.path === '/health',
    }),
  );

  /**
   * Uploaded review photographs.
   *
   * Served before the API router and outside it, because a photograph is a file
   * on a disk rather than a resource this API answers questions about. The
   * storefront runs on another origin, so the resource policy is widened for
   * these files: helmet's default `same-origin` would stop the browser drawing
   * an image the page is entitled to show.
   *
   * `dotfiles` is denied and directory listings are off, so the only thing
   * reachable under this path is a file whose name is a UUID it was stored under.
   */
  app.use(
    UPLOAD_ROUTE,
    (_request, response, next) => {
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(uploadDir, { index: false, dotfiles: 'deny', maxAge: '7d' }),
  );

  app.use('/api', cacheControl, apiRouter);

  /**
   * The sitemap, outside the API and outside the envelope. It is a file a
   * crawler fetches at a fixed address, not a resource the storefront asks
   * about, so it is mounted at the site root beside the uploads rather than
   * under `/api`. See `services/sitemap.service.ts`.
   */
  app.use('/sitemap.xml', sitemapRouter);
  app.use('/robots.txt', robotsRouter);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}
