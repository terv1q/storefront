/**
 * Search endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, call the service, and wrap the result in the `{ data }` envelope the
 * client expects. Every rule about matching lives in the service.
 */

import type { RequestHandler } from 'express';

import {
  searchFacets,
  searchProducts,
  searchSuggestions,
  type SearchInput,
} from '../services/search.service.js';
import type { CatalogLocale } from '../utils/locale.js';

export const searchHandler: RequestHandler = async (request, response, next) => {
  try {
    const page = await searchProducts(request.query as unknown as SearchInput);

    response.status(200).json({ data: page });
  } catch (error) {
    next(error);
  }
};

export const searchFacetsHandler: RequestHandler = async (request, response, next) => {
  try {
    const facets = await searchFacets(request.query as unknown as SearchInput);

    response.status(200).json({ data: facets });
  } catch (error) {
    next(error);
  }
};

export const suggestionsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { q, lang } = request.query as unknown as { q?: string; lang: CatalogLocale };
    const items = await searchSuggestions(q, lang);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};
