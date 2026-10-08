/**
 * Review endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, take the account from `requireAuth` when the route has one, and call
 * the service. Every rule about a review lives in `services/review.service.ts`.
 *
 * The list is the one public route here, and it reads the viewer when there is
 * one so that a signed-in customer's own votes come back marked as theirs. That
 * is what `optionalAuth` is for; a visitor with no token gets the same reviews
 * with no votes on them.
 */

import type { RequestHandler } from 'express';

import {
  addReviewImages,
  createReview,
  getOwnReview,
  listProductReviews,
  removeReviewImage,
  updateReview,
  voteOnReview,
  type ReviewInput,
  type ReviewSort,
} from '../services/review.service.js';
import { ApiError } from '../utils/apiError.js';
import { MAX_REVIEW_IMAGES } from '../utils/uploads.js';

/** `requireAuth` guarantees this; the check keeps a reordered route honest. */
function currentUserId(request: { user?: { id: string } }): string {
  const user = request.user;

  if (user === undefined) {
    throw ApiError.unauthorized();
  }

  return user.id;
}

/** The viewer's id when somebody is signed in, and nothing when nobody is. */
function viewerId(request: { user?: { id: string } }): string | undefined {
  return request.user?.id;
}

export const listProductReviewsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const { page, limit, sort, rating } = request.query as unknown as {
      page: number;
      limit: number;
      sort: ReviewSort;
      rating?: number | undefined;
    };

    const reviews = await listProductReviews(slug, {
      page,
      limit,
      sort,
      rating,
      viewerId: viewerId(request),
    });

    response.status(200).json({ data: reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * Whether the customer has already reviewed this product, and what they wrote.
 *
 * `null` is an answer and not a 404: the interface asks before it draws the
 * form, and "you have not reviewed this yet" is the ordinary case.
 */
export const getOwnReviewHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const review = await getOwnReview(currentUserId(request), slug);

    response.status(200).json({ data: { review } });
  } catch (error) {
    next(error);
  }
};

export const createReviewHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const input = request.body as unknown as ReviewInput;
    const review = await createReview({ id: currentUserId(request) }, slug, input);

    response.status(201).json({ data: review, message: 'Thank you for your review.' });
  } catch (error) {
    next(error);
  }
};

export const updateReviewHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const input = request.body as unknown as ReviewInput;
    const review = await updateReview({ id: currentUserId(request) }, slug, input);

    response.status(200).json({ data: review, message: 'Your review has been updated.' });
  } catch (error) {
    next(error);
  }
};

export const voteReviewHandler: RequestHandler = async (request, response, next) => {
  try {
    const { reviewId } = request.params as unknown as { reviewId: string };
    const { value } = request.body as unknown as { value: -1 | 0 | 1 };
    const result = await voteOnReview(currentUserId(request), reviewId, value);

    response.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Attaches photographs to the customer's own review. The files were written by
 * the upload middleware before this handler ran, so the answer is the review's
 * photographs as they now stand.
 */
export const addReviewImagesHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const files = (request.files ?? []) as Express.Multer.File[];

    if (files.length === 0) {
      throw ApiError.validationFailed({
        fields: { images: 'Choose at least one photograph.' },
      });
    }

    const images = await addReviewImages(currentUserId(request), slug, files, MAX_REVIEW_IMAGES);

    response.status(201).json({ data: { images } });
  } catch (error) {
    next(error);
  }
};

export const removeReviewImageHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug, imageId } = request.params as unknown as { slug: string; imageId: string };

    await removeReviewImage(currentUserId(request), slug, imageId);

    response.status(204).send();
  } catch (error) {
    next(error);
  }
};
