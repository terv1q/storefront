/**
 * Category endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, call the service, and wrap the result in the `{ data }` envelope the
 * client expects. Every rule about the tree lives in the service.
 */

import type { RequestHandler } from 'express';

import { getCategoryBySlug, getCategoryTree } from '../services/category.service.js';
import type { CatalogLocale } from '../utils/locale.js';

export const listCategoriesHandler: RequestHandler = async (request, response, next) => {
  try {
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const items = await getCategoryTree(lang);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};

export const getCategoryHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const category = await getCategoryBySlug(slug, lang);

    response.status(200).json({ data: category });
  } catch (error) {
    next(error);
  }
};
