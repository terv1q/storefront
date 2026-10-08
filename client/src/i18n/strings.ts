/**
 * The interface copy the whole application reads, and the one place the chosen
 * language lives.
 *
 * Every component imports `strings` and reads it during render —
 * `strings.home.promoHeading` — rather than calling a function per sentence. That
 * works because `strings` is a live binding: `setLanguage` reassigns it, and
 * every module that imported it sees the new table on its next render. What has
 * to happen alongside the reassignment is a render, because the components were
 * already rendered when the table changed; that is what the subscriber list and
 * `useLanguage` are for, and `App` keys the layout on the language so the whole
 * tree above the language change is rebuilt rather than left holding the old
 * sentences.
 *
 * The choice is persisted, so the second visit opens in the language the first
 * one was left in. With nothing stored, the browser's own preference is used,
 * because a Russian-speaking visitor with a Russian browser should not have to
 * find the switcher before the page is readable. Falling back to English is the
 * last resort, not the first.
 *
 * The tables are held together in one record rather than imported where they are
 * needed, so an added language is one entry here and one table file, and the
 * type checker refuses to build until the table is complete.
 */
import { useSyncExternalStore } from 'react';

import { en } from '@/i18n/en';
import type { Strings } from '@/i18n/en';
import { ru } from '@/i18n/ru';
import { uz } from '@/i18n/uz';
import { DEFAULT_LANGUAGE, isLanguage, languageEntry } from '@/i18n/languages';
import type { Language } from '@/i18n/languages';
import { STORAGE_KEYS, readString, writeString } from '@/utils/storage';

const tables: Record<Language, Strings> = { en, ru, uz };

/**
 * What the visitor chose last time, or what the browser asks for. Only the
 * `en`/`ru`/`uz` prefix of the browser's tags is read, so `ru-RU` and `ru-BY`
 * both land on the Russian table.
 */
function readInitialLanguage(): Language {
  const stored = readString(STORAGE_KEYS.language);

  if (isLanguage(stored)) {
    return stored;
  }

  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? []) {
      const prefix = tag.split('-')[0];

      if (isLanguage(prefix)) {
        return prefix;
      }
    }
  }

  return DEFAULT_LANGUAGE;
}

let current: Language = readInitialLanguage();

export let strings: Strings = tables[current];

const listeners = new Set<() => void>();

/** The language the interface is currently in. */
export function getLanguage(): Language {
  return current;
}

/** The `Intl` locale for the current language, for numbers and dates. */
export function getLocale(): string {
  return languageEntry(current).locale;
}

/** The locale in the shape Open Graph wants, for `og:locale`. */
export function getOgLocale(): string {
  return languageEntry(current).ogLocale;
}

/**
 * Switches language, persists it, and tells `React` to render again.
 *
 * `<html lang>` is updated here rather than in a component because it belongs to
 * the document, and a screen reader picks the reading voice from it: left at
 * `en`, a Russian page is read aloud with English pronunciation.
 */
export function setLanguage(next: Language): void {
  if (next === current) {
    return;
  }

  current = next;
  strings = tables[next];

  writeString(STORAGE_KEYS.language, next);

  if (typeof document !== 'undefined') {
    document.documentElement.lang = next;
  }

  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * The current language, and a re-render whenever it changes. Read by the
 * components that need more than a sentence: the switcher's check mark, the
 * `Intl` locale passed to a formatter, the `lang` attribute on a subtree.
 *
 * The server snapshot is not a real case here — this is a client-rendered
 * application — but `useSyncExternalStore` asks for one, and the default is the
 * only honest answer before the stored preference has been read.
 */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, () => DEFAULT_LANGUAGE);
}

// The document element carries the language from the first paint, before any
// component has rendered.
if (typeof document !== 'undefined') {
  document.documentElement.lang = current;
}
