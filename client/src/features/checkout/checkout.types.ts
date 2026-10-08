/**
 * Checkout types for the client data layer.
 *
 * `CheckoutInput`, `CheckoutItemInput`, and `Order` already exist in
 * `@/types/order` and describe exactly what the server accepts and returns, so
 * they are re-exported rather than rewritten. What this file adds is the outcome
 * of a checkout call: the order that was created, plus the shape the server uses
 * to name the line that failed validation.
 */

import type { Order } from '@/types/order';

export type {
  CheckoutInput,
  CheckoutItemInput,
  DeliveryMethod,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@/types/order';

/** The order that was created. The server answers 201 with it. */
export type PlacedOrder = Order;

/**
 * A validation failure names the field it belongs to:
 * `items.0.quantity`, `customerEmail`, `items`. The value is the message the
 * checkout form shows under that field, or beside the basket when the name has
 * no index.
 */
export type CheckoutFieldErrors = Record<string, string>;

/** Every reason a checkout can be refused, as the UI has to treat them. */
export type CheckoutFailure =
  /** 422: a field, a line, or the basket as a whole was refused. */
  | 'validation'
  /** 409: the basket changed under the shopper, or the order could not be placed. */
  | 'conflict'
  /** 401: the session ended while the form was open. */
  | 'unauthenticated'
  /** 429: too many checkouts from this account in a short time. */
  | 'rate_limited'
  /** Anything else, including the server being unreachable. */
  | 'unknown';
