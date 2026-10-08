/**
 * Account routes. Every one of them needs a signed-in customer and acts on the
 * account the token names, so the whole router sits behind `requireAuth` and no
 * route takes a user id.
 *
 * The address schemas mirror the shipping half of the checkout schema field for
 * field, because a saved address is filled into that checkout: a rule that held
 * at checkout and not here would let an account save an address it could not
 * then order to.
 *
 * Changing a password is verified against the current one and costs a bcrypt
 * comparison, so it is limited per account — a stolen token should not be a
 * free password-guessing oracle.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  changePasswordHandler,
  createAddressHandler,
  deleteAddressHandler,
  listAddressesHandler,
  updateAddressHandler,
  updateProfileHandler,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_LIMIT_WINDOW_MS, accountKey, rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { nameField, optionalText, passwordField, phoneField } from '../utils/validation.js';

const passwordLimiter = rateLimit({
  name: 'users:password',
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 10,
  key: accountKey,
  code: 'too_many_password_attempts',
  message: 'Too many password attempts. Please wait a few minutes and try again.',
});

const updateProfileSchema = z.object({
  firstName: nameField('first name'),
  lastName: nameField('last name'),
  // An empty string is treated as "not given" rather than as a bad number.
  phone: z
    .union([phoneField, z.literal('')])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: passwordField,
});

const addressFields = {
  label: optionalText(40, 'This label is too long.'),
  fullName: nameField('name', 120),
  phone: phoneField,
  country: z.string().trim().min(1, 'Enter your country.').max(60, 'This country is too long.'),
  city: z.string().trim().min(1, 'Enter your city.').max(60, 'This city is too long.'),
  street: z
    .string()
    .trim()
    .min(1, 'Enter your street address.')
    .max(160, 'This address is too long.'),
  postalCode: optionalText(20, 'This postal code is too long.'),
  isDefault: z.boolean().optional(),
};

const createAddressSchema = z.object(addressFields);

/**
 * The whole address is optional on an update: the client sends the fields it
 * changed, and a field it leaves out keeps its stored value.
 */
const updateAddressSchema = z
  .object(addressFields)
  .partial()
  .refine((value) => Object.keys(value).length > 0, 'Send at least one field to change.');

const addressIdParamsSchema = z.object({
  addressId: z.uuid('Choose a valid address.'),
});

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.patch('/me', validate({ body: updateProfileSchema }), updateProfileHandler);

userRouter.patch(
  '/me/password',
  passwordLimiter,
  validate({ body: changePasswordSchema }),
  changePasswordHandler,
);

userRouter.get('/me/addresses', listAddressesHandler);

userRouter.post('/me/addresses', validate({ body: createAddressSchema }), createAddressHandler);

userRouter.patch(
  '/me/addresses/:addressId',
  validate({ params: addressIdParamsSchema, body: updateAddressSchema }),
  updateAddressHandler,
);

userRouter.delete(
  '/me/addresses/:addressId',
  validate({ params: addressIdParamsSchema }),
  deleteAddressHandler,
);
