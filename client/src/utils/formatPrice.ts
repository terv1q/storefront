/**
 * Money formatting. Every price in the client is an integer in minor units
 * (tiyin); this module is the only place that converts one for display.
 *
 * The default locale is the one the interface is being read in, not a fixed
 * store locale, so `1,234,567 UZS` and `1 234 567 UZS` follow the language the
 * visitor picked. Callers that mean one specific locale still pass it.
 */

import { getLocale } from '@/i18n/strings';
import { siteConfig } from '@/config/site';

/** One so'm is 100 tiyin. */
export const MINOR_UNITS_PER_UNIT = 100;

export type FormatPriceOptions = {
  locale?: string;
  currency?: string;
};

const formatters = new Map<string, Intl.NumberFormat>();

function getFormatter(locale: string, currency: string): Intl.NumberFormat {
  const cacheKey = `${locale}:${currency}`;
  const cached = formatters.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    // So'm prices are whole amounts, so no fraction digits are shown.
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  formatters.set(cacheKey, formatter);
  return formatter;
}

/** Converts minor units to the major unit, for arithmetic and non-currency output. */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / MINOR_UNITS_PER_UNIT;
}

/**
 * Formats minor units as a display string, for example `12 500 UZS`.
 * Returns an empty string when the amount is not a finite number.
 */
export function formatPrice(minorUnits: number, options: FormatPriceOptions = {}): string {
  if (!Number.isFinite(minorUnits)) {
    return '';
  }

  const { locale = getLocale(), currency = siteConfig.currency } = options;

  return getFormatter(locale, currency).format(toMajorUnits(Math.round(minorUnits)));
}
