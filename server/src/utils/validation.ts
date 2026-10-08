/**
 * Field schemas shared by the request bodies.
 *
 * An email address and a phone number mean the same thing at registration and
 * at checkout, so the rules live here rather than being written twice with a
 * chance of drifting apart.
 */

import { z } from 'zod';

import { MAX_PASSWORD_BYTES } from './password.js';

/** Shorter than this and a password is trivially guessable. */
export const PASSWORD_MIN_LENGTH = 8;

export const emailField = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254, 'This email address is too long.')
  .pipe(z.email('Enter a valid email address.'));

export const phoneField = z
  .string()
  .trim()
  .max(20, 'This phone number is too long.')
  .regex(/^\+?[\d\s()-]{7,20}$/, 'Enter a valid phone number, for example +998 90 123 45 67.');

export const passwordField = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(MAX_PASSWORD_BYTES, `Use at most ${MAX_PASSWORD_BYTES} characters.`);

export function nameField(label: string, maxLength = 60) {
  return z
    .string()
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(maxLength, `This ${label} is too long.`);
}

/**
 * An optional free-text field. An empty string counts as "not given", which is
 * what a form submits when the shopper leaves the box alone.
 *
 * `null` counts as "not given" too, and deliberately. JSON has one spelling for
 * absence and a client that builds its own body will use it: a field that is
 * `null` because nothing was chosen is not a value, and refusing it with "Invalid
 * input" tells the shopper their postcode is wrong when they never gave one. This
 * was a real bug — the checkout body sent `promoCode: null` when no code had been
 * entered, and every order without a promo code was refused as if the code were
 * bad.
 */
export function optionalText(maxLength: number, message: string) {
  return z
    .union([z.string().trim().max(maxLength, message), z.literal(''), z.null()])
    .optional()
    .transform((value) =>
      value === '' || value === undefined || value === null ? undefined : value,
    );
}
