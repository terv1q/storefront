/**
 * The catalogue's translations, and the rule that keeps them complete.
 *
 * Two tables, Russian and Uzbek, each keyed by the English source string. This
 * module is the only place that reads them: `t` for a string the seed is about
 * to write, `missingTranslations` for the check that runs before the seed writes
 * anything at all, and `composeDescription` for the one field that is assembled
 * from parts rather than looked up whole.
 *
 * The check is the point of the design. A storefront that is 90% translated is
 * not a state worth being able to reach quietly: it renders pages that switch
 * language halfway down, and nobody notices until a customer does. So the seed
 * collects every English string the catalogue can write, asks both tables for
 * each one, and refuses to start if anything is missing — listing all of it,
 * rather than failing on the first gap one error at a time.
 */

import { ru } from './translations.ru.js';
import { uz } from './translations.uz.js';

/** The languages the catalogue carries text for. */
export const TRANSLATION_LOCALES = ['ru', 'uz'] as const;

export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

/** A locale the seed writes: English itself, or one of the translations. */
export type SeedLocale = 'en' | TranslationLocale;

/** Every locale the seed writes, in the order the columns are declared. */
export const SEED_LOCALES: readonly SeedLocale[] = ['en', ...TRANSLATION_LOCALES];

const TABLES: Record<TranslationLocale, Record<string, string>> = { ru, uz };

/** The translation of an English string, or `undefined` when there is none. */
export function lookup(locale: TranslationLocale, english: string): string | undefined {
  return TABLES[locale][english];
}

/**
 * The translation of an English string.
 *
 * Throws rather than falling back to English. `missingTranslations` is supposed
 * to have caught every gap before the seed wrote its first row, so reaching this
 * throw means a string was written into the catalogue without being added to the
 * check — a bug, and one that should stop the seed rather than quietly produce a
 * half-English row.
 */
export function t(locale: TranslationLocale, english: string): string {
  const translated = lookup(locale, english);

  if (translated === undefined) {
    throw new Error(
      `No ${locale} translation for ${JSON.stringify(english)}. Add it to prisma/translations.${locale}.ts.`,
    );
  }

  return translated;
}

/**
 * Every English string with no entry in one of the tables, grouped by locale.
 *
 * Both locales are reported at once and every gap in each is listed, because a
 * translator fixing one missing string at a time, twenty times, is twenty seed
 * runs that each fail after a full catalogue walk.
 */
export function missingTranslations(
  english: Iterable<string>,
): Record<TranslationLocale, string[]> {
  const missing: Record<TranslationLocale, string[]> = { ru: [], uz: [] };

  for (const string of new Set(english)) {
    for (const locale of TRANSLATION_LOCALES) {
      if (lookup(locale, string) === undefined) {
        missing[locale].push(string);
      }
    }
  }

  return missing;
}

/** True when neither locale is missing anything. */
export function isComplete(missing: Record<TranslationLocale, string[]>): boolean {
  return TRANSLATION_LOCALES.every((locale) => missing[locale].length === 0);
}

/** A readable report of what is missing, for the seed to throw. */
export function describeMissing(missing: Record<TranslationLocale, string[]>): string {
  return TRANSLATION_LOCALES.filter((locale) => missing[locale].length > 0)
    .map((locale) => {
      const list = missing[locale].map((string) => `  - ${JSON.stringify(string)}`).join('\n');

      return `${missing[locale].length} ${locale} translation(s) missing:\n${list}`;
    })
    .join('\n');
}

/**
 * The three parts a product description is assembled from.
 *
 * A description is not a translatable string of its own: it is the category
 * blurb, the category detail, and a closing sentence naming the brand. Storing
 * one description per language per product would be 369 strings that all say the
 * same thing as the 26 blurbs and 26 details they are built from, so the parts
 * are translated and the sentence is composed per locale instead.
 */
export type DescriptionParts = {
  /** The English product name, which is a key into the tables. */
  name: string;
  /** `null` for the products that are not made by a brand. */
  brand: string | null;
  /** The English category blurb. */
  shortDescription: string;
  /** The English category detail, the second half of the long description. */
  detail: string;
};

/**
 * The closing sentence of a description, per locale. English is written as a
 * template too, so the three read as a set and a new locale is one more entry
 * rather than a second code path.
 */
const BRAND_SENTENCE: Record<SeedLocale, (name: string, brand: string) => string> = {
  en: (name, brand) => `${name} is made by ${brand}.`,
  ru: (name, brand) => `${name} — производство ${brand}.`,
  uz: (name, brand) => `${name} ${brand} tomonidan ishlab chiqarilgan.`,
};

const WAREHOUSE_SENTENCE: Record<SeedLocale, (name: string) => string> = {
  en: (name) => `${name} ships from the Ziyo warehouse.`,
  ru: (name) => `${name} отправляется со склада Ziyo.`,
  uz: (name) => `${name} Ziyo omboridan yuboriladi.`,
};

/**
 * The short description of a product in one locale.
 *
 * The English short description is left exactly as the seed wrote it before the
 * catalogue had translations, so a client asking for `lang=en` gets byte-for-byte
 * what it used to get.
 */
export function shortDescriptionFor(locale: SeedLocale, englishBlurb: string): string {
  return locale === 'en' ? englishBlurb : t(locale, englishBlurb);
}

/** The long description of a product in one locale. */
export function composeDescription(locale: SeedLocale, parts: DescriptionParts): string {
  const name = locale === 'en' ? parts.name : t(locale, parts.name);
  const detail = locale === 'en' ? parts.detail : t(locale, parts.detail);
  const blurb = shortDescriptionFor(locale, parts.shortDescription);

  const closing =
    parts.brand === null
      ? WAREHOUSE_SENTENCE[locale](name)
      : BRAND_SENTENCE[locale](name, parts.brand);

  return [blurb, detail, closing].join(' ');
}
