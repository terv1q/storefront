/**
 * Catalog requests.
 *
 * Each function calls the shared `api` client, unwraps the `{ data }` envelope,
 * and returns the domain object the pages render. Nothing here knows about
 * TanStack Query, caching, or components: the hooks in `products.queries.ts`
 * are the layer that does.
 *
 * The endpoints are:
 *   GET /api/products            list with filters, sorting, and paging
 *   GET /api/products/:slug      one product with images, variants, and specs
 *   GET /api/products/:slug/related
 *   GET /api/products/featured
 *   POST /api/products/:slug/notify
 *   GET /api/categories          the nesting tree with product counts
 *   GET /api/categories/:slug    one category with its breadcrumbs
 */

import { api } from '@/services/api';
import type { ApiResponse, QueryParams } from '@/types/api';
import type { ProductListQuery } from '@/types/product';

import type {
  CategoryDetail,
  CategoryTreeResult,
  ProductDetail,
  ProductFacets,
  ProductListPage,
  ProductListResult,
} from './products.types';

/**
 * The list query is already in the shape a query string takes — the server
 * accepts exactly these names. The cast is only because the domain type has no
 * index signature; the api client drops empty values itself.
 */
function toQueryParams(query: ProductListQuery): QueryParams {
  return { ...query } as QueryParams;
}

/**
 * The part of a listing query the facets endpoint answers.
 *
 * The endpoint takes the filters, because they decide what is being counted, and
 * not the ordering, the page, or the attributes themselves. Narrowing the query
 * here rather than in the component means the request and the cache key are
 * built from the same object, so paging or re-sorting a listing cannot look like
 * a different set of facets and refetch what it already had.
 */
export function toFacetsQuery(query: ProductListQuery): ProductListQuery {
  const { category, q, brand, minPrice, maxPrice, minRating, inStock, onSale } = query;

  return { category, q, brand, minPrice, maxPrice, minRating, inStock, onSale };
}

export const productsApi = {
  /** One page of the catalog. */
  async list(query: ProductListQuery = {}): Promise<ProductListPage> {
    const response = await api.get<ApiResponse<ProductListPage>>('/products', {
      query: toQueryParams(query),
    });

    return response.data;
  },

  /**
   * What the filter panel can offer for a listing.
   *
   * The counts describe the set the attribute filters would leave, which is what
   * makes them useful: a count computed with the attributes already applied
   * would show every unselected option as zero.
   */
  async facets(query: ProductListQuery = {}): Promise<ProductFacets> {
    const response = await api.get<ApiResponse<ProductFacets>>('/products/facets', {
      query: toQueryParams(toFacetsQuery(query)),
    });

    return response.data;
  },

  /** One product by slug. A slug that does not exist answers 404. */
  async detail(slug: string): Promise<ProductDetail> {
    const response = await api.get<ApiResponse<ProductDetail>>(
      `/products/${encodeURIComponent(slug)}`,
    );

    return response.data;
  },

  /** Products from the same category, then the same brand, minus the product itself. */
  async related(slug: string, limit?: number): Promise<ProductListResult> {
    const response = await api.get<ApiResponse<ProductListResult>>(
      `/products/${encodeURIComponent(slug)}/related`,
      { query: { limit } },
    );

    return response.data;
  },

  /** The curated row on the home page. */
  async featured(limit?: number): Promise<ProductListResult> {
    const response = await api.get<ApiResponse<ProductListResult>>('/products/featured', {
      query: { limit },
    });

    return response.data;
  },

  /** The whole active category tree, each node carrying its product total. */
  async categoryTree(): Promise<CategoryTreeResult> {
    const response = await api.get<ApiResponse<CategoryTreeResult>>('/categories');

    return response.data;
  },

  /** One category with its children and its breadcrumb chain. */
  async category(slug: string): Promise<CategoryDetail> {
    const response = await api.get<ApiResponse<CategoryDetail>>(
      `/categories/${encodeURIComponent(slug)}`,
    );

    return response.data;
  },

  /**
   * Leaves an address to be told when a sold-out product returns.
   *
   * The server answers the same thing whether the address was already waiting or
   * has just started waiting, so the caller has one success case rather than two.
   * The address is not tied to an account, so the request is sent without a token.
   */
  async notify(slug: string, email: string): Promise<void> {
    await api.post<ApiResponse<{ subscribed: boolean }>>(
      `/products/${encodeURIComponent(slug)}/notify`,
      { email },
      { auth: false },
    );
  },
};
