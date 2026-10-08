/**
 * What an order may do next.
 *
 * One rule, and it is the server's: `CANCELLABLE_STATUSES` in
 * `server/src/services/order.service.ts`. The client mirrors it so a button
 * that cannot succeed is not drawn, and the server still enforces it — an order
 * that was confirmed a moment ago answers 409 rather than disappearing from the
 * history, because two requests can always arrive at once.
 *
 * The list is short for a reason: once goods are being picked or are with the
 * courier, the order is no longer the customer's to stop. Cancellation before
 * that is a state change; cancellation after it is a return.
 */

import type { OrderStatus } from '@/types/order';

/** The statuses an order can be cancelled from. Mirrors the server's list. */
export const CANCELLABLE_STATUSES: readonly OrderStatus[] = ['PENDING', 'CONFIRMED'];

/** True when this order can still be cancelled. */
export function canCancelOrder(status: OrderStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}
