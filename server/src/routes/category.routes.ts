/**
 * Category routes.
 *
 * The tree endpoint returns every active category nested under its parent, so
 * the header and the catalog sidebar are one request. The detail endpoint adds
 * the breadcrumb chain for a single category.
 */

import { Router } from 'express';
import { z } from 'zod';

import { getCategoryHandler, listCategoriesHandler } from '../controllers/category.controller.js';
import { validate } from '../middleware/validate.js';
import { langParam } from '../utils/queryParams.js';

/** Every category read answers in one language, defaulting to English. */
const langQuerySchema = z.object({ lang: langParam() });

const slugParamsSchema = z.object({
  slug: z.string().trim().min(1).max(160),
});

export const categoryRouter = Router();

categoryRouter.get('/', validate({ query: langQuerySchema }), listCategoriesHandler);

categoryRouter.get(
  '/:slug',
  validate({ params: slugParamsSchema, query: langQuerySchema }),
  getCategoryHandler,
);
