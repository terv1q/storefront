/**
 * Order requests.
 *
 * Three endpoints, all of them about orders this customer placed:
 * `GET /api/orders` for the history, `GET /api/orders/:id` for one order, and
 * `POST /api/orders/:id/cancel` for taking one back. The placement itself lives
 * in `features/checkout/checkout.api.ts`, where the checkout form is.
 *
 * Every route here needs a signed-in customer, and the server answers 404 for
 * an order that belongs to somebody else rather than 403 — an order id from
 * another account is not a resource this client may learn about.
 */

import { api } from '@/services/api';
import type { ApiResponse, Paginated, PaginationParams } from '@/types/api';
import type { Order } from '@/types/order';

export const ordersApi = {
  /** One page of this customer's orders, newest first, each with its lines. */
  async list(query: PaginationParams = {}): Promise<Paginated<Order>> {
    const response = await api.get<ApiResponse<Paginated<Order>>>('/orders', { query });

    return response.data;
  },

  /** One order with its lines. */
  async detail(id: string): Promise<Order> {
    const response = await api.get<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}`);

    return response.data;
  },

  /**
   * Cancels an order and returns it as the server now holds it — cancelled, and
   * refunded if it had been paid. The stock the order had taken is put back by
   * the same request; the response is the order, not a count of stock.
   */
  async cancel(id: string): Promise<Order> {
    const response = await api.post<ApiResponse<Order>>(`/orders/${encodeURIComponent(id)}/cancel`);

    return response.data;
  },
};
