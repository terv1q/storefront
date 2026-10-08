/**
 * Shared TanStack Query policy.
 *
 * Every feature module reads its cache timings from here, so a list and the
 * detail it opens do not disagree about how long data stays fresh, and a
 * mutation that invalidates a key refetches what the rest of the app shows
 * immediately.
 *
 * Timings follow how often the data actually changes on this store: categories
 * are edited rarely, a product page changes when someone edits it, and an order
 * list changes whenever the customer does something.
 */

import { isApiError } from '@/types/api';

/** How long a cached value is served before a background refetch. */
export const STALE_TIME = {
  /** Catalog lists and search results. */
  products: 2 * 60 * 1000,
  /** Filter facets, which are counted from the same rows a catalog list reads. */
  facets: 2 * 60 * 1000,
  /** One product, its variants, and its specs. */
  productDetail: 5 * 60 * 1000,
  /** The featured row, which is curated rather than computed. */
  featured: 10 * 60 * 1000,
  /** Related products, which change only when the catalog does. */
  related: 10 * 60 * 1000,
  /** The category tree, used by the header and the catalog sidebar. */
  categories: 30 * 60 * 1000,
  /** Reviews for one product. */
  reviews: 5 * 60 * 1000,
  /** Search suggestions, which follow the catalog but are typed against often. */
  suggestions: 30 * 1000,
  /** The signed-in account. */
  session: 5 * 60 * 1000,
  /** The account's orders, which change while the customer watches. */
  orders: 30 * 1000,
  /** The wishlist, which this client changes itself. */
  wishlist: 60 * 1000,
  /**
   * Delivery estimates. A service area rarely changes, and the panel that reads
   * it is opened again on every product page, so the answer outlives one visit.
   */
  delivery: 30 * 60 * 1000,
} as const;

/** How long an unused cache entry is kept before it is dropped. */
export const GC_TIME = 30 * 60 * 1000;

/** Queries retry a network blip or a server failure, and nothing else. */
const MAX_QUERY_RETRIES = 2;

/**
 * A 401, 403, 404, 409, 422, or 429 will not answer differently on a second
 * attempt: the request was understood and refused. Retrying one only delays the
 * error the page has to show.
 */
export function retryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }

  if (!isApiError(error)) {
    return false;
  }

  // Status 0 is "the request never reached the server".
  return error.status === 0 || error.status >= 500;
}
