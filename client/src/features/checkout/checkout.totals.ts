/**
 * What the checkout comes to, and what it sends.
 *
 * The cart already prices a basket, and this module does not price a second
 * one: `shippingFor` in the cart is the courier fee and the free-delivery
 * threshold, and the only rule it does not know is the one this adds — a
 * pickup order is never charged for delivery, because the shopper carries it
 * home. That is the whole difference between the figure the cart page showed
 * and the figure the order is placed for.
 *
 * `itemsForCheckout` turns the basket into the payload the API accepts. Prices
 * are not sent: the server reads them, re-checks stock, and computes every
 * total, so a payload cannot argue about what something costs.
 */

import { shippingFor } from '@/features/cart/cart.totals';
import type { CartItem } from '@/features/cart/cart.types';
import type { CheckoutItemInput, DeliveryMethod } from '@/types/order';

/**
 * What delivery costs for the chosen method. Pickup is collected in the store
 * and is free at any order value; a courier order is free above the store's
 * published threshold and costs the flat fee below it.
 */
export function checkoutShipping(
  deliveryMethod: DeliveryMethod,
  subtotal: number,
  freeDeliveryFrom: number | null,
): number {
  if (subtotal === 0) {
    return 0;
  }

  return deliveryMethod === 'PICKUP' ? 0 : shippingFor(subtotal, freeDeliveryFrom);
}

/** `subtotal - promoDiscount + shipping`, exactly as the server computes it. */
export function checkoutTotal(subtotal: number, promoDiscount: number, shipping: number): number {
  return Math.max(0, subtotal - promoDiscount) + shipping;
}

/**
 * The basket as the API wants it.
 *
 * The order records the product, not the choice of options, so a line that
 * picked more than one group sends no variant at all rather than a partial
 * answer: half of a selection would read as a selection. A line with exactly
 * one option sends it, which is what the server checks ownership of.
 */
export function itemsForCheckout(items: readonly CartItem[]): CheckoutItemInput[] {
  return items.map((item) => ({
    productId: item.productId,
    variantId: item.variantIds.length === 1 ? (item.variantIds[0] ?? null) : null,
    quantity: item.quantity,
  }));
}
