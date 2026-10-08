/**
 * Wishlist endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, take the account from `requireAuth`, and call the service.
 */

import type { RequestHandler } from 'express';

import { addToWishlist, listWishlist, removeFromWishlist } from '../services/wishlist.service.js';
import { ApiError } from '../utils/apiError.js';
import type { CatalogLocale } from '../utils/locale.js';

/** `requireAuth` guarantees this; the check keeps a reordered route honest. */
function currentUserId(request: { user?: { id: string } }): string {
  const user = request.user;

  if (user === undefined) {
    throw ApiError.unauthorized();
  }

  return user.id;
}

export const listWishlistHandler: RequestHandler = async (request, response, next) => {
  try {
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const items = await listWishlist(currentUserId(request), lang);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};

export const addToWishlistHandler: RequestHandler = async (request, response, next) => {
  try {
    const { productId } = request.body as { productId: string };
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const result = await addToWishlist(currentUserId(request), productId, lang);

    response.status(result.created ? 201 : 200).json({
      data: result.entry,
      // A product that was already saved answers 200 without the message,
      // because nothing changed.
      ...(result.created ? { message: 'Saved to your wishlist.' } : {}),
    });
  } catch (error) {
    next(error);
  }
};

export const removeFromWishlistHandler: RequestHandler = async (request, response, next) => {
  try {
    const { productId } = request.params as unknown as { productId: string };
    await removeFromWishlist(currentUserId(request), productId);

    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
