/**
 * Delivery endpoints. The handler reads what `validate` has already parsed and
 * wraps the service's answer in the `{ data }` envelope the client expects.
 */

import type { RequestHandler } from 'express';

import { estimateDelivery } from '../services/delivery.service.js';
import type { CatalogLocale } from '../utils/locale.js';

export const estimateDeliveryHandler: RequestHandler = async (request, response, next) => {
  try {
    const { zip } = request.query as unknown as { zip?: string };
    const { lang } = request.query as unknown as { lang: CatalogLocale };
    const estimate = await estimateDelivery(zip ?? null, lang);

    response.status(200).json({ data: estimate });
  } catch (error) {
    next(error);
  }
};
