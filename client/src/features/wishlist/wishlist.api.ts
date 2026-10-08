/**
 * Wishlist requests.
 *
 * All three need a signed-in account; without a valid token the api client gets
 * a 401 and both it and the caller see it. Removing answers 204 with no body, so
 * the function resolves with nothing and callers work from the fact that it did
 * not throw.
 *
 * `created` on the add result is derived from the response: the server answers
 * 201 when the product was saved and 200 when it was already there, and the api
 * client does not expose the raw status, so a message in the envelope marks the
 * first case.
 */

import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';

import type { WishlistEntry, WishlistMutationResult, WishlistResult } from './wishlist.types';

export const wishlistApi = {
  /** The account's saved products, most recently added first. */
  async list(): Promise<WishlistResult> {
    const response = await api.get<ApiResponse<WishlistResult>>('/wishlist');

    return response.data;
  },

  /** Saves a product. Saving it twice is accepted, not an error. */
  async add(productId: string): Promise<WishlistMutationResult> {
    const response = await api.post<ApiResponse<WishlistEntry> & { message?: string }>(
      '/wishlist',
      { productId },
    );

    return { entry: response.data, created: response.message !== undefined };
  },

  /** Removes a product. Answers 404 when it was not on the list. */
  async remove(productId: string): Promise<void> {
    await api.delete<void>(`/wishlist/${encodeURIComponent(productId)}`);
  },
};
