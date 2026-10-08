/**
 * Registration, login, and current user.
 *
 * Each route declares the Zod schema for its body, so `validate` rejects a
 * malformed request before a handler or the database sees it. The schemas are
 * the single definition of what a valid payload is; the error handler turns a
 * failure into a 422 with a `{ field: message }` map.
 */

import { Router } from 'express';
import { z } from 'zod';

import { loginHandler, meHandler, registerHandler } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_LIMIT_WINDOW_MS, rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { emailField, nameField, passwordField, phoneField } from '../utils/validation.js';

/**
 * Password guessing is answered with a small delay rather than a lockout: ten
 * attempts per address per window is far above what a person needs and far
 * below what a dictionary run needs.
 */
const loginLimiter = rateLimit({
  name: 'auth:login',
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  code: 'too_many_login_attempts',
  message: 'Too many sign-in attempts. Please wait a few minutes and try again.',
});

/** Account creation, which is rare for a real customer and cheap to abuse. */
const registerLimiter = rateLimit({
  name: 'auth:register',
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 5,
  code: 'too_many_registrations',
  message: 'Too many accounts created from this address. Please try again later.',
});

/**
 * Strict, so a payload that tries to name something the registration does not
 * choose — a role, an id, a verified flag — is refused rather than silently
 * dropped. Zod would strip those fields anyway, and the service writes every
 * column explicitly, so nothing was ever at risk; refusing makes the boundary
 * legible to the client that wrote the field instead of leaving it guessing.
 */
const registerSchema = z.strictObject(
  {
    firstName: nameField('first name'),
    lastName: nameField('last name'),
    email: emailField,
    // An empty string is treated as "not given" rather than as a bad number.
    phone: z
      .union([phoneField, z.literal('')])
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    password: passwordField,
  },
  { error: 'This registration carries a field the form does not take.' },
);

const loginSchema = z.strictObject(
  {
    email: emailField,
    password: z.string().min(1, 'Enter your password.'),
  },
  { error: 'This sign-in carries a field the form does not take.' },
);

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate({ body: registerSchema }), registerHandler);
authRouter.post('/login', loginLimiter, validate({ body: loginSchema }), loginHandler);
authRouter.get('/me', requireAuth, meHandler);
