/**
 * Search routes.
 *
 * `GET /api/search` answers with the same paginated envelope as the product
 * list, `GET /api/search/facets` with what the search page's filter panel can
 * offer for the same term, and `GET /api/search/suggestions` with a short list
 * for the search box.
 *
 * Search takes the same filters a category listing does, declared here by the
 * same builders. A shopper who has narrowed a search to one brand and a price
 * range has narrowed a search, not a category, and the two endpoints describing
 * those filters differently is how they start meaning different things.
 *
 * `q` is optional in the schema on purpose. A shopper who opens the search page
 * before typing, or who deletes the term, sends an empty `q`; that is a normal
 * state with an empty result, not a validation failure. Terms shorter than the
 * minimum search length are answered by the service without a database query.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  searchFacetsHandler,
  searchHandler,
  suggestionsHandler,
} from '../controllers/search.controller.js';
import { validate } from '../middleware/validate.js';
import { MAX_PAGE_SIZE, PRODUCT_SORTS } from '../services/product.service.js';
import {
  attrParams,
  booleanParam,
  enumParam,
  intParam,
  langParam,
  limitParam,
  pageParam,
  ratingParam,
  searchTermParam,
  textParam,
} from '../utils/queryParams.js';

/** The filters a search and its facets share, which are the listing's own. */
const filterFields = {
  category: textParam(),
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

const searchQuerySchema = z
  .object({
    q: searchTermParam(),
    ...filterFields,
    attr: attrParams(),
    sort: enumParam(PRODUCT_SORTS),
    page: pageParam(),
    limit: limitParam(24, MAX_PAGE_SIZE),
    lang: langParam(),
  })
  .superRefine(checkPriceRange);

/** The facets take no ordering, no page, and no attributes, as the listing's do. */
const facetsQuerySchema = z
  .object({
    q: searchTermParam(),
    ...filterFields,
    lang: langParam(),
  })
  .superRefine(checkPriceRange);

const suggestionsQuerySchema = z.object({
  q: searchTermParam(),
  lang: langParam(),
});

export const searchRouter = Router();

searchRouter.get('/suggestions', validate({ query: suggestionsQuerySchema }), suggestionsHandler);

// Registered before `/` for the same reason the product router registers
// `/facets` before `/:slug`: the two share a prefix and the order decides which
// one answers.
searchRouter.get('/facets', validate({ query: facetsQuerySchema }), searchFacetsHandler);

searchRouter.get('/', validate({ query: searchQuerySchema }), searchHandler);
