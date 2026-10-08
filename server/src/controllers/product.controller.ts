/**
 * Product endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, call the service, and wrap the result in the `{ data }` envelope the
 * client expects. Every rule about the catalog lives in the service.
 */

import type { RequestHandler } from 'express';

import type { CatalogLocale } from '../utils/locale.js';
import {
  getProductBySlug,
  listFeaturedProducts,
  listProductFacets,
  listProducts,
  listRelatedProducts,
  subscribeToStockNotification,
  type ProductFilterQuery,
  type ProductListQuery,
} from '../services/product.service.js';

export const listProductsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { lang, ...query } = request.query as unknown as ProductListQuery & {
      lang: CatalogLocale;
    };
    const page = await listProducts(query, lang);

    response.status(200).json({ data: page });
  } catch (error) {
    next(error);
  }
};

export const getProductHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const product = await getProductBySlug(slug, lang);

    response.status(200).json({ data: product });
  } catch (error) {
    next(error);
  }
};

export const listRelatedProductsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const { limit, lang } = request.query as unknown as { limit: number; lang: CatalogLocale };
    const items = await listRelatedProducts(slug, limit, lang);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};

export const listFeaturedProductsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { limit, lang } = request.query as unknown as { limit: number; lang: CatalogLocale };
    const items = await listFeaturedProducts(limit, lang);

    response.status(200).json({ data: { items } });
  } catch (error) {
    next(error);
  }
};

export const listProductFacetsHandler: RequestHandler = async (request, response, next) => {
  try {
    const { lang, ...query } = request.query as unknown as ProductFilterQuery & {
      lang: CatalogLocale;
    };
    const facets = await listProductFacets(query, lang);

    response.status(200).json({ data: facets });
  } catch (error) {
    next(error);
  }
};

/**
 * Leave an address to be told when a product is back in stock.
 *
 * The answer is the same whether the address was already waiting or is waiting
 * now: the shopper asked for one thing, and which of the two happened is not
 * something they need to act on.
 */
export const subscribeToStockNotificationHandler: RequestHandler = async (
  request,
  response,
  next,
) => {
  try {
    const { slug } = request.params as unknown as { slug: string };
    const { email } = request.body as unknown as { email: string };

    await subscribeToStockNotification(slug, email);

    response.status(202).json({ data: { subscribed: true } });
  } catch (error) {
    next(error);
  }
};
