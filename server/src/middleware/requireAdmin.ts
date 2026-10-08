/**
 * Admin-only routes.
 *
 * The schema has no role column, and adding one is a Stage 9+ decision, so
 * membership is an allowlist of email addresses in `ADMIN_EMAILS`. The list is
 * empty by default, which means no account is an admin until one is named.
 *
 * Runs after `requireAuth`, so `req.user` is already populated.
 */

import type { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

const ADMIN_EMAILS = new Set(
  env.ADMIN_EMAILS.split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0),
);

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.has(email.toLowerCase());
}

export const requireAdmin: RequestHandler = (request, _response, next) => {
  const user = request.user;

  if (user === undefined) {
    next(ApiError.unauthorized('This request needs an access token.'));
    return;
  }

  if (!isAdminEmail(user.email)) {
    next(ApiError.forbidden('This endpoint is limited to administrators.'));
    return;
  }

  next();
};
