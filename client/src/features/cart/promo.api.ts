/**
 * Checking a promo code.
 *
 * One request, and it writes nothing: the cart asks the server what a code is
 * worth for the basket it is showing, and shows the answer. The subtotal travels
 * with the request because that is the only thing the server cannot know about a
 * basket that has not been sent yet — and it is why this answer is a preview.
 * The amount that is charged is computed again at checkout, from the prices in
 * the database, by the same rule.
 *
 * A code the server will not accept arrives as a 422 whose message belongs under
 * the field the shopper typed into.
 */

import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';

import type { AppliedPromo } from './cart.types';

/** What the endpoint answers with: the rule, plus what it is worth right now. */
export type PromoValidation = AppliedPromo & { discount: number };

export const promoApi = {
  async validate(code: string, subtotal: number): Promise<PromoValidation> {
    const response = await api.post<ApiResponse<PromoValidation>>(
      '/promos/validate',
      { code, subtotal },
      // A code is checked before anybody commits to anything, so it is not
      // behind a session: a shopper who has not signed in still has a basket.
      { auth: false },
    );

    return response.data;
  },
};
