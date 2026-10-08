/**
 * Wishlist queries and mutations.
 *
 * A wishlist belongs to an account, so the list query only runs once a session
 * exists — otherwise every signed-out visitor would send a request that can only
 * answer 401. A visitor who has not signed in is not left out of the feature,
 * though: their saved products live in `store/wishlist.store.ts` until they
 * register, and the hooks here are what let a component ask "is this saved?"
 * without knowing which of the two is answering.
 *
 * Saving and removing something both invalidate the list rather than trusting
 * the patch. The server decides the order of the list and refuses to save a
 * product that is no longer on sale, so the answer is the only trustworthy
 * version of it — but the answer is a round trip, and a heart that waits for one
 * before it fills looks broken. Each mutation therefore patches the cached list
 * as it starts, rolls the patch back if the request fails, and invalidates once
 * it has settled. Every heart in the app reads the same cache entry, so they all
 * fill together.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth.queries';
import { useProductsByIds } from '@/features/products/products.queries';
import { strings } from '@/i18n/strings';
import { notify } from '@/store/toast.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import { isApiError } from '@/types/api';
import type { Product } from '@/types/product';

import { wishlistApi } from './wishlist.api';
import type { WishlistMutationResult, WishlistResult } from './wishlist.types';

export type { Product } from '@/types/product';

/** The account's saved products. Idle until somebody is signed in. */
export function useWishlist(): UseQueryResult<WishlistResult, unknown> {
  const session = useSession();

  return useQuery({
    queryKey: queryKeys.wishlist.list(),
    queryFn: () => wishlistApi.list(),
    enabled: session.data != null,
    staleTime: STALE_TIME.wishlist,
    retry: retryQuery,
  });
}

/** What saving a product takes: which one, and the card that is showing it. */
export type WishlistAddInput = {
  productId: string;
  /**
   * The product being saved, when the caller has it. Its presence is what lets
   * the list be patched before the server has answered, so the heart fills on
   * the click rather than on the response.
   */
  product?: Product;
};

/**
 * Saves a product. A product that is already saved leaves the list as it was.
 *
 * The optimistic entry carries a placeholder `id` — the server's own id for the
 * row arrives with the invalidation that follows — because every place that
 * draws an entry works from the product it holds.
 */
export function useAddToWishlist(): UseMutationResult<
  WishlistMutationResult,
  Error,
  WishlistAddInput
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId }: WishlistAddInput) => wishlistApi.add(productId),

    onMutate: async ({ productId, product }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist.all });

      const previous = queryClient.getQueryData<WishlistResult>(queryKeys.wishlist.list());

      if (product !== undefined) {
        const items = previous?.items ?? [];

        if (!items.some((entry) => entry.product.id === productId)) {
          queryClient.setQueryData<WishlistResult>(queryKeys.wishlist.list(), {
            items: [{ id: productId, createdAt: new Date().toISOString(), product }, ...items],
          });
        }
      }

      return { previous };
    },

    onError: (_error, _input, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.wishlist.list(), context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

/** Removes a product. A product that is not saved answers 404. */
export function useRemoveFromWishlist(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string) => {
      try {
        await wishlistApi.remove(productId);
      } catch (error) {
        // 404 means the product is not on the list, which is the state the
        // caller asked for. It happens when the same list is open in two places
        // and one of them has already done this, and reporting it as a failure
        // would put an error on a page that is showing exactly what was wanted.
        if (isApiError(error) && error.status === 404) {
          return;
        }

        throw error;
      }
    },

    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.wishlist.all });

      const previous = queryClient.getQueryData<WishlistResult>(queryKeys.wishlist.list());

      if (previous !== undefined) {
        queryClient.setQueryData<WishlistResult>(queryKeys.wishlist.list(), {
          items: previous.items.filter((entry) => entry.product.id !== productId),
        });
      }

      return { previous };
    },

    onError: (_error, _productId, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKeys.wishlist.list(), context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}

/**
 * The saved products, whoever is asking.
 *
 * One hook for the page and the bulk actions, so the guest list and the
 * account's list are the same `Product[]` to everything downstream. A guest's
 * ids are read back through the catalog, which is why the result can be a moment
 * behind a click: the store has the id immediately, and its product arrives with
 * the answer.
 */
export function useWishlistProducts(): {
  products: Product[];
  count: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  /** Re-runs whichever of the two requests the current list came from. */
  refetch: () => void;
} {
  const session = useSession();
  const isSignedIn = session.data != null;

  const guestIds = useWishlistStore((state) => state.ids);
  const wishlist = useWishlist();
  const byIds = useProductsByIds(isSignedIn ? [] : guestIds);

  if (isSignedIn) {
    const products = wishlist.data?.items.map((entry) => entry.product) ?? [];

    return {
      products,
      count: products.length,
      // A signed-in visitor has no list to draw until the account's answer
      // arrives; the query itself is idle only until a session exists.
      isLoading: wishlist.isLoading,
      isError: wishlist.isError,
      error: wishlist.error,
      refetch: () => void wishlist.refetch(),
    };
  }

  return {
    products: byIds.data?.items ?? [],
    count: guestIds.length,
    isLoading: guestIds.length > 0 && byIds.isLoading,
    isError: byIds.isError,
    error: byIds.error,
    refetch: () => void byIds.refetch(),
  };
}

/**
 * One heart's worth of wishlist: whether this product is saved, and what
 * pressing it does.
 *
 * This is the hook every heart in the app reads — the card's, the product
 * page's, the badge's — so there is one answer to "is this saved?" on the screen
 * rather than one per component. A guest's press writes to the store and every
 * heart repaints from the same subscription; a signed-in press patches the cache
 * every heart shares and the request follows.
 *
 * A press is also the one wishlist change that has no visible result of its own:
 * a heart filling is a change of colour, and a shopper who presses it from a
 * grid of twelve has no idea whether it worked. So each press answers with a
 * notification. It is sent here rather than in the six components that call
 * this, because the direction of the change — saved or removed — is decided by
 * the same code either way. The merge that runs at sign-in goes through the
 * store directly instead of through `toggle`, so moving a visitor's list into
 * their account does not announce anything: nobody pressed a heart.
 */
export function useWishlistState(): {
  ids: string[];
  count: number;
  isSignedIn: boolean;
  isSaved: (productId: string) => boolean;
  isPending: (productId: string) => boolean;
  /** True when the last save or removal failed. A guest's press cannot fail. */
  isError: boolean;
  toggle: (productId: string, product?: Product) => void;
  /** Takes one product off the list, whoever is looking at it. */
  remove: (productId: string) => void;
  /** Takes several off at once, for a bulk action. */
  removeMany: (productIds: readonly string[]) => void;
} {
  const session = useSession();
  const isSignedIn = session.data != null;

  const guestIds = useWishlistStore((state) => state.ids);
  const toggleGuest = useWishlistStore((state) => state.toggle);
  const removeGuest = useWishlistStore((state) => state.remove);
  const removeManyGuest = useWishlistStore((state) => state.removeMany);
  const wishlist = useWishlist();
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();

  const ids = isSignedIn ? (wishlist.data?.items.map((entry) => entry.product.id) ?? []) : guestIds;

  return {
    ids,
    count: ids.length,
    isSignedIn,
    isSaved: (productId) => ids.includes(productId),
    isPending: (productId) =>
      (add.isPending && add.variables?.productId === productId) ||
      (remove.isPending && remove.variables === productId),
    isError: add.isError || remove.isError,
    toggle: (productId, product) => {
      const saving = !ids.includes(productId);

      // The product's name when the caller had it — a card or a product page
      // does, a cart line does not — and the plain sentence when it did not.
      const savedMessage =
        product === undefined
          ? strings.toast.wishlistSavedPlain
          : strings.toast.wishlistSaved(product.name);
      const removedMessage =
        product === undefined
          ? strings.toast.wishlistRemovedPlain
          : strings.toast.wishlistRemoved(product.name);

      notify(saving ? savedMessage : removedMessage, { tone: saving ? 'success' : 'info' });

      if (!isSignedIn) {
        toggleGuest(productId);
        return;
      }

      if (saving) {
        add.mutate({ productId, product });
      } else {
        remove.mutate(productId);
      }
    },
    remove: (productId) => {
      if (!isSignedIn) {
        removeGuest(productId);
        return;
      }

      remove.mutate(productId);
    },
    removeMany: (productIds) => {
      if (productIds.length === 0) {
        return;
      }

      // One notification for the batch rather than one per product: a bulk
      // removal is a single thing the shopper asked for, and it is one request
      // per product under the hood.
      notify(strings.toast.wishlistRemovedMany(productIds.length), { tone: 'info' });

      if (!isSignedIn) {
        removeManyGuest(productIds);
        return;
      }

      // The API takes one product per request, so a bulk removal is one request
      // per product. They are independent, and each patches the cached list as
      // it starts, so the rows leave the page together rather than in sequence.
      for (const productId of productIds) {
        remove.mutate(productId);
      }
    },
  };
}
