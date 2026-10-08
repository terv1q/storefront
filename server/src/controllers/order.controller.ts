/**
 * Order endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, take the account from `requireAuth`, call the service, and wrap the
 * result in the `{ data }` envelope the client expects. Every rule about money,
 * stock, and ownership lives in the service.
 */

import type { RequestHandler } from 'express';

import {
  cancelOrder,
  createOrder,
  getOrder,
  listOrders,
  type CheckoutInput,
} from '../services/order.service.js';
import { ApiError } from '../utils/apiError.js';

/** `requireAuth` guarantees this; the check keeps a reordered route honest. */
function currentUserId(request: { user?: { id: string } }): string {
  const user = request.user;

  if (user === undefined) {
    throw ApiError.unauthorized();
  }

  return user.id;
}

export const createOrderHandler: RequestHandler = async (request, response, next) => {
  try {
    const order = await createOrder(currentUserId(request), request.body as CheckoutInput);

    response.status(201).json({ data: order, message: 'Order placed.' });
  } catch (error) {
    next(error);
  }
};

export const listOrdersHandler: RequestHandler = async (request, response, next) => {
  try {
    const { page, limit } = request.query as unknown as { page: number; limit: number };
    const orders = await listOrders(currentUserId(request), page, limit);

    response.status(200).json({ data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderHandler: RequestHandler = async (request, response, next) => {
  try {
    const { id } = request.params as unknown as { id: string };
    const order = await getOrder(currentUserId(request), id);

    response.status(200).json({ data: order });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderHandler: RequestHandler = async (request, response, next) => {
  try {
    const { id } = request.params as unknown as { id: string };
    const order = await cancelOrder(currentUserId(request), id);

    response.status(200).json({ data: order, message: 'Order cancelled.' });
  } catch (error) {
    next(error);
  }
};
