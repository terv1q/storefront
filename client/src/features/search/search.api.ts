/**
 * Search requests.
 *
 * `GET /api/search` takes the same filters as the product list, so a scoped
 * search and a category page's search are the same call. `GET /api/search/
 * suggestions` takes only a term and answers with a short list for the dropdown.
 *
 * A term shorter than two characters is not sent: the server would answer with
 * an empty page without touching the database, and the request would be wasted.
 */

import { toFacetsQuery } from '@/features/products/products.api';
import type { ProductFacets } from '@/features/products/products.types';
import { api } from '@/services/api';
import type { ApiResponse, QueryParams } from '@/types/api';
import type { ProductListQuery } from '@/types/product';

import type { SearchPage, SuggestionResult } from './search.types';

export const searchApi = {
  /** Ranked product results. A blank term answers with an empty page. */
  async search(query: ProductListQuery = {}): Promise<SearchPage> {
    const response = await api.get<ApiResponse<SearchPage>>('/search', {
      query: { ...query } as QueryParams,
    });

    return response.data;
  },

  /**
   * What the filter panel can offer for a search.
   *
   * The counts describe the products the term actually matched, narrowed by the
   * filters the shopper has set — not by the attributes, which are left out for
   * the same reason the listing's facets leave them out: a count computed with its
   * own selection applied shows every unselected value as zero. The query is
   * narrowed before it is sent so the request and the cache key are built from the
   * same object.
   */
  async facets(query: ProductListQuery = {}): Promise<ProductFacets> {
    const response = await api.get<ApiResponse<ProductFacets>>('/search/facets', {
      query: toFacetsQuery(query) as QueryParams,
    });

    return response.data;
  },

  /** Product, brand, and category matches for the search box. */
  async suggestions(term: string, signal?: AbortSignal): Promise<SuggestionResult> {
    const response = await api.get<ApiResponse<SuggestionResult>>('/search/suggestions', {
      query: { q: term.trim() },
      signal,
    });

    return response.data;
  },
};
