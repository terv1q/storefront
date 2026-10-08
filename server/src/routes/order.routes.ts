/**
 * Order routes. Every one of them needs a signed-in customer, so the whole
 * router sits behind `requireAuth` rather than repeating it per route.
 *
 * The checkout schema is the only place a checkout payload is described. Prices
 * are deliberately not part of it: the server reads them from the database.
 */

import { Router } from 'express';
import { z } from 'zod';

import {
  cancelOrderHandler,
  createOrderHandler,
  getOrderHandler,
  listOrdersHandler,
} from '../controllers/order.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { RATE_LIMIT_WINDOW_MS, accountKey, rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { DELIVERY_METHODS, PAYMENT_METHODS } from '../services/order.service.js';
import { limitParam, pageParam } from '../utils/queryParams.js';
import { emailField, nameField, optionalText, phoneField } from '../utils/validation.js';

/** A customer will not order more than this many of one thing in one go. */
const MAX_LINE_QUANTITY = 99;

/** Bounded so a single checkout cannot be used to write an unbounded order. */
const MAX_LINES = 50;

/**
 * Checkout writes stock and an order number, so it is the most expensive thing
 * a signed-in account can ask for. Counted per account rather than per address,
 * since the account is known by the time this runs and one customer's retries
 * should not spend anyone else's allowance.
 */
const createOrderLimiter = rateLimit({
  name: 'orders:create',
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: 20,
  key: accountKey,
  code: 'too_many_orders',
  message: 'Too many orders placed in a short time. Please try again shortly.',
});

/**
 * A line is strict, so a payload carrying anything the order does not take — a
 * price, a subtotal, a line total — is refused with a 422 rather than being
 * quietly ignored. Stripping the field would already keep the money safe,
 * because the totals are read from the database; refusing it says so out loud
 * and turns a client that thinks it can name a price into a visible bug.
 */
const checkoutItemSchema = z.strictObject(
  {
    productId: z.uuid('Choose a valid product.'),
    // Accepted so a client can send the option the shopper picked. The order line
    // records the product; see `prepareLines`.
    variantId: z.uuid('Choose a valid option.').nullish(),
    quantity: z.coerce
      .number({ error: 'Use a whole number.' })
      .int('Use a whole number.')
      .min(1, 'Order at least one.')
      .max(MAX_LINE_QUANTITY, `Order at most ${MAX_LINE_QUANTITY}.`),
  },
  { error: 'This order line carries a field the order does not take.' },
);

/** Strict for the same reason as a line: no field of the order is a client's to invent. */
const checkoutSchema = z.strictObject(
  {
    customerName: nameField('name', 120),
    customerEmail: emailField,
    customerPhone: phoneField,
    country: z.string().trim().min(1, 'Enter your country.').max(60, 'This country is too long.'),
    city: z.string().trim().min(1, 'Enter your city.').max(60, 'This city is too long.'),
    street: z
      .string()
      .trim()
      .min(1, 'Enter your street address.')
      .max(160, 'This address is too long.'),
    postalCode: optionalText(20, 'This postal code is too long.'),
    notes: optionalText(500, 'These notes are too long.'),
    deliveryMethod: z.enum(DELIVERY_METHODS, 'Choose courier or pickup.').default('COURIER'),
    paymentMethod: z.enum(PAYMENT_METHODS, 'Choose card or cash.').default('CASH'),
    /**
     * A code the shopper typed. The client sends the code and nothing else about
     * it — what it is worth is read from the database inside the checkout
     * transaction, so a hand-written request cannot invent a discount.
     */
    promoCode: optionalText(32, 'This promo code is too long.'),
    items: z
      .array(checkoutItemSchema)
      .min(1, 'Your basket is empty.')
      .max(MAX_LINES, `Order at most ${MAX_LINES} different products at once.`),
  },
  { error: 'This checkout carries a field the order does not take.' },
);

const orderIdParamsSchema = z.object({
  id: z.uuid('Choose a valid order.'),
});

const listOrdersQuerySchema = z.object({
  page: pageParam(),
  limit: limitParam(10, 50),
});

export const orderRouter = Router();

orderRouter.use(requireAuth);

orderRouter.post('/', createOrderLimiter, validate({ body: checkoutSchema }), createOrderHandler);

orderRouter.get('/', validate({ query: listOrdersQuerySchema }), listOrdersHandler);

orderRouter.get('/:id', validate({ params: orderIdParamsSchema }), getOrderHandler);

orderRouter.post('/:id/cancel', validate({ params: orderIdParamsSchema }), cancelOrderHandler);
