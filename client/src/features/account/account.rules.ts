/**
 * What the account forms accept.
 *
 * The limits are the server's — `server/src/utils/validation.ts` for the name,
 * the phone, and the password, and `routes/user.routes.ts` for the address —
 * and they are written as one set of constants here so the rule the form
 * refuses on and the rule the API enforces cannot drift apart. The name, the
 * phone, and the password limits are the ones the auth forms already use, so
 * they are imported rather than restated.
 *
 * A broken rule carries a key rather than a sentence, and
 * `components/account/messages.ts` turns the key into copy in the language
 * being read. The keys the auth forms already own keep their words there: a
 * phone number is refused in the same sentence wherever it is typed.
 */

import { z } from 'zod';

import {
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PHONE_MAX_LENGTH,
  PHONE_PATTERN,
} from '@/features/auth/auth.rules';
import type { AddressInput } from '@/types/user';

/** The same ceilings `PATCH /api/users/me` and the address routes enforce. */
export const ADDRESS_LIMITS = {
  label: 40,
  fullName: 120,
  country: 60,
  city: 60,
  street: 160,
  postalCode: 20,
} as const;

export const profileFormSchema = z.object({
  firstName: z.string().trim().min(1, 'firstNameRequired').max(NAME_MAX_LENGTH, 'firstNameTooLong'),
  lastName: z.string().trim().min(1, 'lastNameRequired').max(NAME_MAX_LENGTH, 'lastNameTooLong'),
  phone: z
    .union([
      z.literal(''),
      z.string().trim().max(PHONE_MAX_LENGTH, 'phoneTooLong').regex(PHONE_PATTERN, 'phoneInvalid'),
    ])
    .optional()
    .transform((value) => (value === '' ? undefined : value)),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ProfileFieldName = 'firstName' | 'lastName' | 'phone';

/**
 * The password form. Both new boxes have to match, and the current password is
 * only checked for being present: whether it is right is the server's answer to
 * give, and guessing at it here would let somebody confirm a password guess
 * without a request.
 */
export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'currentRequired'),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, 'passwordShort')
      .max(PASSWORD_MAX_LENGTH, 'passwordLong'),
    confirmPassword: z.string().min(1, 'confirmRequired'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'passwordMismatch',
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
export type PasswordFieldName = 'currentPassword' | 'newPassword' | 'confirmPassword';

/**
 * An address. The phone is required here while it is optional on the profile:
 * this is the number a courier calls, and an order taken from a saved address
 * has to carry one.
 */
export const addressFormSchema = z.object({
  label: z.string().trim().max(ADDRESS_LIMITS.label, 'labelTooLong'),
  fullName: z
    .string()
    .trim()
    .min(1, 'fullNameRequired')
    .max(ADDRESS_LIMITS.fullName, 'fullNameTooLong'),
  phone: z
    .string()
    .trim()
    .min(1, 'phoneRequired')
    .max(PHONE_MAX_LENGTH, 'phoneTooLong')
    .regex(PHONE_PATTERN, 'phoneInvalid'),
  country: z
    .string()
    .trim()
    .min(1, 'countryRequired')
    .max(ADDRESS_LIMITS.country, 'countryTooLong'),
  city: z.string().trim().min(1, 'cityRequired').max(ADDRESS_LIMITS.city, 'cityTooLong'),
  street: z.string().trim().min(1, 'streetRequired').max(ADDRESS_LIMITS.street, 'streetTooLong'),
  postalCode: z.string().trim().max(ADDRESS_LIMITS.postalCode, 'postalCodeTooLong'),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
export type AddressFieldName = keyof AddressFormValues;

/** Which field each form can show a message under. */
export type AccountFieldErrors<Field extends string> = Partial<Record<Field, string>>;

/**
 * The form's values as the API takes them: an empty optional box is "not given"
 * rather than an empty string, which is what the server's `optionalText` reads
 * the same way.
 */
export function toAddressInput(values: AddressFormValues, isDefault: boolean): AddressInput {
  return {
    label: values.label === '' ? undefined : values.label,
    fullName: values.fullName,
    phone: values.phone,
    country: values.country,
    city: values.city,
    street: values.street,
    postalCode: values.postalCode === '' ? undefined : values.postalCode,
    isDefault,
  };
}
