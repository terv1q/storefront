/**
 * Zod schemas for query-string parameters.
 *
 * Express hands every query value over as a string, or as an array when a
 * parameter is repeated. These schemas turn those strings into the numbers,
 * booleans, and enums the services expect, and they treat an empty parameter as
 * an absent one — a filter form that submits its empty fields means "no filter",
 * not "match the empty string".
 *
 * The resource routers compose these; the mechanics of running a schema against
 * a request live in `middleware/validate.ts`.
 */

import { z } from 'zod';

import { CATALOG_LOCALES, DEFAULT_CATALOG_LOCALE, type CatalogLocale } from './locale.js';

/** An absent parameter and an empty one mean the same thing: no filter. */
export function emptyToUndefined(value: unknown): unknown {
  return value === '' || value === undefined ? undefined : value;
}

/** Free text: trimmed, non-empty once given, and bounded. */
export function textParam(maxLength = 120) {
  return z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .min(1, 'This value cannot be empty.')
      .max(maxLength, `Use at most ${maxLength} characters.`)
      .optional(),
  );
}

/**
 * A search term. Unlike `textParam`, a blank term is not an error: a shopper who
 * has typed only spaces, or who cleared the box, has simply not searched yet.
 * The term comes back trimmed, or undefined when there is nothing to search for.
 */
export function searchTermParam(maxLength = 120) {
  return z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return undefined;
      }

      const trimmed = value.trim();

      return trimmed === '' ? undefined : trimmed;
    },
    z.string().max(maxLength, `Use at most ${maxLength} characters.`).optional(),
  );
}

/** A whole number within a range, or nothing at all. */
export function intParam(minimum: number, maximum: number) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int('Use a whole number.')
      .min(minimum, `Use a value of at least ${minimum}.`)
      .max(maximum, `Use a value of at most ${maximum}.`)
      .optional(),
  );
}

/** A star rating, which may be fractional. */
export function ratingParam() {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .min(0, 'Use a rating of at least 0.')
      .max(5, 'Use a rating of at most 5.')
      .optional(),
  );
}

export function booleanParam() {
  return z.preprocess(
    emptyToUndefined,
    z
      .enum(['true', 'false'], 'Use true or false.')
      .transform((value) => value === 'true')
      .optional(),
  );
}

/** One of a fixed set of values, or nothing at all. */
export function enumParam<const T extends readonly [string, ...string[]]>(values: T) {
  return z.preprocess(emptyToUndefined, z.enum(values).optional());
}

export function pageParam() {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: 'Use a whole number.' })
      .int('Use a whole number.')
      .min(1, 'Page 1 is the first page.')
      .default(1),
  );
}

/** Page size. Each endpoint sets its own default and ceiling. */
export function limitParam(fallback: number, maximum: number) {
  return z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ error: 'Use a whole number.' })
      .int('Use a whole number.')
      .min(1, 'Ask for at least one item.')
      .max(maximum, `Ask for at most ${maximum} items.`)
      .default(fallback),
  );
}

/** How many attributes one request may narrow a listing by. */
const ATTR_MAX_ENTRIES = 12;

/** How many characters a name or a value may hold. */
const ATTR_MAX_LENGTH = 60;

/** One variant attribute a listing is narrowed by. */
export type VariantFilter = { name: string; value: string };

/**
 * Variant attributes, as `attr=Size:M` repeated once per attribute.
 *
 * A product's options are rows rather than columns, so one of them is a name and
 * a value together, and the name is what lets one parameter carry Size and
 * Colour at once. Both halves must be the English pair the catalog stores: that
 * is the pair the facets endpoint hands back and the pair the row is matched on,
 * while the translated wording is display only and is never sent here.
 *
 * A malformed entry is refused rather than dropped. A client that sends
 * `attr=Size` has a bug, and quietly ignoring it would show a listing that is
 * wider than the one the shopper asked for.
 */
export function attrParams() {
  return z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined;
      }

      const entries = Array.isArray(value) ? value : [value];

      return entries.map((entry) => String(entry).trim()).filter((entry) => entry !== '');
    },
    z
      .array(
        z
          .string()
          .max(ATTR_MAX_LENGTH * 2 + 1, 'Use a shorter attribute.')
          .refine((entry) => entry.includes(':'), 'Use the form Name:Value.')
          .transform((entry) => {
            const separator = entry.indexOf(':');

            return {
              name: entry.slice(0, separator).trim(),
              value: entry.slice(separator + 1).trim(),
            };
          })
          .refine((attr) => attr.name !== '' && attr.value !== '', 'Use the form Name:Value.')
          .refine(
            (attr) => attr.name.length <= ATTR_MAX_LENGTH && attr.value.length <= ATTR_MAX_LENGTH,
            'Use a shorter attribute.',
          ),
      )
      .max(ATTR_MAX_ENTRIES, `Use at most ${ATTR_MAX_ENTRIES} attributes.`)
      .optional(),
  );
}

/**
 * How many products one request may name.
 *
 * The same number as the listing's own page ceiling: a caller that asks for an
 * exact set is asking for one page of them, and a longer list is a request the
 * client should have split.
 */
const MAX_ID_FILTER = 120;

/**
 * An exact set of products, as `ids=<uuid>` repeated once per product.
 *
 * This is what the save-for-later list a signed-out visitor keeps in the browser
 * is read back through: the browser holds ids and nothing else, so the page asks
 * the catalog for exactly those products and gets current names, current prices,
 * and the browsing language's translation, instead of a copy taken on the day
 * the product was saved. The listing's active-only rule comes with it, so a
 * product that has been switched off drops out rather than being offered as
 * something to come back for.
 *
 * Repeated rather than comma-joined for the same reason `attrParams` is, and
 * bounded because the parameter is public. An empty parameter means no filter
 * rather than "none of them": a filter form that submits nothing has not asked
 * for anything. A value that is not a UUID is refused, because a client that
 * sends one did not get it from this API.
 */
export function idsParam() {
  return z.preprocess(
    (value) => {
      if (value === undefined) {
        return undefined;
      }

      const entries = Array.isArray(value) ? value : [value];
      const trimmed = entries.map((entry) => String(entry).trim()).filter((entry) => entry !== '');

      return trimmed.length === 0 ? undefined : trimmed;
    },
    z
      .array(z.uuid('Choose a valid product.'))
      .max(MAX_ID_FILTER, `Ask for at most ${MAX_ID_FILTER} products.`)
      .optional(),
  );
}

/**
 * The language the catalog should answer in.
 *
 * Absent means English, so the parameter is optional and an old link without it
 * keeps working. An unsupported value is rejected rather than ignored: a client
 * that asks for `de` has a bug, and silently answering in English would hide it
 * until someone noticed the wrong language on a page.
 */
export function langParam() {
  return z.preprocess(
    emptyToUndefined,
    z.enum(CATALOG_LOCALES, 'Use en, ru or uz.').default(DEFAULT_CATALOG_LOCALE),
  );
}

/** The inferred shape of `langParam`, so routers do not restate the union. */
export type LangQuery = { lang: CatalogLocale };
