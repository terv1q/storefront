/**
 * The wishlist a visitor keeps before signing in.
 *
 * The wishlist proper belongs to an account, and the server is the only place it
 * can live. A visitor who has not registered has nowhere on the server to put
 * anything, and asking them to register before they can save the one thing they
 * are thinking about is how the list never gets started. So this store holds
 * their saved products in the browser, and it is emptied into the account the
 * first time they sign in — see `features/wishlist/useWishlistSync.ts`.
 *
 * It holds ids and nothing else. The page that draws them reads those products
 * back through the catalog, so a saved product shows today's name, today's
 * price, and the language being browsed, and a product that has been switched
 * off drops out instead of being offered as something to come back for.
 *
 * Persistence is deliberate rather than automatic, the way the cart does it:
 * every action writes the new list through `utils/storage`, which already
 * swallows a private-mode or quota failure. A wishlist that cannot be stored
 * still works for the visit.
 *
 * Newest first, because that is the order the server's own list answers in and
 * the page should not change its mind about the order depending on who is
 * looking at it.
 */

import { create } from 'zustand';

import { readWishlist, writeWishlist } from '@/utils/storage';

type WishlistState = {
  /** Saved product ids, newest first. */
  ids: string[];
  /** Saves a product that is not saved yet. Saving one twice changes nothing. */
  add: (productId: string) => void;
  /** Removes one product. */
  remove: (productId: string) => void;
  /** Removes several at once, for a bulk action. */
  removeMany: (productIds: readonly string[]) => void;
  /** Saves the product if it is not saved, removes it if it is. */
  toggle: (productId: string) => void;
  /** Empties the list, after it has been merged into an account. */
  clear: () => void;
};

/** Persists and returns the next list, so every action stores exactly what it set. */
function persisted(ids: string[]): string[] {
  writeWishlist(ids);

  return ids;
}

/** Reads what was stored. Anything that is not an id was dropped on the way in. */
function initialIds(): string[] {
  return readWishlist() ?? [];
}

export const useWishlistStore = create<WishlistState>((set) => ({
  ids: initialIds(),

  add: (productId) =>
    set((state) =>
      state.ids.includes(productId) ? {} : { ids: persisted([productId, ...state.ids]) },
    ),

  remove: (productId) =>
    set((state) => ({ ids: persisted(state.ids.filter((id) => id !== productId)) })),

  removeMany: (productIds) =>
    set((state) => {
      // A Set and not `includes` per id: a bulk action removes as many products
      // as the page holds, and the list is walked once.
      const removed = new Set(productIds);

      return { ids: persisted(state.ids.filter((id) => !removed.has(id))) };
    }),

  toggle: (productId) =>
    set((state) =>
      state.ids.includes(productId)
        ? { ids: persisted(state.ids.filter((id) => id !== productId)) }
        : { ids: persisted([productId, ...state.ids]) },
    ),

  clear: () => set({ ids: persisted([]) }),
}));
