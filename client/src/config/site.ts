import { seoConfig } from '@/config/seo';
import { strings } from '@/i18n/strings';

/**
 * Store-wide values. Currency lives here so prices and sizes read the same everywhere, whatever
 * language the visitor is reading.
 *
 * What is *not* here is any sentence. The address, the opening hours, and the announcement
 * messages used to be literals in this file; they are copy, they are read by someone in the
 * language they chose, and so they live in the `i18n` tables and are reached through the
 * functions at the bottom of this module. What stays is what does not translate: the name, the
 * email, the phone number, the social handles, and the numbers.
 *
 * The announcement block carries a version because a dismissal has to expire: bumping
 * `announcement.version` makes every visitor see the strip again, without a migration and without
 * clearing anything else they have stored.
 *
 * `markets` is the list the location selector offers. Only one market exists in this version, so
 * every price in the store is already in UZS; adding a second entry is what turns the selector into
 * a real switch, and the preference is stored under the market code either way.
 */
export const siteConfig = {
  name: seoConfig.siteName,
  currency: 'UZS',
  supportEmail: 'support@ziyo.uz',
  social: {
    instagram: 'https://instagram.com/ziyostore',
    facebook: 'https://facebook.com/ziyostore',
    telegram: 'https://t.me/ziyostore',
    youtube: 'https://youtube.com/@ziyostore',
  },
  /**
   * The store's contact details that are the same in every language. They are literals because
   * nothing in the API serves them, and the footer is the only place that renders them.
   *
   * `phoneHref` is separate from `phone` because a `tel:` target may not contain spaces, while the
   * number on screen reads better with them.
   */
  contact: {
    phone: '+998 71 200 00 00',
    phoneHref: 'tel:+998712000000',
    telegram: 'https://t.me/ziyostore',
    telegramHandle: '@ziyostore',
  },
  announcement: {
    /** Changing this makes a dismissed strip eligible to show again. */
    version: 1,
    /** How long each message stays on screen, in milliseconds. */
    rotationMs: 6000,
  },
  markets: [
    {
      code: 'UZ',
      locale: 'uz-UZ',
      currency: 'UZS',
    },
  ],
  /** Items above this quantity in one line are refused by the checkout API. */
  maxCartLineQuantity: 99,
  /**
   * Flat courier fee in minor units, and the order value from which delivery is
   * free. Both mirror rules the server enforces — `COURIER_FEE` in the order
   * service and `FREE_DELIVERY_FROM` in the delivery service — because the cart
   * has to show a total before it has asked anybody. The free-delivery figure is
   * also published by `GET /api/delivery/estimate` as part of the store's policy,
   * and the cart prefers that answer when it has it; this is the value it draws
   * with until the request comes back.
   */
  courierFee: 2_500_000,
  freeDeliveryFrom: 500_000 * 100,
  /** Products in the cart preview. */
  cartPreviewCount: 3,
} as const;

export type Market = (typeof siteConfig.markets)[number];

/** A market with the names the selector shows, in the visitor's language. */
export type MarketOption = Market & {
  label: string;
  currencyLabel: string;
};

/**
 * The markets with their country and currency names filled in.
 *
 * A code with no translation falls back to the code itself and to the currency code, which reads
 * as `UZ · UZS` — worse than a name, but not wrong, and better than an empty option.
 */
export function getMarkets(): readonly MarketOption[] {
  return siteConfig.markets.map((market) => ({
    ...market,
    label: strings.market.countries[market.code] ?? market.code,
    currencyLabel: strings.market.currencyLabels[market.code] ?? market.currency,
  }));
}

/** The parts of the store's address that are written out for the reader. */
export function getContactCopy(): { address: string; hours: string } {
  return { address: strings.footer.addressValue, hours: strings.footer.hoursValue };
}

/** The lines the announcement strip rotates through. */
export function getAnnouncementMessages(): readonly string[] {
  return strings.announcement.messages;
}
