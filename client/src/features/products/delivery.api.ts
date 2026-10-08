/**
 * The delivery estimate request.
 *
 * One endpoint, and the only one on the product page that takes an argument the
 * shopper types: a postal code decides whether the parcel arrives in two days or
 * seven, and whether it arrives at all. The answer is a small object read once
 * and never cached across codes by hand — the query layer keeps an entry per
 * code, which is what makes walking back through a few codes free.
 *
 * The language is not passed here. The shared api client attaches the interface's
 * language to every request, and a zone name is translated data — the same zone
 * is *Ташкент* on the Russian site — so asking for it in any other language would
 * be asking for a name the page cannot use.
 */

import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';

import type { DeliveryEstimate } from './delivery.types';

export const deliveryApi = {
  /**
   * When a parcel to this postal code arrives, and what it costs.
   *
   * An empty code asks for the policy alone: the shared api client drops empty
   * query values, so the request goes without a `zip` and comes back with the
   * return window and the payment methods and no quote. That is the request the
   * panel makes before the shopper has typed anything.
   */
  async estimate(postalCode: string): Promise<DeliveryEstimate> {
    const response = await api.get<ApiResponse<DeliveryEstimate>>('/delivery/estimate', {
      query: { zip: postalCode },
      // A delivery estimate is not tied to an account, and the product page is
      // read by visitors who have none.
      auth: false,
    });

    return response.data;
  },
};
