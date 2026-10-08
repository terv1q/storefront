/**
 * Moving a visitor's saved products into their account.
 *
 * A shopper who saved products before registering has them in the browser; the
 * account has its own list. When both exist they are one list, and this is the
 * hook that makes them so: it runs on the transition from "nobody is signed in"
 * to "somebody is", posts each id the browser holds, and clears the browser's
 * copy once they are in.
 *
 * It posts one id at a time rather than as a batch because the API has no batch
 * route, and the semantics of the single route are already what a merge needs:
 * saving a product that is already saved is accepted, not an error, so the
 * overlap between the two lists is resolved by the server's unique key rather
 * than by a rule written here.
 *
 * An id is only forgotten when the server refused it on its own terms — the
 * product no longer exists, or was already saved. A network failure, or a server
 * that is briefly unwell, leaves the id in the browser to be tried again on the
 * next visit rather than silently dropping something the shopper chose to keep.
 *
 * Nothing is rendered. It is mounted once, in `App`, and lives with the session.
 */

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { isApiError } from '@/types/api';
import { useWishlistStore } from '@/store/wishlist.store';
import { queryKeys } from '@/services/queryKeys';

import { useSession } from '@/features/auth/auth.queries';

import { wishlistApi } from './wishlist.api';

/**
 * Whether a failed save is worth forgetting the id over.
 *
 * A refusal the server made about this particular product — it does not exist,
 * it is no longer for sale — is final: trying again next visit would fail again.
 * Anything else (no answer, a server error, a rejected token) is a failure of
 * the moment, and the id stays put.
 */
function isSettledRefusal(error: unknown): boolean {
  return isApiError(error) && (error.status === 404 || error.status === 409);
}

export function WishlistSync(): null {
  const queryClient = useQueryClient();
  const session = useSession();
  const ids = useWishlistStore((state) => state.ids);
  const removeMany = useWishlistStore((state) => state.removeMany);

  /**
   * The merge runs once per sign-in. Without this the effect would run again for
   * every render that touches the store — including the one its own write causes
   * — and post the same ids a second time.
   */
  const mergedFor = useRef<string | null>(null);

  const userId = session.data?.id ?? null;

  useEffect(() => {
    if (userId === null || mergedFor.current === userId || ids.length === 0) {
      return;
    }

    mergedFor.current = userId;

    let cancelled = false;

    void (async () => {
      const settled: string[] = [];

      for (const productId of ids) {
        try {
          await wishlistApi.add(productId);
          settled.push(productId);
        } catch (error) {
          if (isSettledRefusal(error)) {
            settled.push(productId);
          }
        }
      }

      if (cancelled) {
        return;
      }

      if (settled.length > 0) {
        removeMany(settled);
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, ids, removeMany, queryClient]);

  return null;
}
