/**
 * Promo routes.
 *
 * Checking a code is public: a shopper who has not signed in still has a cart,
 * and telling them a code is valid is not a privilege of having an account. The
 * rate limit is what keeps the endpoint from being a place to guess codes —
 * a code is short and typed by hand, so an unlimited endpoint would let anybody
 * enumerate the table.
 *
 * The subtotal travels in the body. It is the shopper's basket as their browser
 * counts it, which is a preview and is treated as one: nothing is charged from
 * it, and the checkout recomputes the subtotal from the database before it
 * applies the same code.
 */

import { Router } from 'express';
import { z } from 'zod';

import { validatePromoCodeHandler } from '../controllers/promo.controller.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

/** Longest code the field accepts, before normalisation. */
const MAX_CODE_LENGTH = 32;

/** Largest subtotal the preview accepts, in minor units. */
const MAX_SUBTOTAL = 2_147_483_647;

/**
 * Guessing a code is cheap for the guesser, so the limit is per address rather
 * than per account: the same browser trying thirty codes in a minute is the
 * pattern worth stopping, whether or not anybody is signed in.
 */
const promoCheckLimiter = rateLimit({
  name: 'promos:validate',
  windowMs: 60 * 1000,
  max: 20,
  code: 'too_many_promo_checks',
  message: 'Too many codes tried in a short time. Please try again shortly.',
});

/**
 * Strict: the body is a code and a basket the browser counted, and nothing else.
 * A field named `discount` or `amount` is refused rather than ignored, because
 * a caller who sends one believes it does something — and the answer it would
 * be believing in is the one the checkout reads from the database.
 */
const validatePromoSchema = z.strictObject(
  {
    code: z
      .string()
      .trim()
      .min(1, 'Enter a promo code.')
      .max(MAX_CODE_LENGTH, 'This code is too long.'),
    subtotal: z.coerce
      .number({ error: 'Use a whole number.' })
      .int('Use a whole number.')
      .min(0, 'The basket total cannot be negative.')
      .max(MAX_SUBTOTAL, 'This basket is too large.'),
  },
  { error: 'This request carries a field the check does not take.' },
);

export const promoRouter = Router();

promoRouter.post(
  '/validate',
  promoCheckLimiter,
  validate({ body: validatePromoSchema }),
  validatePromoCodeHandler,
);
