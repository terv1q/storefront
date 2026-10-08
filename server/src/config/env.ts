/**
 * Environment configuration. Everything the server needs is read and validated
 * here, so a missing or malformed variable stops the process at startup with a
 * message that names the variable instead of failing somewhere deeper.
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  /**
   * Origins allowed by CORS, for example `http://localhost:5173`. Several may be
   * listed, separated by commas, so a deployment can serve the storefront from
   * more than one address.
   */
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().min(1).default('7d'),
  /**
   * Comma-separated emails allowed through `requireAdmin`. Empty by default,
   * which makes every account a normal customer.
   */
  ADMIN_EMAILS: z.string().default(''),
  /**
   * Where uploaded review photographs are written, and what they are served
   * from at `/uploads/...`. Relative paths are resolved against the process's
   * working directory, which is the server package. See `utils/uploads.ts` for
   * what is accepted and how a name is chosen.
   */
  UPLOAD_DIR: z.string().min(1).default('uploads'),
  /**
   * How much the server writes to the console. Left unset, it is `info` outside
   * of tests and `silent` inside them, which is what most runs want; `debug` is
   * what an operator sets when they are chasing a request that is not failing.
   * See `utils/logger.ts` for what each level prints.
   */
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
  /**
   * Where failures the server is responsible for are reported, when a
   * deployment has somewhere to send them. Empty, the default, means the log is
   * the only place a failure goes — which is the whole story in development and
   * half of it in production.
   *
   * Only 5xx is posted, and the body carries the code, the route, and one stack
   * frame rather than the request. See `utils/errorReporter.ts`.
   */
  ERROR_REPORT_URL: z.union([z.literal(''), z.url()]).default(''),
  /**
   * How much of the forwarding headers to believe, and therefore what
   * `request.ip` is.
   *
   * Empty, the default, is right for a server the internet reaches directly:
   * the address in the socket is the caller, and a forwarded header is a claim
   * only the caller could have made. Behind a reverse proxy or a load balancer
   * it is wrong in the other direction — every request then arrives from the
   * proxy, so the rate limiter keeps one counter for the whole world and every
   * refusal in the log names the proxy.
   *
   * The value is Express's own: `true` to trust the whole chain, a hop count
   * (`1`) to trust that many proxies, or a comma-separated list of addresses
   * and subnets (`loopback`, `10.0.0.0/8`). Trusting more hops than are
   * actually in front of the process is what lets a caller forge an address and
   * spend somebody else's rate-limit allowance, so it is set here rather than
   * guessed.
   */
  TRUST_PROXY: z.string().default(''),
});

/**
 * The value `.env.example` ships with. A production server that still has it is
 * signing tokens with a secret the whole world can read, so startup refuses.
 */
const EXAMPLE_JWT_SECRET = 'change-me-in-local-development';

/** Shortest secret accepted in production. */
const PRODUCTION_JWT_SECRET_LENGTH = 32;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.') || 'env'}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment configuration — ${details}`);
}

export const env = parsed.data;

/**
 * Fails startup rather than serving traffic with a weak signing key. Checked
 * only in production: development and test run on the example secret, which is
 * exactly what it is for.
 */
function assertProductionJwtSecret(): void {
  if (env.NODE_ENV !== 'production') {
    return;
  }

  if (env.JWT_SECRET === EXAMPLE_JWT_SECRET) {
    throw new Error(
      'Invalid environment configuration — JWT_SECRET is still the example value from .env.example. ' +
        'Set a unique secret before running in production.',
    );
  }

  if (env.JWT_SECRET.length < PRODUCTION_JWT_SECRET_LENGTH) {
    throw new Error(
      `Invalid environment configuration — JWT_SECRET must be at least ${PRODUCTION_JWT_SECRET_LENGTH} characters in production.`,
    );
  }
}

assertProductionJwtSecret();

/** The entries of `CLIENT_ORIGIN`, split on commas and checked as URLs. */
function parseAllowedOrigins(value: string): readonly string[] {
  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    throw new Error(
      'Invalid environment configuration — CLIENT_ORIGIN must list at least one origin.',
    );
  }

  const invalid = origins.filter((origin) => !z.url().safeParse(origin).success);

  if (invalid.length > 0) {
    throw new Error(
      `Invalid environment configuration — CLIENT_ORIGIN is not a valid URL: ${invalid.join(', ')}.`,
    );
  }

  return origins;
}

/** Origins the browser is allowed to call the API from. */
export const allowedOrigins: readonly string[] = parseAllowedOrigins(env.CLIENT_ORIGIN);

/**
 * What `app.set('trust proxy', …)` is given.
 *
 * The three shapes Express distinguishes are recognised here so the value in
 * `.env` reads the way an operator thinks about it: a hop count is a number, an
 * address list is a string, and `true` is the whole chain. Anything else — a
 * half-remembered address list, a typo — is passed through as a string, which
 * Express treats as an address list that matches nothing. Failing closed that
 * way leaves the server behaving as it does with the variable unset rather than
 * trusting a header it cannot vouch for.
 */
function parseTrustProxy(value: string): boolean | number | string {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed === 'false') {
    return false;
  }

  if (trimmed === 'true') {
    return true;
  }

  const hops = Number(trimmed);

  return Number.isInteger(hops) && hops > 0 ? hops : trimmed;
}

/** How much of the forwarding headers the process believes. */
export const trustProxy: boolean | number | string = parseTrustProxy(env.TRUST_PROXY);

export type Env = typeof env;
