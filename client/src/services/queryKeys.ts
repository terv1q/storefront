/**
 * TanStack Query key factories. Keys are built here rather than in components,
 * so a query and its invalidation always agree on the same shape.
 *
 * Each resource exposes `all` for coarse invalidation and narrower factories
 * for individual entries.
 */

import type { ProductListQuery } from '@/types/product';
import type { ReviewListQuery } from '@/features/products/reviews.api';

export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (query: ProductListQuery = {}) => [...queryKeys.products.lists(), query] as const,
    /**
     * An exact set of products, keyed by the set rather than by the order it was
     * asked for in. Two components showing the same products in different orders
     * — a list newest first and a bulk action working from a selection — share
     * one entry instead of fetching the same rows twice.
     */
    byIds: (ids: readonly string[]) =>
      [...queryKeys.products.all, 'byIds', [...ids].sort().join(',')] as const,
    facets: (query: ProductListQuery = {}) => [...queryKeys.products.all, 'facets', query] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (slug: string) => [...queryKeys.products.details(), slug] as const,
    related: (slug: string, limit?: number) =>
      [...queryKeys.products.all, 'related', slug, limit ?? null] as const,
    featured: (limit?: number) => [...queryKeys.products.all, 'featured', limit ?? null] as const,
    /**
     * A product's reviews. The two-argument form is the whole group for that
     * product, which is what an invalidation wants: writing a review changes
     * every slice of the list, the viewer's own review, and the average the
     * summary draws.
     */
    reviews: (slug: string) => [...queryKeys.products.all, 'reviews', slug] as const,
    reviewList: (slug: string, query: ReviewListQuery = {}) =>
      [...queryKeys.products.reviews(slug), 'list', query] as const,
    reviewMine: (slug: string) => [...queryKeys.products.reviews(slug), 'mine'] as const,
  },

  categories: {
    all: ['categories'] as const,
    tree: () => [...queryKeys.categories.all, 'tree'] as const,
    detail: (slug: string) => [...queryKeys.categories.all, 'detail', slug] as const,
  },

  search: {
    all: ['search'] as const,
    results: (query: ProductListQuery) => [...queryKeys.search.all, 'results', query] as const,
    facets: (query: ProductListQuery) => [...queryKeys.search.all, 'facets', query] as const,
    suggestions: (term: string) => [...queryKeys.search.all, 'suggestions', term] as const,
  },

  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  account: {
    all: ['account'] as const,
    /** The saved delivery addresses, the default one first. */
    addresses: () => [...queryKeys.account.all, 'addresses'] as const,
  },

  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (page = 1, limit?: number) => [...queryKeys.orders.lists(), page, limit ?? null] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },

  wishlist: {
    all: ['wishlist'] as const,
    list: () => [...queryKeys.wishlist.all, 'list'] as const,
  },

  delivery: {
    all: ['delivery'] as const,
    estimate: (postalCode: string) => [...queryKeys.delivery.all, 'estimate', postalCode] as const,
  },
};
