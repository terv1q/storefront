/**
 * Browser persistence. Every read and write goes through this module, so a
 * missing or failing `localStorage` (private mode, quota, blocked cookies)
 * never throws inside a component.
 *
 * New keys are added to `STORAGE_KEYS` rather than written as string literals.
 */

export const STORAGE_KEYS = {
  accessToken: 'ziyo:accessToken',
  cart: 'ziyo:cart',
  /**
   * Products a visitor has saved before signing in, newest first, stored as
   * ids. Ids rather than whole products: the page that draws them asks the
   * catalog for exactly those products, so a saved product carries today's name,
   * price, and translation instead of a copy taken when it was saved. The list
   * is emptied into the account the first time somebody signs in.
   */
  wishlist: 'ziyo:wishlist',
  /** Version of the announcement strip the visitor has dismissed. */
  announcementDismissed: 'ziyo:announcementDismissed',
  /** Region the visitor picked in the announcement bar. */
  market: 'ziyo:market',
  /** Language the visitor picked in the header, as an `i18n/languages` code. */
  language: 'ziyo:language',
  /** Terms the visitor searched for, newest first. */
  recentSearches: 'ziyo:recentSearches',
  /** Email addresses entered in the footer newsletter form, newest first. */
  newsletterEmails: 'ziyo:newsletterEmails',
  /**
   * Products the visitor opened, newest first, stored as whole product
   * summaries. The recommendations shelf draws them without a request, and a
   * list of slugs could not be drawn without one per product.
   */
  recentlyViewed: 'ziyo:recentlyViewed',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** True when storage exists and accepts a write. */
export function isStorageAvailable(): boolean {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    const probe = '__ziyo_probe__';
    storage.setItem(probe, probe);
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function readString(key: StorageKey): string | null {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** Returns false when the value could not be stored. */
export function writeString(key: StorageKey, value: string): boolean {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: StorageKey): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Nothing to do: the value is unreachable either way.
  }
}

/**
 * Reads a JSON value. Unparsable content is discarded and the fallback is
 * returned, so one bad write cannot break every later page load.
 */
export function readJson<T>(key: StorageKey, fallback: T): T {
  const raw = readString(key);

  if (raw === null) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    removeItem(key);
    return fallback;
  }
}

/** Returns false when the value could not be serialised or stored. */
export function writeJson(key: StorageKey, value: unknown): boolean {
  try {
    return writeString(key, JSON.stringify(value));
  } catch {
    return false;
  }
}

export function getAccessToken(): string | null {
  const token = readString(STORAGE_KEYS.accessToken);

  return token ? token : null;
}

export function setAccessToken(token: string): boolean {
  return writeString(STORAGE_KEYS.accessToken, token);
}

/**
 * Drops everything tied to the signed-in session. Called on sign out and by the
 * API client when the server rejects the stored token.
 */
export function clearAuthStorage(): void {
  removeItem(STORAGE_KEYS.accessToken);
}

/**
 * The saved products a visitor keeps before signing in, or `null` when nothing
 * has been stored yet. Anything that is not a string is dropped, so a list
 * written by an older version of the app cannot put an undefined into a request.
 */
export function readWishlist(): string[] | null {
  const ids = readJson<unknown>(STORAGE_KEYS.wishlist, null);

  if (!Array.isArray(ids)) {
    return null;
  }

  return ids.filter((id): id is string => typeof id === 'string' && id !== '');
}

export function writeWishlist(ids: readonly string[]): boolean {
  return writeJson(STORAGE_KEYS.wishlist, ids);
}

export function clearWishlist(): void {
  removeItem(STORAGE_KEYS.wishlist);
}
