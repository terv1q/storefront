/**
 * The terms this visitor searched for, newest first.
 *
 * It is a Zustand store rather than a hook with local state, because the same
 * list is shown by every search box — the header, the mobile drawer, and the
 * search page — and three copies would disagree the moment one of them
 * remembered a term.
 *
 * Matching is case-insensitive and whitespace-trimmed, so "Kettle", "kettle ",
 * and "kettle" are one entry rather than three, and the most recent spelling
 * wins. The list is capped, because a suggestion panel that lists fifty past
 * terms is not a shortcut. Storage can refuse a write; the term still applies to
 * this session, and the next load falls back to whatever was stored before.
 */

import { create } from 'zustand';

import { STORAGE_KEYS, readJson, removeItem, writeJson } from '@/utils/storage';

/** How many terms are kept. The panel shows the first few of these. */
export const MAX_RECENT_SEARCHES = 8;

/** Longest term worth remembering; the field itself accepts more. */
const MAX_TERM_LENGTH = 64;

type RecentSearchesState = {
  terms: string[];
  /** Records a term the visitor actually submitted or followed. */
  remember: (term: string) => void;
  /** Drops one term. */
  forget: (term: string) => void;
  /** Drops every term. */
  clear: () => void;
};

function isTerm(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Stored terms, or none when nothing usable was written. */
function initialTerms(): string[] {
  const stored = readJson<unknown>(STORAGE_KEYS.recentSearches, null);

  if (!Array.isArray(stored)) {
    return [];
  }

  return stored.filter(isTerm).slice(0, MAX_RECENT_SEARCHES);
}

/** Persists the list, or drops the key when storage will not take it. */
function persist(terms: readonly string[]): void {
  if (writeJson(STORAGE_KEYS.recentSearches, terms) === false) {
    removeItem(STORAGE_KEYS.recentSearches);
  }
}

export const useRecentSearches = create<RecentSearchesState>((set, get) => ({
  terms: initialTerms(),

  remember: (term) => {
    const trimmed = term.trim().slice(0, MAX_TERM_LENGTH);

    if (trimmed.length === 0) {
      return;
    }

    const lower = trimmed.toLowerCase();
    const terms = [trimmed, ...get().terms.filter((entry) => entry.toLowerCase() !== lower)].slice(
      0,
      MAX_RECENT_SEARCHES,
    );

    persist(terms);
    set({ terms });
  },

  forget: (term) => {
    const lower = term.toLowerCase();
    const terms = get().terms.filter((entry) => entry.toLowerCase() !== lower);

    persist(terms);
    set({ terms });
  },

  clear: () => {
    removeItem(STORAGE_KEYS.recentSearches);
    set({ terms: [] });
  },
}));
