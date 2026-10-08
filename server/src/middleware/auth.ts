/**
 * Bearer authentication. `requireAuth` turns an `Authorization: Bearer …`
 * header into `req.user` and rejects everything else with a 401.
 *
 * The account is read from the database on every request rather than trusted
 * from the token, so a deleted account stops working immediately instead of
 * when its token expires.
 *
 * `optionalAuth` reads the same header and never refuses: a request without a
 * token carries on as a visitor. It exists for the routes whose answer is the
 * same for everybody and only richer for a signed-in caller — a product's
 * reviews, where a customer's own votes come back marked as theirs.
 */

import type { RequestHandler } from 'express';

import { prisma } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/** The account fields an authenticated request may read. Never the hash. */
export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const AUTH_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
} as const;

/** Pulls the token out of `Authorization: Bearer <token>`. */
function readBearerToken(header: string | undefined): string | null {
  if (header === undefined) {
    return null;
  }

  const [scheme, ...rest] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || rest.length !== 1) {
    return null;
  }

  const token = rest[0].trim();

  return token.length === 0 ? null : token;
}

/** The account a verified token names, or an `ApiError` explaining why not. */
async function resolveUser(token: string): Promise<AuthUser> {
  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: AUTH_USER_SELECT,
  });

  if (user === null) {
    throw ApiError.invalidToken('This account no longer exists.');
  }

  return user;
}

export const requireAuth: RequestHandler = async (request, _response, next) => {
  try {
    const token = readBearerToken(request.headers.authorization);

    if (token === null) {
      throw ApiError.unauthorized('This request needs an access token.');
    }

    request.user = await resolveUser(token);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * The same authentication, made optional.
 *
 * The account is still read from the database and a token that names a deleted
 * account detaches rather than fails: a visitor whose account was closed while
 * their token was still in a browser tab should see the page, not an error about
 * a session they did not ask about. A token that cannot be verified at all is
 * treated the same way, for the same reason — this route has an answer for
 * everybody, and being signed in only adds to it.
 */
export const optionalAuth: RequestHandler = async (request, _response, next) => {
  const token = readBearerToken(request.headers.authorization);

  if (token === null) {
    next();
    return;
  }

  try {
    request.user = await resolveUser(token);
  } catch {
    // Deliberately silent; see the note above.
  }

  next();
};
