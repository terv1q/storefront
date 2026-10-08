/**
 * Delivery estimates, and the store's delivery policy.
 *
 * The estimate answers one question a product page asks on every visit: if this
 * is ordered to a given postal code, when does it arrive and what does it cost.
 * It is answered from a table rather than computed, because a delivery window is
 * a promise made by a courier and not a number a rule can derive — the ranges are
 * service areas, and a code outside all of them is honestly out of reach rather
 * than a guess.
 *
 * The policy is the part that is the same everywhere: how long a shopper may
 * return something, what a delivery costs from and up to, and how they may pay.
 * It travels with the estimate because both are read by the same block on the
 * page, and a second request to fetch two sentences would be a second request to
 * show one panel.
 */

import type { DeliveryZone as DeliveryZoneRow } from '@prisma/client';

/**
 * The published payment codes are the checkout's own list, imported rather than
 * repeated: the policy exists so the payment step can offer what the order API
 * accepts, and two lists would drift. This module is imported by the order
 * service, so the shared definition lives in `config/payments.ts` instead of
 * either service — importing from the order service here would be a cycle.
 */
import { PAYMENT_METHODS } from '../config/payments.js';
import { prisma } from '../database/index.js';
import { LOCALE_SUFFIX } from '../utils/locale.js';
import type { CatalogLocale } from '../utils/locale.js';

/**
 * How long a shopper may change their mind. Fourteen days is the floor the
 * consumer-protection rules of the store's markets set, so it is the number the
 * store states rather than a shorter one it would have to defend.
 */
const RETURN_WINDOW_DAYS = 14;

/**
 * Delivery is free from this order value upwards, in minor units.
 *
 * Exported because the checkout applies it as well: the cart draws a progress
 * bar towards this number, and a bar that promised free delivery the order then
 * charged for would be worse than no bar at all.
 */
export const FREE_DELIVERY_FROM = 500_000 * 100;

export type DeliveryQuote = {
  zone: {
    code: string;
    name: string;
    /** How many days the parcel may take, inclusive at both ends. */
    deliveryDaysMin: number;
    deliveryDaysMax: number;
    /** Minor units. */
    fee: number;
    pickupAvailable: boolean;
  };
};

export type DeliveryPolicy = {
  returnWindowDays: number;
  /** Minor units, or `null` when there is no free-delivery threshold. */
  freeDeliveryFrom: number | null;
  paymentMethods: readonly string[];
};

export type DeliveryEstimate = {
  /**
   * `null` when the store does not deliver to the code — or when no code was
   * asked about, which is a different fact the caller knows because it is the one
   * that asked.
   */
  quote: DeliveryQuote | null;
  policy: DeliveryPolicy;
};

/** The zone's name in the language being read, falling back to English. */
function zoneName(zone: DeliveryZoneRow, lang: CatalogLocale): string {
  const column = `name${LOCALE_SUFFIX[lang]}` as 'name' | 'nameRu' | 'nameUz';

  return zone[column] ?? zone.name;
}

/**
 * When a parcel to this postal code arrives, and what it costs.
 *
 * A code covered by more than one zone takes the first in `sortOrder`, which is
 * how the seed expresses priority: the narrow city ranges are written before the
 * country-wide fallback, so Tashkent is Tashkent and not "the rest of the
 * country" that also happens to contain it.
 *
 * A request without a code answers with the policy alone. That is the request the
 * product page makes before anybody has typed anything: the return window and the
 * payment methods are shown from the first paint, and only the window and the fee
 * wait for an address.
 */
export async function estimateDelivery(
  postalCode: string | null,
  lang: CatalogLocale,
): Promise<DeliveryEstimate> {
  const zone =
    postalCode === null
      ? null
      : await prisma.deliveryZone.findFirst({
          where: {
            zipFrom: { lte: Number.parseInt(postalCode, 10) },
            zipTo: { gte: Number.parseInt(postalCode, 10) },
          },
          orderBy: [{ sortOrder: 'asc' }, { zipFrom: 'asc' }],
        });

  return {
    quote:
      zone === null
        ? null
        : {
            zone: {
              code: zone.code,
              name: zoneName(zone, lang),
              deliveryDaysMin: zone.deliveryDaysMin,
              deliveryDaysMax: zone.deliveryDaysMax,
              fee: zone.fee,
              pickupAvailable: zone.pickupAvailable,
            },
          },
    policy: {
      returnWindowDays: RETURN_WINDOW_DAYS,
      freeDeliveryFrom: FREE_DELIVERY_FROM,
      paymentMethods: PAYMENT_METHODS,
    },
  };
}
