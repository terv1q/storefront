/**
 * Date formatting. The locale is the one the interface is being read in, so
 * order dates, delivery estimates, and review dates all read the same, and all
 * of them change with the language.
 *
 * Invalid input returns an empty string rather than `Invalid Date`.
 */

import { getLocale } from '@/i18n/strings';

export type DateInput = string | number | Date;

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const cacheKey = `${locale}:${JSON.stringify(options)}`;
  const cached = formatters.get(cacheKey);

  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat(locale, options);
  formatters.set(cacheKey, formatter);
  return formatter;
}

function toDate(value: DateInput): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** Formats a date as `12 Sep 2026`. */
export function formatDate(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  const date = toDate(value);

  if (!date) {
    return '';
  }

  return getFormatter(getLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

/** Formats a date and time as `12 Sep 2026, 14:30`. */
export function formatDateTime(value: DateInput, options: Intl.DateTimeFormatOptions = {}): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit', ...options });
}
