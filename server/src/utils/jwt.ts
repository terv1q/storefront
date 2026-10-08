/**
 * Access tokens. There is no refresh token in the first version: a session is
 * one signed JWT, and an expired token is handled by signing in again.
 *
 * The token carries only what an authenticated request needs — the subject and
 * the email — so a stale token cannot claim a name or a phone number that has
 * since changed. Everything else is read from the database per request.
 */

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { ApiError } from './apiError.js';

/** Issuer claim, so a token minted for another service is rejected outright. */
const TOKEN_ISSUER = 'ziyo-api';

/**
 * The one algorithm this service signs with and the only one it will accept.
 *
 * Pinned rather than left to the token's own header: a header is a claim by
 * whoever wrote the token, and a verifier that reads it is letting the attacker
 * choose how to be verified. There is no asymmetric key here, so HS256 is the
 * whole of the answer, and anything else is a token that was not minted here.
 */
const TOKEN_ALGORITHM = 'HS256';

export type AccessTokenPayload = {
  /** `User.id`. */
  sub: string;
  email: string;
};

const DURATION_PATTERN = /^(\d+)([smhdw])?$/;

const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

/**
 * Reads a duration such as `15m`, `7d`, or a bare number of seconds.
 * `JWT_EXPIRES_IN` reaches jsonwebtoken as `expiresIn`, so an unreadable value
 * would otherwise surface as a runtime signing failure on the first login.
 */
export function parseDurationSeconds(value: string): number {
  const match = DURATION_PATTERN.exec(value.trim());

  if (match === null) {
    throw new Error(
      `JWT_EXPIRES_IN must look like "900", "30s", "15m", "12h", "7d", or "2w" — received "${value}".`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2] ?? 's';

  return amount * UNIT_SECONDS[unit];
}

/** Lifetime of an access token in seconds, reported to the client on sign-in. */
export const ACCESS_TOKEN_TTL_SECONDS = parseDurationSeconds(env.JWT_EXPIRES_IN);

export function signAccessToken(user: { id: string; email: string }): string {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    algorithm: TOKEN_ALGORITHM,
    subject: user.id,
    issuer: TOKEN_ISSUER,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/**
 * Verifies a token and returns its payload. Every failure — bad signature,
 * expired, wrong issuer, wrong algorithm, unexpected shape — becomes the same
 * 401, so a caller cannot use the response to probe why a token was rejected.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  let decoded: unknown;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [TOKEN_ALGORITHM],
      issuer: TOKEN_ISSUER,
    });
  } catch {
    throw ApiError.invalidToken();
  }

  if (typeof decoded === 'string' || decoded === null || typeof decoded !== 'object') {
    throw ApiError.invalidToken();
  }

  const { sub, email } = decoded as { sub?: unknown; email?: unknown };

  if (typeof sub !== 'string' || sub.length === 0 || typeof email !== 'string') {
    throw ApiError.invalidToken();
  }

  return { sub, email };
}
