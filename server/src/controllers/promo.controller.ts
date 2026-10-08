/**
 * Promo endpoints. One route, and it is read-only: checking a code writes
 * nothing, so a shopper may try as many as they like without leaving a trace.
 *
 * The handler is thin like every other one — the request has already been
 * parsed by `validate`, and the rules live in the service.
 */

import type { RequestHandler } from 'express';

import { validatePromoCode } from '../services/promo.service.js';

export const validatePromoCodeHandler: RequestHandler = async (request, response, next) => {
  try {
    const { code, subtotal } = request.body as { code: string; subtotal: number };
    const promo = await validatePromoCode(code, subtotal);

    response.status(200).json({ data: promo });
  } catch (error) {
    next(error);
  }
};
