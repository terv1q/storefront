/**
 * Catalog queries.
 *
 * One hook per catalog read, each with its own key and its own freshness
 * window. The key factories in `services/queryKeys.ts` are used unchanged, so
 * an invalidation from anywhere else in the app matches these entries.
 *
 * Dependent queries stay idle until they have what they need: a slug that has
 * not arrived yet, or a limit of zero. `enabled` is what keeps them from firing
 * a request for `undefined`.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import type { ProductListQuery } from '@/types/product';

import { productsApi, toFacetsQuery } from './products.api';
import { orderProductsByIds } from './orderProductsByIds';
import { reviewsApi } from './reviews.api';
import type {
  CategoryDetail,
  CategoryTreeResult,
  ProductDetail,
  ProductFacets,
  ProductListPage,
  ProductListResult,
  Review,
  ReviewImage,
  ReviewPage,
} from './products.types';
import type { ReviewListQuery, ReviewVoteResult, ReviewInput } from './reviews.api';

/** What a review write needs: which product, and what was typed. */
export type ReviewWriteInput = { slug: string; input: ReviewInput };

/** What a vote needs: the review, the product it belongs to, and the opinion. */
export type ReviewVoteInput = { slug: string; reviewId: string; value: -1 | 0 | 1 };

/**
 * How many reviews one page of the list holds. The server's own default, named
 * here so the interface can ask for a page size without inventing one.
 */
export const REVIEWS_LIMIT = 10;

/** How many related products and how many featured products a page asks for. */
export const RELATED_LIMIT = 8;
export const FEATURED_LIMIT = 12;

/**
 * One page of the catalog.
 *
 * The previous page stays on screen while the next one loads, so paging and
 * filter changes do not blank the grid; `isPlaceholderData` tells the grid to
 * dim it instead.
 */
export function useProductList(
  query: ProductListQuery = {},
): UseQueryResult<ProductListPage, unknown> {
  return useQuery({
    queryKey: queryKeys.products.list(query),
    queryFn: () => productsApi.list(query),
    staleTime: STALE_TIME.products,
    retry: retryQuery,
    placeholderData: keepPreviousData,
  });
}

/**
 * What the filter panel can offer for a listing.
 *
 * The previous facets stay on screen while the next ones load, so changing a
 * filter does not blank the panel the shopper is working in. The query is
 * narrowed to what the endpoint answers before it becomes a cache key, so
 * re-sorting or paging does not refetch counts that cannot have changed.
 */
export function useProductFacets(
  query: ProductListQuery = {},
): UseQueryResult<ProductFacets, unknown> {
  const facetsQuery = toFacetsQuery(query);

  return useQuery({
    queryKey: queryKeys.products.facets(facetsQuery),
    queryFn: () => productsApi.facets(facetsQuery),
    staleTime: STALE_TIME.facets,
    retry: retryQuery,
    placeholderData: keepPreviousData,
  });
}

/**
 * An exact set of products, in the order the ids were given.
 *
 * This is how a shopper who has not signed in sees the products they saved: the
 * browser holds their ids, and this reads them back through the catalog. The
 * answers are the current ones — today's name, price, and translation — and a
 * product that is no longer on sale is simply absent.
 *
 * The query is idle with nothing to ask for, and the page is re-ordered here
 * rather than by each caller, so every reader of this hook sees the same order.
 */
export function useProductsByIds(ids: readonly string[]): UseQueryResult<ProductListPage, unknown> {
  const query = { ids: [...ids], limit: ids.length, page: 1 };

  return useQuery({
    queryKey: queryKeys.products.byIds(ids),
    queryFn: () => productsApi.list(query),
    enabled: ids.length > 0,
    staleTime: STALE_TIME.products,
    retry: retryQuery,
    select: (page) => ({ ...page, items: orderProductsByIds(page.items, ids) }),
  });
}

/** One product. The query is idle until a slug exists. */
export function useProduct(slug: string | undefined): UseQueryResult<ProductDetail, unknown> {
  return useQuery({
    queryKey: queryKeys.products.detail(slug ?? ''),
    queryFn: () => productsApi.detail(slug as string),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.productDetail,
    retry: retryQuery,
  });
}

/** Products related to one product. */
export function useRelatedProducts(
  slug: string | undefined,
  limit = RELATED_LIMIT,
): UseQueryResult<ProductListResult, unknown> {
  return useQuery({
    queryKey: queryKeys.products.related(slug ?? '', limit),
    queryFn: () => productsApi.related(slug as string, limit),
    enabled: Boolean(slug) && limit > 0,
    staleTime: STALE_TIME.related,
    retry: retryQuery,
  });
}

/** The featured row on the home page. */
export function useFeaturedProducts(
  limit = FEATURED_LIMIT,
): UseQueryResult<ProductListResult, unknown> {
  return useQuery({
    queryKey: queryKeys.products.featured(limit),
    queryFn: () => productsApi.featured(limit),
    enabled: limit > 0,
    staleTime: STALE_TIME.featured,
    retry: retryQuery,
  });
}

/** One page of a product's reviews, with the product's own summary above it. */
export function useProductReviews(
  slug: string | undefined,
  query: ReviewListQuery = {},
): UseQueryResult<ReviewPage, unknown> {
  return useQuery({
    queryKey: queryKeys.products.reviewList(slug ?? '', query),
    queryFn: () => reviewsApi.list(slug as string, query),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.reviews,
    retry: retryQuery,
    // The previous page stays on screen while the next one loads, so paging and
    // re-sorting do not blank the list the shopper is reading.
    placeholderData: keepPreviousData,
  });
}

/**
 * The viewer's own review of a product, or `null` when they have not written
 * one. It is only asked for when somebody is signed in; a guest has no review
 * to own, and the request would answer 401.
 */
export function useOwnReview(
  slug: string | undefined,
  enabled = true,
): UseQueryResult<Review | null, unknown> {
  return useQuery({
    queryKey: queryKeys.products.reviewMine(slug ?? ''),
    queryFn: () => reviewsApi.getOwn(slug as string),
    enabled: Boolean(slug) && enabled,
    staleTime: STALE_TIME.reviews,
    retry: retryQuery,
  });
}

/**
 * What writing a review does to the cache.
 *
 * The product's reviews and the product itself both change: the review list
 * gains a row, the summary's average moves, and the rating and the review count
 * on `Product` are recomputed by the server. The catalogue lists read those two
 * columns on every card, so they are refreshed with the rest rather than left
 * showing the rating the product had a moment ago.
 */
function useReviewWriteHandler(): (slug: string) => void {
  const queryClient = useQueryClient();

  return (slug: string) => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.reviews(slug) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(slug) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() });
  };
}

/** Writes a review. A second one for the same product is refused by the server. */
export function useCreateReview(): UseMutationResult<Review, unknown, ReviewWriteInput> {
  const onWritten = useReviewWriteHandler();

  return useMutation({
    mutationFn: ({ slug, input }: ReviewWriteInput) => reviewsApi.create(slug, input),
    onSuccess: (_review, { slug }) => onWritten(slug),
  });
}

/** Rewrites the viewer's review of a product. */
export function useUpdateReview(): UseMutationResult<Review, unknown, ReviewWriteInput> {
  const onWritten = useReviewWriteHandler();

  return useMutation({
    mutationFn: ({ slug, input }: ReviewWriteInput) => reviewsApi.update(slug, input),
    onSuccess: (_review, { slug }) => onWritten(slug),
  });
}

/** Attaches photographs to the viewer's own review. */
export function useAddReviewImages(): UseMutationResult<
  ReviewImage[],
  unknown,
  { slug: string; files: File[] }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, files }) => reviewsApi.addImages(slug, files),
    onSuccess: (_images, { slug }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.reviews(slug) });
    },
  });
}

/** Removes one photograph from the viewer's own review. */
export function useRemoveReviewImage(): UseMutationResult<
  void,
  unknown,
  { slug: string; imageId: string }
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, imageId }) => reviewsApi.removeImage(slug, imageId),
    onSuccess: (_result, { slug }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.reviews(slug) });
    },
  });
}

/**
 * Votes a review helpful or not, or takes the vote back.
 *
 * The slug travels with the call because the vote is addressed by the review's
 * id and the cache is keyed by the product: without it the answer would arrive
 * with nowhere to be written.
 */
export function useVoteReview(): UseMutationResult<ReviewVoteResult, unknown, ReviewVoteInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, value }: ReviewVoteInput) => reviewsApi.vote(reviewId, value),
    onSuccess: (_result, { slug }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.reviews(slug) });
    },
  });
}

/** The whole category tree, for the header and the catalog sidebar. */
export function useCategoryTree(): UseQueryResult<CategoryTreeResult, unknown> {
  return useQuery({
    queryKey: queryKeys.categories.tree(),
    queryFn: () => productsApi.categoryTree(),
    staleTime: STALE_TIME.categories,
    retry: retryQuery,
  });
}

/** One category with its children and breadcrumbs. */
export function useCategory(slug: string | undefined): UseQueryResult<CategoryDetail, unknown> {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug ?? ''),
    queryFn: () => productsApi.category(slug as string),
    enabled: Boolean(slug),
    staleTime: STALE_TIME.categories,
    retry: retryQuery,
  });
}

/** What a caller passes to ask to be told a product is back. */
export type StockNotifyInput = { slug: string; email: string };

/**
 * Asks to be told when a sold-out product returns.
 *
 * Nothing is cached or invalidated by it: the answer says the address was
 * recorded, and no query in the app reads that fact. A mutation rather than a
 * hand-rolled fetch, because it gives the dialog the pending and error states it
 * has to render anyway.
 */
export function useStockNotify(): UseMutationResult<void, Error, StockNotifyInput> {
  return useMutation({
    mutationFn: ({ slug, email }: StockNotifyInput) => productsApi.notify(slug, email),
  });
}
