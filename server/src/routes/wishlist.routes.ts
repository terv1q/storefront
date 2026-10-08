/**
 * Wishlist routes. Every one of them needs a signed-in customer, so the whole
 * router sits behind `requireAuth` rather than repeating it per route.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  addToWishlistHandler,
  listWishlistHandler,
  removeFromWishlistHandler,
} from '../controllers/wishlist.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { langParam } from '../utils/queryParams.js';

const productIdParamsSchema = z.object({
  productId: z.uuid('Choose a valid product.'),
});

const addToWishlistBodySchema = z.object({
  productId: z.uuid('Choose a valid product.'),
});

/**
 * The wishlist answers in the language the account is browsing in, so a saved
 * product carries the same name the catalogue card of it carries.
 */
const langQuerySchema = z.object({ lang: langParam() });

export const wishlistRouter = Router();

wishlistRouter.use(requireAuth);

wishlistRouter.get('/', validate({ query: langQuerySchema }), listWishlistHandler);

wishlistRouter.post(
  '/',
  validate({ body: addToWishlistBodySchema, query: langQuerySchema }),
  addToWishlistHandler,
);

wishlistRouter.delete(
  '/:productId',
  validate({ params: productIdParamsSchema }),
  removeFromWishlistHandler,
);
