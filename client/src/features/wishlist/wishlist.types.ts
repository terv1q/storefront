/**
 * Wishlist types for the client data layer.
 *
 * A wishlist holds products, not variants, and the server returns each one with
 * the same product shape the catalog uses — so a wishlist card and a catalog
 * card are the same object, and `Product` is imported rather than described
 * again.
 */

import type { Product } from '@/types/product';

export type { Product } from '@/types/product';

/** One saved product, with when it was saved. */
export type WishlistEntry = {
  id: string;
  createdAt: string;
  product: Product;
};

/** `GET /api/wishlist` answers with the entries in one envelope. */
export type WishlistResult = {
  items: WishlistEntry[];
};

/**
 * `POST /api/wishlist` answers with the entry. Saving something already saved is
 * not an error — the server answers 200 instead of 201 and reports which
 * happened through `created`.
 */
export type WishlistMutationResult = {
  entry: WishlistEntry;
  /** False when the product was already on the list. */
  created: boolean;
};
