/**
 * Account endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, take the account from `requireAuth`, call the service, and wrap the
 * result in the `{ data }` envelope the client expects. Every rule about an
 * account lives in the service.
 */

import type { RequestHandler } from 'express';

import {
  changePassword,
  createAddress,
  deleteAddress,
  listAddresses,
  updateAddress,
  updateProfile,
  type AddressInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '../services/user.service.js';
import { ApiError } from '../utils/apiError.js';

/** `requireAuth` guarantees this; the check keeps a reordered route honest. */
function currentUserId(request: { user?: { id: string } }): string {
  const user = request.user;

  if (user === undefined) {
    throw ApiError.unauthorized();
  }

  return user.id;
}

export const updateProfileHandler: RequestHandler = async (request, response, next) => {
  try {
    const user = await updateProfile(currentUserId(request), request.body as UpdateProfileInput);

    response.status(200).json({ data: user, message: 'Profile updated.' });
  } catch (error) {
    next(error);
  }
};

export const changePasswordHandler: RequestHandler = async (request, response, next) => {
  try {
    await changePassword(currentUserId(request), request.body as ChangePasswordInput);

    response.status(200).json({ data: null, message: 'Password changed.' });
  } catch (error) {
    next(error);
  }
};

export const listAddressesHandler: RequestHandler = async (request, response, next) => {
  try {
    const addresses = await listAddresses(currentUserId(request));

    response.status(200).json({ data: addresses });
  } catch (error) {
    next(error);
  }
};

export const createAddressHandler: RequestHandler = async (request, response, next) => {
  try {
    const address = await createAddress(currentUserId(request), request.body as AddressInput);

    response.status(201).json({ data: address, message: 'Address saved.' });
  } catch (error) {
    next(error);
  }
};

export const updateAddressHandler: RequestHandler = async (request, response, next) => {
  try {
    const { addressId } = request.params as unknown as { addressId: string };
    const address = await updateAddress(
      currentUserId(request),
      addressId,
      request.body as Partial<AddressInput>,
    );

    response.status(200).json({ data: address, message: 'Address updated.' });
  } catch (error) {
    next(error);
  }
};

export const deleteAddressHandler: RequestHandler = async (request, response, next) => {
  try {
    const { addressId } = request.params as unknown as { addressId: string };
    await deleteAddress(currentUserId(request), addressId);

    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
