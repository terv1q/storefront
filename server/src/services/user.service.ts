/**
 * Account self-service: the profile, the password, and the delivery addresses.
 *
 * These are the first endpoints that let a customer change their own record.
 * Three rules shape them:
 *
 *   - the account is always taken from the session and never from the request,
 *     so a body carrying somebody else's id changes nothing,
 *   - an address is read, changed, and deleted by the pair (owner, id) rather
 *     than by id, so a stranger's address id answers 404 instead of 403,
 *   - the email address is not editable here. It is the sign-in identity, this
 *     version has no way to verify a new one, and a typo would lock the account
 *     out of its own orders.
 *
 * A wrong current password is answered as a validation failure on that field
 * rather than as a 401: the session is fine, one box is not, and a 401 would
 * make the client throw the session away over a typo.
 */

import { prisma } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { toPublicUser, type PublicUser } from './auth.service.js';

/** What changing the profile accepts. The email is read-only; see the note above. */
export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  phone?: string | undefined;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

/** A saved delivery address, as the client models it. */
export type AddressDto = {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string | null;
  isDefault: boolean;
};

export type AddressInput = {
  label?: string | undefined;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode?: string | undefined;
  isDefault?: boolean | undefined;
};

type AddressRow = {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string | null;
  isDefault: boolean;
};

function toAddress(row: AddressRow): AddressDto {
  return {
    id: row.id,
    userId: row.userId,
    label: row.label,
    fullName: row.fullName,
    phone: row.phone,
    country: row.country,
    city: row.city,
    street: row.street,
    postalCode: row.postalCode,
    isDefault: row.isDefault,
  };
}

/** Changes the name and the phone number. The email is left alone. */
export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone ?? null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return toPublicUser(user);
}

/**
 * Changes the password, given the current one.
 *
 * The new password is hashed with the same cost the registration path uses. An
 * existing token stays valid: this version has no refresh tokens and no session
 * table, so there is nothing to revoke, and forcing every signed-in device to
 * sign in again is not something this endpoint can do.
 */
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });

  if (user === null) {
    throw ApiError.invalidToken('This account no longer exists.');
  }

  const matches = await verifyPassword(input.currentPassword, user.passwordHash);

  if (!matches) {
    throw ApiError.validationFailed({
      fields: { currentPassword: 'This is not your current password.' },
    });
  }

  if (input.newPassword === input.currentPassword) {
    throw ApiError.validationFailed({
      fields: { newPassword: 'Choose a password you have not used here.' },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(input.newPassword) },
  });
}

/** The saved addresses, the default one first. */
export async function listAddresses(userId: string): Promise<AddressDto[]> {
  const rows = await prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
  });

  return rows.map(toAddress);
}

/**
 * Adds an address.
 *
 * The first address an account saves becomes its default, because an account
 * with one address has no choice to make. Any later attempt to set a default
 * clears the flag on the others in the same transaction, so there is never more
 * than one.
 */
export async function createAddress(userId: string, input: AddressInput): Promise<AddressDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.count({ where: { userId } });
    const isDefault = input.isDefault ?? existing === 0;

    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const row = await tx.address.create({
      data: {
        userId,
        label: input.label ?? null,
        fullName: input.fullName,
        phone: input.phone,
        country: input.country,
        city: input.city,
        street: input.street,
        postalCode: input.postalCode ?? null,
        isDefault,
      },
    });

    return toAddress(row);
  });
}

/**
 * Changes an address.
 *
 * Fields the request does not carry are left as they are, so the client can send
 * the whole form without having to read the row first. Setting `isDefault` true
 * clears the flag on the account's other addresses.
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: Partial<AddressInput>,
): Promise<AddressDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.address.findFirst({ where: { id: addressId, userId } });

    if (existing === null) {
      throw ApiError.notFound('This address does not exist.');
    }

    if (input.isDefault === true) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const row = await tx.address.update({
      where: { id: addressId },
      data: {
        label: input.label === undefined ? existing.label : (input.label ?? null),
        fullName: input.fullName ?? existing.fullName,
        phone: input.phone ?? existing.phone,
        country: input.country ?? existing.country,
        city: input.city ?? existing.city,
        street: input.street ?? existing.street,
        postalCode: input.postalCode === undefined ? existing.postalCode : input.postalCode,
        isDefault: input.isDefault ?? existing.isDefault,
      },
    });

    return toAddress(row);
  });
}

/**
 * Removes an address.
 *
 * Deleting the default leaves the account with no default rather than promoting
 * one: the table records no creation time, so "the newest" is not a fact it
 * holds, and promoting a row chosen by id would be a rule nobody could predict.
 * The account page offers to make another address the default instead.
 */
export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const deleted = await prisma.address.deleteMany({ where: { id: addressId, userId } });

  if (deleted.count === 0) {
    throw ApiError.notFound('This address does not exist.');
  }
}
