/**
 * The catalog locales, and the rule for reading a translated column.
 *
 * A catalog row stores its English text in the base column and its translations
 * in `Ru`/`Uz` siblings (`name` / `nameRu` / `nameUz`). Every read of a
 * translatable field goes through the suffix below, so the fallback rule lives
 * in exactly one place: a translation that has not been written yet reads as the
 * English text rather than an empty string. The seed refuses to write a catalog
 * with gaps, so in a seeded database the fallback never fires — it exists for a
 * database that was edited by hand.
 *
 * The API response shape does not change with the locale. A translated field is
 * mapped back onto the field name the client already knows, so a product is
 * always `{ name, description, ... }` and only its contents depend on `lang`.
 */

/** The locales the catalog carries text for. Mirrors `Language` on the client. */
export const CATALOG_LOCALES = ['en', 'ru', 'uz'] as const;

export type CatalogLocale = (typeof CATALOG_LOCALES)[number];

/** English, the base language and the one every other locale falls back to. */
export const DEFAULT_CATALOG_LOCALE: CatalogLocale = 'en';

/**
 * The column suffix that holds a locale's text.
 *
 * English is the base column, so its suffix is the empty string — which is what
 * lets a mapper write ``row[`name${suffix}`]`` and have TypeScript resolve it to
 * a real column instead of a lookup that might not exist.
 */
export const LOCALE_SUFFIX: Record<CatalogLocale, '' | 'Ru' | 'Uz'> = {
  en: '',
  ru: 'Ru',
  uz: 'Uz',
};

/**
 * The locale a search should be scored against.
 *
 * Search is deliberately different from display: a query is matched against
 * every locale at once, because a shopper searching in Russian should still find
 * a product whose Uzbek name is the one that contains the term. This is only
 * used to decide which language's ranking gets a small boost, so that a Russian
 * query ranks Russian text slightly above an equally good English match.
 */
export type SearchLocale = CatalogLocale;
