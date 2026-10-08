/**
 * What a basket costs.
 *
 * Nothing here is stored. The cart holds lines, and every figure the summary
 * card shows is computed from them each time it draws, so a quantity change
 * cannot leave a total behind that was true a moment ago. The store's own
 * `items` array is the only cart state that persists.
 *
 * The arithmetic mirrors the checkout exactly — `subtotal - promoDiscount +
 * shipping` — with one deliberate difference: the checkout reads prices and
 * stock from the database, and this reads them from the lines, which hold what
 * the catalog said when they were added. That is why the cart page re-validates
 * against the catalog when it opens.
 *
 * Money is an integer number of tiyin throughout, as everywhere in the client.
 */

import { siteConfig } from '@/config/site';

import type { AppliedPromo, CartItem, CartTotals } from './cart.types';

/** The most a percentage code may take off, as a whole percent. */
const MAX_PERCENT = 100;

/**
 * What an accepted code takes off a subtotal.
 *
 * The same clamping the server applies: a percentage is floored to a whole
 * tiyin, a ceiling caps it, and the result never exceeds the subtotal — a code
 * may not discount the delivery fee away.
 */
export function discountFor(promo: AppliedPromo, subtotal: number): number {
  const raw =
    promo.discountType === 'PERCENT'
      ? Math.floor((subtotal * Math.min(promo.discountValue, MAX_PERCENT)) / 100)
      : promo.discountValue;

  const capped = promo.maxDiscount === null ? raw : Math.min(raw, promo.maxDiscount);

  return Math.max(0, Math.min(capped, subtotal));
}

/** Whether a subtotal is large enough for the applied code to be worth anything. */
export function promoApplies(promo: AppliedPromo, subtotal: number): boolean {
  return subtotal >= promo.minSubtotal;
}

/**
 * Whether a coupon order is delivered free.
 *
 * The threshold is a store rule the API publishes as delivery policy, so it
 * arrives as an argument: the cart shows the bar before any request that would
 * carry it, and the constant below is what it falls back to.
 */
export function hasFreeDelivery(subtotal: number, freeDeliveryFrom: number | null): boolean {
  return freeDeliveryFrom !== null && subtotal >= freeDeliveryFrom;
}

/** How much more has to be spent, or `null` when delivery is already free. */
export function amountToFreeDelivery(
  subtotal: number,
  freeDeliveryFrom: number | null,
): number | null {
  if (freeDeliveryFrom === null) {
    return null;
  }

  const remaining = freeDeliveryFrom - subtotal;

  return remaining > 0 ? remaining : null;
}

/** The delivery fee for a subtotal: the flat courier fee, or nothing. */
export function shippingFor(subtotal: number, freeDeliveryFrom: number | null): number {
  if (subtotal === 0) {
    return 0;
  }

  return hasFreeDelivery(subtotal, freeDeliveryFrom) ? 0 : siteConfig.courierFee;
}

/**
 * Every figure the summary card shows, from the lines it is given.
 *
 * `freeDeliveryFrom` comes from the delivery policy when the cart page has it
 * and from the store's own constant when it does not, so the bar is drawn from
 * the first paint and corrected if the API says the threshold has moved.
 */
export function calculateTotals(
  items: readonly CartItem[],
  promo: AppliedPromo | null,
  freeDeliveryFrom: number | null = siteConfig.freeDeliveryFrom,
): CartTotals {
  let itemCount = 0;
  let subtotal = 0;
  let savings = 0;

  for (const item of items) {
    itemCount += item.quantity;
    subtotal += item.unitPrice * item.quantity;

    if (item.compareAtPrice !== null && item.compareAtPrice > item.unitPrice) {
      savings += (item.compareAtPrice - item.unitPrice) * item.quantity;
    }
  }

  const applied = promo !== null && promoApplies(promo, subtotal) ? promo : null;
  const promoDiscount = applied === null ? 0 : discountFor(applied, subtotal);
  const shipping = shippingFor(items.length === 0 ? 0 : subtotal, freeDeliveryFrom);

  return {
    itemCount,
    subtotal,
    savings,
    promoDiscount,
    shipping,
    total: Math.max(0, subtotal - promoDiscount) + shipping,
  };
}
