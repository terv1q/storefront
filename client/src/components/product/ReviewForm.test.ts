/**
 * The rules the review form applies before it sends anything.
 *
 * They are checked here as a unit rather than through the rendered form because
 * they are the same rules the server enforces, written twice on purpose: what
 * matters is that the client refuses exactly what the server refuses. A test that
 * had to fill in the form to ask whether ten characters are enough would be
 * testing the form's markup as much as its rules.
 */

import { describe, expect, it } from 'vitest';

import {
  REVIEW_BODY_LIMIT,
  REVIEW_BODY_MIN,
  REVIEW_TITLE_LIMIT,
  reviewFormSchema,
} from './ReviewForm';

function parse(values: { rating: number; title?: string; body: string }) {
  return reviewFormSchema.safeParse(values);
}

/** The key of the first broken rule, which is what the form turns into a sentence. */
function firstMessage(result: ReturnType<typeof parse>): string | undefined {
  return result.success ? undefined : result.error.issues[0]?.message;
}

describe('reviewFormSchema', () => {
  it('accepts a rating and a body at the floor', () => {
    const result = parse({ rating: 4, body: 'a'.repeat(REVIEW_BODY_MIN) });

    expect(result.success).toBe(true);
  });

  it('accepts a review with no title, which is what the column allows', () => {
    const result = parse({ rating: 5, body: 'It arrived quickly and works well.' });

    expect(result.success).toBe(true);
  });

  it('refuses a rating of zero, which is what the picker starts at', () => {
    expect(firstMessage(parse({ rating: 0, body: 'A perfectly good review.' }))).toBe('rating');
  });

  it('refuses a rating above five, and a fractional one', () => {
    expect(firstMessage(parse({ rating: 6, body: 'A perfectly good review.' }))).toBe('rating');
    expect(firstMessage(parse({ rating: 3.5, body: 'A perfectly good review.' }))).toBe('rating');
  });

  it('refuses a body shorter than the server accepts', () => {
    expect(firstMessage(parse({ rating: 4, body: 'Nice' }))).toBe('bodyMin');
  });

  it('counts the body after trimming, so spaces are not a review', () => {
    expect(firstMessage(parse({ rating: 4, body: ' '.repeat(30) }))).toBe('bodyMin');
  });

  it('refuses a body longer than the limit', () => {
    const result = parse({ rating: 4, body: 'a'.repeat(REVIEW_BODY_LIMIT + 1) });

    expect(firstMessage(result)).toBe('bodyMax');
  });

  it('refuses a title longer than the limit', () => {
    const result = parse({
      rating: 4,
      title: 'a'.repeat(REVIEW_TITLE_LIMIT + 1),
      body: 'A perfectly good review.',
    });

    expect(firstMessage(result)).toBe('title');
  });
});
