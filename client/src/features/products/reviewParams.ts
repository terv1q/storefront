/**
 * Reading and writing the review list's slice of a product page's URL.
 *
 * Which page of reviews is on screen, how they are ordered, and whether they are
 * narrowed to one rating are all things a shopper may want to keep, send to
 * somebody, or come back to — the same argument the catalog makes for holding its
 * filters in the query string rather than in component state. It also lets the
 * pagination controls be real links: a page of reviews can be opened in a new tab
 * or copied, which a button that calls `setPage` cannot offer.
 *
 * The names are prefixed because the address belongs to the product page and not
 * to this list; anything else already in the query string is preserved untouched.
 *
 * Readers stay tolerant: an unparsable page number or an unknown sort is the
 * default, not an error. Writers omit defaults, so the common case — the first
 * page, newest first, every rating — leaves no query string at all.
 */

import type { ReviewSort } from './reviews.api';

export type ReviewListParams = {
  page: number;
  sort: ReviewSort;
  /** One star rating, or `null` for all of them. */
  rating: number | null;
};

export const DEFAULT_REVIEW_PARAMS: ReviewListParams = { page: 1, sort: 'newest', rating: null };

/** The query-string names this module owns. */
export const REVIEW_PARAM_KEYS = {
  page: 'reviewPage',
  sort: 'reviewSort',
  rating: 'reviewRating',
} as const;

const SORTS: readonly ReviewSort[] = ['newest', 'highest', 'lowest'];

function readPage(raw: string | null): number {
  const value = Number(raw);

  return Number.isInteger(value) && value > 0 ? value : 1;
}

function readSort(raw: string | null): ReviewSort {
  return SORTS.includes(raw as ReviewSort) ? (raw as ReviewSort) : 'newest';
}

function readRating(raw: string | null): number | null {
  const value = Number(raw);

  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export function readReviewParams(searchParams: URLSearchParams): ReviewListParams {
  return {
    page: readPage(searchParams.get(REVIEW_PARAM_KEYS.page)),
    sort: readSort(searchParams.get(REVIEW_PARAM_KEYS.sort)),
    rating: readRating(searchParams.get(REVIEW_PARAM_KEYS.rating)),
  };
}

/**
 * The parameters with `changes` applied, as a new set. A change to anything but
 * the page returns to the first page: filtering to one star while on page four
 * asks for a page that the narrowed list may not have.
 */
export function writeReviewParams(
  searchParams: URLSearchParams,
  changes: Partial<ReviewListParams>,
): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  const merged = { ...readReviewParams(searchParams), ...changes };

  if (changes.rating !== undefined || changes.sort !== undefined) {
    merged.page = changes.page ?? 1;
  }

  const entries: [string, string | null][] = [
    [REVIEW_PARAM_KEYS.page, merged.page === 1 ? null : String(merged.page)],
    [REVIEW_PARAM_KEYS.sort, merged.sort === 'newest' ? null : merged.sort],
    [REVIEW_PARAM_KEYS.rating, merged.rating === null ? null : String(merged.rating)],
  ];

  for (const [key, value] of entries) {
    if (value === null) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }

  return next;
}

/** The address of one page of reviews, with the rest of the query left in place. */
export function reviewPageHref(
  basePath: string,
  searchParams: URLSearchParams,
  page: number,
): string {
  const next = writeReviewParams(searchParams, { page }).toString();

  return next === '' ? basePath : `${basePath}?${next}`;
}
