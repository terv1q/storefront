/**
 * The review list's slice of the address.
 *
 * What is worth testing here is the same thing the catalog's parameter tests
 * check: that the URL survives a round trip, that defaults stay out of it, and
 * that a hand-mangled query string degrades to the plain list rather than to an
 * error. The three names are also checked for the one rule that is easy to get
 * wrong: changing what the list contains has to return to its first page.
 */

import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REVIEW_PARAMS,
  readReviewParams,
  reviewPageHref,
  writeReviewParams,
} from './reviewParams';

function params(init: string): URLSearchParams {
  return new URLSearchParams(init);
}

describe('readReviewParams', () => {
  it('reads the three names it owns', () => {
    expect(readReviewParams(params('reviewPage=3&reviewSort=lowest&reviewRating=2'))).toEqual({
      page: 3,
      sort: 'lowest',
      rating: 2,
    });
  });

  it('falls back to the defaults when nothing is given', () => {
    expect(readReviewParams(params(''))).toEqual(DEFAULT_REVIEW_PARAMS);
  });

  it('treats an unparsable value as no filter rather than as an error', () => {
    expect(readReviewParams(params('reviewPage=-2&reviewSort=cheapest&reviewRating=9'))).toEqual(
      DEFAULT_REVIEW_PARAMS,
    );

    expect(readReviewParams(params('reviewPage=2.5&reviewRating=nine'))).toEqual(
      DEFAULT_REVIEW_PARAMS,
    );
  });
});

describe('writeReviewParams', () => {
  it('leaves the defaults out of the address', () => {
    const written = writeReviewParams(params('reviewPage=4&reviewSort=highest'), {
      page: 1,
      sort: 'newest',
      rating: null,
    });

    expect(written.toString()).toBe('');
  });

  it('writes a non-default slice', () => {
    const written = writeReviewParams(params(''), { page: 2, sort: 'highest', rating: 5 });

    expect(readReviewParams(written)).toEqual({ page: 2, sort: 'highest', rating: 5 });
    expect(written.toString()).toContain('reviewPage=2');
  });

  it('preserves parameters it does not own', () => {
    const written = writeReviewParams(params('utm_source=email&reviewRating=3'), { page: 2 });

    expect(written.get('utm_source')).toBe('email');
    expect(written.get('reviewRating')).toBe('3');
    expect(written.get('reviewPage')).toBe('2');
  });

  it('returns to the first page when the list is narrowed or reordered', () => {
    const narrowed = writeReviewParams(params('reviewPage=5'), { rating: 4 });
    expect(readReviewParams(narrowed).page).toBe(1);

    const reordered = writeReviewParams(params('reviewPage=5'), { sort: 'lowest' });
    expect(readReviewParams(reordered).page).toBe(1);
  });

  it('keeps the page when only the page is being changed', () => {
    const paged = writeReviewParams(params('reviewPage=2&reviewSort=lowest'), { page: 3 });

    expect(readReviewParams(paged)).toEqual({ page: 3, sort: 'lowest', rating: null });
  });
});

describe('reviewPageHref', () => {
  it('builds an address a visitor could open directly', () => {
    expect(reviewPageHref('/product/teapot', params('reviewSort=highest'), 3)).toBe(
      '/product/teapot?reviewSort=highest&reviewPage=3',
    );
  });

  it('drops the query string when the link is the plain list', () => {
    expect(reviewPageHref('/product/teapot', params('reviewPage=2'), 1)).toBe('/product/teapot');
  });
});
