/**
 * URL slug generation. Deterministic: the same input always produces the same
 * slug, so a link built on the client matches the slug stored on the server.
 */

/** Apostrophes used in Uzbek Latin text, including the modifier letter form. */
const APOSTROPHES = /['’‘`´ʻʼʽ]/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

/** Turns arbitrary text into a lowercase, hyphen-separated slug. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(APOSTROPHES, '')
    .toLowerCase()
    .replace(NON_ALPHANUMERIC, '-')
    .replace(/^-+|-+$/g, '');
}
