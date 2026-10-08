/**
 * The product data layer as pages consume it.
 *
 * Pages import these hooks rather than the ones in `features/products`, so a
 * page never names a query key, a `staleTime`, or a `UseQueryResult`. What comes
 * back is the data the page renders plus the few flags it branches on: is this
 * the first load, is a refetch running, did it fail, and what should be shown
 * when it failed.
 *
 * The catalog hooks below are the only place a page can see `unknown` errors, so
 * the message is resolved here instead of in every page.
 */

import { isApiError } from '@/types/api';
import type { ProductListQuery } from '@/types/product';
import { strings } from '@/i18n/strings';

import {
  useCategory as useCategoryQuery,
  useCategoryTree as useCategoryTreeQuery,
  useFeaturedProducts as useFeaturedProductsQuery,
  useProduct as useProductQuery,
  useProductFacets as useProductFacetsQuery,
  useProductList,
  useRelatedProducts as useRelatedProductsQuery,
} from '@/features/products/products.queries';
import type {
  CategoryDetail,
  CategoryNode,
  CategoryTreeResult,
  ProductDetail,
  ProductFacets,
  ProductListPage,
  ProductListResult,
} from '@/features/products/products.types';
import {
  useSearchFacets as useSearchFacetsQuery,
  useSearchResults as useSearchResultsQuery,
} from '@/features/search/search.queries';

/**
 * What every hook here returns. `isLoading` is the first load only — a page
 * shows a skeleton for it — while `isFetching` also covers the background
 * refetch that keeps the current data on screen.
 */
export type Resource<T> = {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown;
  /** The server's message, or a generic one. Never empty. */
  errorMessage: string | null;
  refetch: () => void;
};

export type ProductListResource = Resource<ProductListPage> & {
  /** The page of products, always an array once the first load has finished. */
  products: ProductListPage['items'] | undefined;
  total: number;
  page: number;
  totalPages: number;
  /** True when the request succeeded and matched nothing. */
  isEmpty: boolean;
};

export type ProductCollectionResource = Resource<ProductListResult> & {
  products: ProductListResult['items'] | undefined;
  isEmpty: boolean;
};

/** The message a page shows under an error. Falls back to the shared copy. */
export function errorMessageOf(error: unknown): string {
  if (isApiError(error) && error.message) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return strings.errors.generic;
}

/**
 * One page of the catalog, with the filters, sorting, and paging the caller
 * asked for. The previous page stays in `products` while the next one loads, so
 * a grid can dim instead of collapsing.
 */
export function useProducts(query: ProductListQuery = {}): ProductListResource {
  const result = useProductList(query);
  const items = result.data?.items;

  return {
    products: items,
    total: result.data?.total ?? 0,
    page: result.data?.page ?? query.page ?? 1,
    totalPages: result.data?.totalPages ?? 0,
    isEmpty: result.isSuccess && items !== undefined && items.length === 0,
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/**
 * What the filter panel can offer for a listing.
 *
 * A page reads the brands, the price bounds, and the attribute values from here
 * and never counts them itself: the counts describe the whole filtered set, and
 * the page only ever holds one page of it.
 */
export function useProductFacets(query: ProductListQuery = {}): Resource<ProductFacets> {
  const result = useProductFacetsQuery(query);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/**
 * One page of a search, shaped like a page of the catalog.
 *
 * A search result is a listing that happens to be ranked by how well each product
 * matched rather than by an editorial order, so it answers with the same fields
 * and is consumed by the same components. What differs is that an empty result is
 * a normal answer here — nobody owes the shopper a match for their words — which
 * is why the page distinguishes a term that matched nothing from a term that was
 * never sent.
 */
export function useSearchResults(query: ProductListQuery = {}): ProductListResource {
  const result = useSearchResultsQuery(query);
  const items = result.data?.items;

  return {
    products: items,
    total: result.data?.total ?? 0,
    page: result.data?.page ?? query.page ?? 1,
    totalPages: result.data?.totalPages ?? 0,
    isEmpty: result.isSuccess && items !== undefined && items.length === 0,
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/**
 * What the filter panel can offer for a search.
 *
 * The counts describe the products the term matched, narrowed by the filters the
 * shopper has set, so the panel offers the same control over a search as it does
 * over a listing — and the same panel draws both.
 */
export function useSearchFacets(query: ProductListQuery = {}): Resource<ProductFacets> {
  const result = useSearchFacetsQuery(query);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/** One product, with its images, variants, specs, category, and brand. */ export function useProduct(
  slug: string | undefined,
): Resource<ProductDetail> {
  const result = useProductQuery(slug);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/** The curated row on the home page. */
export function useFeaturedProducts(limit?: number): ProductCollectionResource {
  const result = useFeaturedProductsQuery(limit);
  const items = result.data?.items;

  return {
    products: items,
    isEmpty: result.isSuccess && items !== undefined && items.length === 0,
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/** Products shown beside one product, from the same category and brand. */
export function useRelatedProducts(
  slug: string | undefined,
  limit?: number,
): ProductCollectionResource {
  const result = useRelatedProductsQuery(slug, limit);
  const items = result.data?.items;

  return {
    products: items,
    isEmpty: result.isSuccess && items !== undefined && items.length === 0,
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/** The whole category tree, for the header and the catalog sidebar. */
export function useCategoryTree(): Resource<CategoryTreeResult> & {
  categories: CategoryNode[] | undefined;
} {
  const result = useCategoryTreeQuery();

  return {
    categories: result.data?.items,
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}

/** One category with its children and its breadcrumb chain. */
export function useCategory(slug: string | undefined): Resource<CategoryDetail> {
  const result = useCategoryQuery(slug);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}
