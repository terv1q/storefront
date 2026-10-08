/**
 * Delivery routes.
 *
 * The estimate is a public read: a shopper decides whether to order by asking
 * what delivery costs before they have an account, so requiring one would make
 * the answer unavailable exactly when it is wanted.
 */

import { Router } from 'express';
import { z } from 'zod';

import { estimateDeliveryHandler } from '../controllers/delivery.controller.js';
import { validate } from '../middleware/validate.js';
import { langParam } from '../utils/queryParams.js';

/**
 * A postal code in the store's markets is six digits. The rule is a shape check
 * and not a lookup: whether the code is covered is the estimate's answer, and a
 * code outside every zone has to be able to ask. A malformed one never reaches
 * the database.
 *
 * The code is optional because half of what the endpoint answers is not about an
 * address at all: the return window, the free-delivery threshold, and the
 * payment methods are the same everywhere, and the product page shows them before
 * anybody has typed a code. A request without one is therefore a request for the
 * policy, and it answers with no quote rather than with a guess.
 */
const estimateQuerySchema = z.object({
  zip: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter a six-digit postal code, for example 100000.')
    .optional(),
  lang: langParam(),
});

export const deliveryRouter = Router();

deliveryRouter.get('/estimate', validate({ query: estimateQuerySchema }), estimateDeliveryHandler);
