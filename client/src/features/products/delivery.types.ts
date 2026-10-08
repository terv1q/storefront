/**
 * What the delivery estimate endpoint answers.
 *
 * The shapes mirror `server/src/services/delivery.service.ts`, as every type in
 * this folder mirrors the service that produces it. Money is an integer number
 * of tiyin and is only converted for display.
 */

/** One service area, with the window and the price it promises. */
export type DeliveryZoneQuote = {
  /** Stable identifier, for example `tashkent-city`. */
  code: string;
  /** The zone's name in the language the request asked for. */
  name: string;
  /** Whole days, inclusive at both ends. */
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  /** Minor units. */
  fee: number;
  pickupAvailable: boolean;
};

/** What the store promises everywhere, whatever the address. */
export type DeliveryPolicy = {
  returnWindowDays: number;
  /** Minor units, or `null` when there is no free-delivery threshold. */
  freeDeliveryFrom: number | null;
  /** The payment codes the checkout API accepts. */
  paymentMethods: readonly string[];
};

export type DeliveryEstimate = {
  /** `null` when no zone covers the code: the store does not deliver there yet. */
  quote: { zone: DeliveryZoneQuote } | null;
  policy: DeliveryPolicy;
};
