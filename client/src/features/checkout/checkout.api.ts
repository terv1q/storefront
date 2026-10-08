/**
 * Checkout requests.
 *
 * The payload is the customer's details and a list of products and quantities.
 * Prices are never sent: the server reads them, re-checks stock, and computes
 * every total. A refusal arrives as an `ApiError` carrying the status and the
 * server's message, and `readCheckoutErrors` turns the 422 body into per-field
 * messages the form can place.
 */

import { api } from '@/services/api';
import { fieldErrorsOf } from '@/services/fieldErrors';
import { isApiError, type ApiResponse } from '@/types/api';
import type { CheckoutInput } from '@/types/order';

import type { CheckoutFailure, CheckoutFieldErrors, PlacedOrder } from './checkout.types';

/**
 * The field messages behind a 422, or an empty object when the failure was not
 * a field-level one. The reading itself lives in `services/fieldErrors`, which
 * the sign-in and registration forms use too.
 */
export function readCheckoutErrors(error: unknown): CheckoutFieldErrors {
  return fieldErrorsOf(error);
}

/** Which of the outcomes a failed checkout was, so the page can react to it. */
export function readCheckoutFailure(error: unknown): CheckoutFailure {
  if (!isApiError(error)) {
    return 'unknown';
  }

  switch (error.status) {
    case 401:
      return 'unauthenticated';
    case 409:
      return 'conflict';
    case 422:
      return 'validation';
    case 429:
      return 'rate_limited';
    default:
      return 'unknown';
  }
}

export const checkoutApi = {
  /** Places an order. Answers 201 with the order it created. */
  async placeOrder(input: CheckoutInput): Promise<PlacedOrder> {
    const response = await api.post<ApiResponse<PlacedOrder>>('/orders', input);

    return response.data;
  },
};
