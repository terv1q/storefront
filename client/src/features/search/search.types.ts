/**
 * Search types.
 *
 * Search returns the same `Product` shape as the catalog, so `Product` and
 * `Paginated` are re-exported rather than restated. What this file adds is the
 * suggestion shape, which exists only for the search box.
 */

import type { Paginated } from '@/types/api';
import type { Product } from '@/types/product';

export type { Product, ProductListQuery, ProductSort } from '@/types/product';
export type { Paginated } from '@/types/api';

/** A page of search results, as `GET /api/search` returns it. */
export type SearchPage = Paginated<Product>;

export type SuggestionKind = 'product' | 'brand' | 'category';

/** One line of the suggestion dropdown. */
export type Suggestion = {
  type: SuggestionKind;
  /** What the dropdown shows. */
  label: string;
  /** The slug the client turns into a link or a scoped search. */
  slug: string;
  imageUrl: string | null;
  /**
   * Price in minor units, on a product suggestion only. A brand and a category
   * have no single price, so the field is absent for them rather than zero.
   */
  price?: number | null;
  /** The price a product is reduced from, when it is on sale. */
  compareAtPrice?: number | null;
  /** The currency `price` and `compareAtPrice` are in. */
  currency?: string;
};

/** `GET /api/search/suggestions` answers with a bare list. */
export type SuggestionResult = {
  items: Suggestion[];
};
