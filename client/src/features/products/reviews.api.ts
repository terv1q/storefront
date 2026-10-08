/**
 * Review requests.
 *
 * Each function calls the shared `api` client, unwraps the `{ data }` envelope,
 * and returns the domain object the pages render. Nothing here knows about
 * TanStack Query, caching, or components: the hooks in `products.queries.ts`
 * are the layer that does.
 *
 * The endpoints are:
 *   GET  /api/products/:slug/reviews          list with filters, sorting, and paging
 *   GET  /api/products/:slug/reviews/mine     current user's review or null
 *   POST /api/products/:slug/reviews          create a review
 *   PUT  /api/products/:slug/reviews/mine      update current user's review
 *   POST /api/products/:slug/reviews/mine/images  upload review photos
 *   DELETE /api/products/:slug/reviews/mine/images/:imageId  remove a photo
 *   POST /api/reviews/:reviewId/vote           vote on a review
 */

import { api } from '@/services/api';
import type { ApiResponse, QueryParams } from '@/types/api';
import type { Review, ReviewImage, ReviewSummary } from './products.types';

export type ReviewSort = 'newest' | 'highest' | 'lowest';

export type ReviewListQuery = {
  page?: number;
  limit?: number;
  sort?: ReviewSort;
  /** One star rating to narrow to, or nothing for all of them. */
  rating?: number;
};

export type ReviewInput = {
  rating: number;
  title?: string;
  body: string;
};

export type ReviewVoteResult = {
  helpfulYes: number;
  helpfulNo: number;
  myVote: -1 | 0 | 1;
};

function toQueryParams(query: ReviewListQuery): QueryParams {
  return { ...query } as QueryParams;
}

export const reviewsApi = {
  /** One page of a product's approved reviews, with the product's summary. */
  async list(
    slug: string,
    query: ReviewListQuery = {},
  ): Promise<{
    items: Review[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    summary: ReviewSummary;
  }> {
    const response = await api.get<
      ApiResponse<{
        items: Review[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        summary: ReviewSummary;
      }>
    >(`/products/${encodeURIComponent(slug)}/reviews`, {
      query: toQueryParams(query),
    });

    return response.data;
  },

  /** The viewer's own review of a product, or `null` when they have not written one. */
  async getOwn(slug: string): Promise<Review | null> {
    const response = await api.get<ApiResponse<{ review: Review | null }>>(
      `/products/${encodeURIComponent(slug)}/reviews/mine`,
    );

    return response.data.review;
  },

  /** Writes a review, or refuses because one already exists. */
  async create(slug: string, input: ReviewInput): Promise<Review> {
    const response = await api.post<ApiResponse<Review>>(
      `/products/${encodeURIComponent(slug)}/reviews`,
      input,
    );

    return response.data;
  },

  /** Rewrites the viewer's review. A customer who has not written one gets a 404. */
  async update(slug: string, input: ReviewInput): Promise<Review> {
    const response = await api.put<ApiResponse<Review>>(
      `/products/${encodeURIComponent(slug)}/reviews/mine`,
      input,
    );

    return response.data;
  },

  /** Attaches photographs to the viewer's own review. */
  async addImages(slug: string, files: File[]): Promise<ReviewImage[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const response = await api.post<ApiResponse<{ images: ReviewImage[] }>>(
      `/products/${encodeURIComponent(slug)}/reviews/mine/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data.images;
  },

  /** Removes one of the viewer's own photographs, file and row together. */
  async removeImage(slug: string, imageId: string): Promise<void> {
    await api.delete<void>(
      `/products/${encodeURIComponent(slug)}/reviews/mine/images/${encodeURIComponent(imageId)}`,
    );
  },

  /** Records the viewer's opinion of a review: helpful, not helpful, or neither. */
  async vote(reviewId: string, value: -1 | 0 | 1): Promise<ReviewVoteResult> {
    const response = await api.post<ApiResponse<ReviewVoteResult>>(
      `/reviews/${encodeURIComponent(reviewId)}/vote`,
      { value },
    );

    return response.data;
  },
};
