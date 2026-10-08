/**
 * Catalog routes.
 *
 * `/featured` is registered before `/:slug`, otherwise Express would match
 * "featured" as a product slug and the home page would ask for a product that
 * does not exist.
 *
 * Every route declares the Zod schema for the request parts it reads, so
 * `validate` rejects a malformed query before a handler or the database sees
 * it. An empty parameter (`?brand=`) counts as "not given" rather than as a
 * filter for the empty string.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  getProductHandler,
  listFeaturedProductsHandler,
  listProductFacetsHandler,
  listProductsHandler,
  listRelatedProductsHandler,
  subscribeToStockNotificationHandler,
} from '../controllers/product.controller.js';
import {
  addReviewImagesHandler,
  createReviewHandler,
  getOwnReviewHandler,
  listProductReviewsHandler,
  removeReviewImageHandler,
  updateReviewHandler,
} from '../controllers/review.controller.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, PRODUCT_SORTS } from '../services/product.service.js';
import { REVIEW_RATE_LIMIT, REVIEWS_LIMIT, REVIEW_SORTS } from '../services/review.service.js';
import { emailField, optionalText } from '../utils/validation.js';
import { reviewImagesUpload } from '../utils/uploads.js';
import {
  attrParams,
  booleanParam,
  enumParam,
  idsParam,
  intParam,
  langParam,
  limitParam,
  pageParam,
  ratingParam,
  textParam,
} from '../utils/queryParams.js';

/** How many products the home page row and the "related" rail ask for. */
const FEATURED_LIMIT = 12;
const RELATED_LIMIT = 8;

/**
 * The filters the list and the facets endpoints share.
 *
 * Both ask the same question of the same set, so they read the same names; only
 * the list adds paging, ordering, and the attributes it narrows by.
 */
const filterFields = {
  category: textParam(),
  q: textParam(),
  brand: textParam(),
  minPrice: intParam(0, Number.MAX_SAFE_INTEGER),
  maxPrice: intParam(0, Number.MAX_SAFE_INTEGER),
  minRating: ratingParam(),
  inStock: booleanParam(),
  onSale: booleanParam(),
};

type PriceRange = { minPrice?: number | undefined; maxPrice?: number | undefined };

/** A range that runs backwards matches nothing, so it is refused rather than run. */
function checkPriceRange(
  query: PriceRange,
  context: { addIssue: (issue: { code: 'custom'; path: string[]; message: string }) => void },
): void {
  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    context.addIssue({
      code: 'custom',
      path: ['minPrice'],
      message: 'The minimum price cannot be above the maximum price.',
    });
  }
}

const listQuerySchema = z
  .object({
    ...filterFields,
    attr: attrParams(),
    /**
     * An exact set of products, which the listing accepts because a shopper who
     * has not signed in keeps their saved products as ids in the browser, and
     * reading them back is this request. A product id is public in every listing
     * response already, so accepting them here exposes nothing that was not
     * exposed; the active-only rule the rest of the listing applies still does.
     */
    ids: idsParam(),
    sort: enumParam(PRODUCT_SORTS).transform((value) => value ?? 'featured'),
    page: pageParam(),
    limit: limitParam(DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE),
    lang: langParam(),
  })
  .superRefine(checkPriceRange);

const facetsQuerySchema = z
  .object({
    ...filterFields,
    lang: langParam(),
  })
  .superRefine(checkPriceRange);

const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

const relatedQuerySchema = z.object({
  limit: limitParam(RELATED_LIMIT, MAX_PAGE_SIZE),
  lang: langParam(),
});

/**
 * One page of reviews, and which slice of them: newest first unless asked
 * otherwise, and optionally narrowed to a single star rating. The summary that
 * travels with the page is always the whole product's, so filtering the list
 * never changes the average above it.
 */
const reviewsQuerySchema = z.object({
  page: pageParam(),
  limit: limitParam(REVIEWS_LIMIT, MAX_PAGE_SIZE),
  sort: enumParam(REVIEW_SORTS).transform((value) => value ?? 'newest'),
  rating: intParam(1, 5),
});

/**
 * What a customer writes. The rating is coerced because a form sends it as a
 * string, and the body carries a floor: a review of three characters is not a
 * review, and accepting one would leave a product page full of them.
 */
const reviewBodySchema = z.object({
  rating: z.coerce
    .number()
    .int('Choose a whole number of stars.')
    .min(1, 'Choose at least one star.')
    .max(5, 'Choose at most five stars.'),
  title: optionalText(120, 'Use at most 120 characters.'),
  body: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters.')
    .max(4000, 'Use at most 4000 characters.'),
});

const imageParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160),
  imageId: z.uuid('Choose a valid photograph.'),
});

/**
 * Writing a review is rare for one customer and cheap to abuse, so the limit is
 * per account rather than per address: a household sharing one connection does
 * not share a quota.
 */
const reviewWriteLimiter = rateLimit({
  name: 'reviews:write',
  windowMs: REVIEW_RATE_LIMIT.windowMs,
  max: REVIEW_RATE_LIMIT.max,
  code: 'too_many_reviews',
  message: 'You have written a lot of reviews in the last hour. Please try again later.',
  key: (request) => request.user?.id,
});

/**
 * The one path in the API that reads a multipart body. Named here and handed to
 * the content-type guard by `app.ts`, so the exception is one address rather
 * than a general willingness to parse whatever arrives.
 */
export const REVIEW_IMAGE_UPLOAD_PATH = /^\/api\/products\/[^/]+\/reviews\/mine\/images$/;

const featuredQuerySchema = z.object({
  limit: limitParam(FEATURED_LIMIT, MAX_PAGE_SIZE),
  lang: langParam(),
});

/**
 * The address to notify. It is the only thing this route reads, and it is not
 * tied to an account: a shopper asked to be told about a product, not to
 * register for the privilege.
 */
const notifyBodySchema = z.object({
  email: emailField,
});

export const productRouter = Router();

productRouter.get(
  '/featured',
  validate({ query: featuredQuerySchema }),
  listFeaturedProductsHandler,
);

// Registered before `/:slug` for the same reason as `/featured`: otherwise
// Express reads "facets" as a product slug and answers 404.
productRouter.get('/facets', validate({ query: facetsQuerySchema }), listProductFacetsHandler);

productRouter.get('/', validate({ query: listQuerySchema }), listProductsHandler);

productRouter.get('/:slug', validate({ params: slugParamsSchema }), getProductHandler);

productRouter.get(
  '/:slug/related',
  validate({ params: slugParamsSchema, query: relatedQuerySchema }),
  listRelatedProductsHandler,
);

/**
 * Reviews.
 *
 * The list is public and reads the caller when there is one, so a signed-in
 * customer's own votes come back marked as theirs. Everything below it belongs
 * to an account: the review the customer wrote, the review they are writing,
 * and the photographs on it.
 *
 * `/reviews/mine` is registered before nothing in particular — it cannot be
 * confused with the list, because a product slug is never the word "mine" and
 * the list route takes no further segments.
 */
productRouter.get(
  '/:slug/reviews',
  optionalAuth,
  validate({ params: slugParamsSchema, query: reviewsQuerySchema }),
  listProductReviewsHandler,
);

productRouter.get(
  '/:slug/reviews/mine',
  requireAuth,
  validate({ params: slugParamsSchema }),
  getOwnReviewHandler,
);

productRouter.post(
  '/:slug/reviews',
  requireAuth,
  reviewWriteLimiter,
  validate({ params: slugParamsSchema, body: reviewBodySchema }),
  createReviewHandler,
);

productRouter.put(
  '/:slug/reviews/mine',
  requireAuth,
  reviewWriteLimiter,
  validate({ params: slugParamsSchema, body: reviewBodySchema }),
  updateReviewHandler,
);

// The upload middleware runs before `validate`, because multer is what fills
// `request.files` — and what turns a file that is too big into the 413 the
// error handler reports.
productRouter.post(
  '/:slug/reviews/mine/images',
  requireAuth,
  reviewImagesUpload,
  validate({ params: slugParamsSchema }),
  addReviewImagesHandler,
);

productRouter.delete(
  '/:slug/reviews/mine/images/:imageId',
  requireAuth,
  validate({ params: imageParamsSchema }),
  removeReviewImageHandler,
);

productRouter.post(
  '/:slug/notify',
  validate({ params: slugParamsSchema, body: notifyBodySchema }),
  subscribeToStockNotificationHandler,
);
