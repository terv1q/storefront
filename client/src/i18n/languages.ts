/**
 * The languages the interface is written in, and what each one carries with it.
 *
 * A language here is two things that are easy to conflate: which table of copy
 * the interface reads, and which locale the numbers and dates are formatted
 * with. They travel together — a German interface showing `1,234.50` is a German
 * interface that has not finished the job — so they are one entry rather than
 * two settings.
 *
 * `name` is the language's own name, in its own language, because it is read by
 * someone who may not be able to read the language the page is currently in.
 * That is also why the switcher shows `name` and not a translated word for it.
 *
 * `locale` is what goes to `Intl`. `uz-UZ` is the Latin-script locale; a
 * Cyrillic Uzbek would be `uz-Cyrl-UZ` and would need a table of its own, not an
 * entry here.
 *
 * `short` is the two-letter code shown on the closed control. Three of them at
 * two letters each fit in a header; the full names would not.
 *
 * `ogLocale` is the same locale in the shape Open Graph wants — an underscore
 * where `Intl` takes a hyphen, and a region even where `Intl` is happy without
 * one — so the two are written down together instead of one being folded out of
 * the other with a rule that gets `en` wrong.
 */
export type Language = 'en' | 'ru' | 'uz';

export type LanguageEntry = {
  code: Language;
  name: string;
  short: string;
  locale: string;
  ogLocale: string;
};

export const LANGUAGES: readonly LanguageEntry[] = [
  { code: 'en', name: 'English', short: 'EN', locale: 'en-US', ogLocale: 'en_US' },
  { code: 'ru', name: 'Русский', short: 'RU', locale: 'ru-RU', ogLocale: 'ru_RU' },
  { code: 'uz', name: 'Oʻzbekcha', short: 'UZ', locale: 'uz-UZ', ogLocale: 'uz_UZ' },
];

/**
 * English, because it is the table the other two are validated against and the
 * one an entry added without a translation can still be written in.
 */
export const DEFAULT_LANGUAGE: Language = 'en';

/** Narrows a stored or requested value to a language this build actually has. */
export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((entry) => entry.code === value);
}

/** The entry for a code, never undefined: an unknown code falls back to the default. */
export function languageEntry(code: Language): LanguageEntry {
  return LANGUAGES.find((entry) => entry.code === code) ?? LANGUAGES[0]!;
}
