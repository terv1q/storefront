/**
 * The cart's view of the catalog.
 *
 * One query answers "what do my lines cost and how many are left" for the whole
 * basket, through the listing's `ids` filter: one request whatever the cart
 * holds. It shares its cache entry with every other component asking about the
 * same set of products — the saved-products page asks the same question — so
 * opening the cart after the wishlist does not fetch the rows twice.
 *
 * It is deliberately stale on arrival. The point of the check is that the cart's
 * copy of a price is old, so the answer is refetched every time the page opens
 * rather than trusted for two minutes like a catalog list. That is one request
 * on a page whose whole job is to catch a change.
 */

import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { orderProductsByIds } from '@/features/products/orderProductsByIds';
import { productsApi } from '@/features/products/products.api';
import type { ProductListPage } from '@/features/products/products.types';
import { queryKeys } from '@/services/queryKeys';
import { retryQuery } from '@/services/queryOptions';
import type { Product } from '@/types/product';

import { findCartIssues, type CartIssue } from './cart.revalidate';
import type { CartItem } from './cart.types';

/** The distinct products the cart holds, in the order the lines are in. */
export function cartProductIds(items: readonly CartItem[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];

  for (const item of items) {
    if (!seen.has(item.productId)) {
      seen.add(item.productId);
      ids.push(item.productId);
    }
  }

  return ids;
}

/**
 * Today's version of the cart's products.
 *
 * A product that is no longer on sale is simply absent from the answer, which is
 * what makes "switched off" a fact the page can act on rather than a silent
 * difference in list length.
 */
export function useCartProducts(
  items: readonly CartItem[],
): UseQueryResult<ProductListPage, unknown> {
  const ids = cartProductIds(items);

  return useQuery({
    queryKey: queryKeys.products.byIds(ids),
    queryFn: () => productsApi.list({ ids: [...ids], limit: ids.length, page: 1 }),
    enabled: ids.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: retryQuery,
    select: (page) => ({ ...page, items: orderProductsByIds(page.items, ids) }),
  });
}

export type CartRevalidation = {
  /** Products as the catalog has them now, for the one-click price fix. */
  products: Product[];
  issues: CartIssue[];
  isLoading: boolean;
  isError: boolean;
  refresh: () => void;
};

/**
 * What the cart page mounts to check itself.
 *
 * A guest's cart and a signed-in customer's cart are checked the same way: the
 * listing is public, so there is nothing here that requires an account.
 */
export function useCartRevalidation(items: readonly CartItem[]): CartRevalidation {
  const query = useCartProducts(items);
  const products = query.data?.items ?? [];

  return {
    products,
    issues: findCartIssues(items, products),
    isLoading: query.isLoading && items.length > 0,
    isError: query.isError,
    refresh: () => {
      void query.refetch();
    },
  };
}
