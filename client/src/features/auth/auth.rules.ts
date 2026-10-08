/**
 * What the sign-in and registration forms accept, and how strong a password is.
 *
 * The limits are the server's own — `server/src/utils/validation.ts` holds the
 * same numbers, and the two are written as constants here so the counter under
 * the field and the rule the API enforces cannot drift apart. The client checks
 * before a request is made so a mistyped address is answered immediately; the
 * server checks again, because a client is not something to be trusted.
 *
 * A broken rule carries a key rather than a sentence — `'passwordRequired'`,
 * `'phoneInvalid'` — because the sentence depends on the language being read,
 * and the form turns the key into copy at render time. `ReviewForm` does the
 * same for the same reason.
 *
 * Nothing here reads, keeps, or logs a password beyond the string being
 * validated. There is no password in any store, no password in storage, and no
 * password in a cache key: the values live in the form's own state and leave it
 * with the request that submits them.
 */

import { z } from 'zod';

/** The same floors and ceilings `POST /api/auth/*` enforces. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const NAME_MAX_LENGTH = 60;
export const EMAIL_MAX_LENGTH = 254;
export const PHONE_MAX_LENGTH = 20;

/** A phone number as the API accepts it, which is the one the seed data uses. */
export const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;

/** The email rule, shared by both forms so the two cannot disagree. */
const emailRule = z
  .string()
  .trim()
  .min(1, 'emailRequired')
  .max(EMAIL_MAX_LENGTH, 'emailTooLong')
  .pipe(z.email('emailInvalid'));

/** An empty phone box is "not given", which is what the API expects. */
const phoneRule = z
  .union([
    z.literal(''),
    z.string().trim().max(PHONE_MAX_LENGTH, 'phoneTooLong').regex(PHONE_PATTERN, 'phoneInvalid'),
  ])
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const loginFormSchema = z.object({
  email: emailRule,
  password: z.string().min(1, 'passwordRequired'),
});

export const registerFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, 'firstNameRequired')
      .max(NAME_MAX_LENGTH, 'firstNameTooLong'),
    lastName: z.string().trim().min(1, 'lastNameRequired').max(NAME_MAX_LENGTH, 'lastNameTooLong'),
    email: emailRule,
    phone: phoneRule,
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, 'passwordShort')
      .max(PASSWORD_MAX_LENGTH, 'passwordLong'),
    confirmPassword: z.string().min(1, 'confirmRequired'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/** The fields both forms name in their errors. */
export type LoginFieldName = 'email' | 'password';
export type RegisterFieldName =
  LoginFieldName | 'firstName' | 'lastName' | 'phone' | 'confirmPassword';

export type PasswordStrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

/** What a password is still missing, as keys the form turns into copy. */
export type PasswordHint = 'length' | 'longer' | 'case' | 'number' | 'symbol';

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  /** How many of the five checks the password passes, for the meter's width. */
  score: number;
  /** The checks it fails, in the order they are worth adding. */
  hints: PasswordHint[];
};

/**
 * A reading of a password, not a verdict on it.
 *
 * The browser cannot know whether a password has appeared in a breach, and this
 * deliberately does not pretend to: it counts length, mixed case, a digit, and a
 * symbol, and reports which of those is missing. That is enough to steer someone
 * away from `12345678` without a check that would slow down the form or make a
 * promise the client cannot keep.
 */
export function passwordStrength(password: string): PasswordStrength {
  const hints: PasswordHint[] = [];

  if (password.length < PASSWORD_MIN_LENGTH) {
    hints.push('length');
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    hints.push('case');
  }

  if (!/\d/.test(password)) {
    hints.push('number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    hints.push('symbol');
  }

  // Past the minimum, more length is worth more than another symbol.
  if (password.length < 12) {
    hints.push('longer');
  }

  const score = 5 - hints.length;

  const level: PasswordStrengthLevel =
    password.length === 0 || score <= 1
      ? 'weak'
      : score === 2
        ? 'fair'
        : score === 3
          ? 'good'
          : 'strong';

  return { level, score, hints };
}
