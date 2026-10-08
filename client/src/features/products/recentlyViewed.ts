/**
 * The products this device has looked at.
 *
 * The recommendations shelf on the home page has nothing to personalise with
 * until somebody browses, and there is no endpoint that recommends by account —
 * `GET /api/products` filters, it does not guess. So the shelf is built from what
 * this device already knows: the products whose page was opened.
 *
 * A whole product summary is stored, not a slug. Turning slugs back into cards
 * would take a request per product, and there is no endpoint that loads products
 * by slug in one call; a stored summary draws straight away. Twelve summaries is
 * a few kilobytes, which is a fair price for a shelf that is on screen before a
 * request could finish.
 *
 * What is stored can go stale — the price especially. That is why the shelf is a
 * row of links and not a checkout: opening a card loads the product from the API,
 * and the product page shows today's price. The card shows what it last knew.
 *
 * The stored summaries carry the language they were fetched in, and a shelf
 * written in another language is not read back. A name is translated data now,
 * so a summary remembered on the English site says *Men's Cotton Oxford Shirt*
 * on the Russian one, and re-fetching twelve products to re-translate a shelf is
 * not worth it for a convenience feature. Empty history is the honest answer; the
 * shelf fills again as the visitor browses.
 *
 * Nothing here leaves the device, and clearing site data clears it.
 */

import { getLanguage } from '@/i18n/strings';
import type { Language } from '@/i18n/languages';
import type { Product } from '@/types/product';
import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';

/** How many products one device remembers. Older ones fall off the end. */
const MAX_REMEMBERED = 12;

/** The minimum a stored entry has to have to be worth drawing. */
function isStoredProduct(value: unknown): value is Product {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<Product>;

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.slug === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.price === 'number' &&
    typeof candidate.stock === 'number'
  );
}

/** The stored shape: the summaries, and the language they were written in. */
type StoredShelf = {
  lang: Language;
  products: Product[];
};

function isStoredShelf(value: unknown): value is StoredShelf {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<StoredShelf>;

  return typeof candidate.lang === 'string' && Array.isArray(candidate.products);
}

/**
 * What this device remembers, newest first. Malformed entries are dropped, and
 * so is a shelf written in another language — see the note at the top.
 */
export function readRecentlyViewed(): Product[] {
  const stored = readJson<unknown>(STORAGE_KEYS.recentlyViewed, null);

  if (!isStoredShelf(stored) || stored.lang !== getLanguage()) {
    return [];
  }

  return stored.products.filter(isStoredProduct);
}

/**
 * Records a visit. Opening the same product twice moves it back to the front
 * rather than adding a second entry, so the shelf never repeats itself.
 */
export function rememberProduct(product: Product): void {
  const others = readRecentlyViewed().filter((item) => item.id !== product.id);

  const shelf: StoredShelf = {
    lang: getLanguage(),
    products: [product, ...others].slice(0, MAX_REMEMBERED),
  };

  writeJson(STORAGE_KEYS.recentlyViewed, shelf);
}
