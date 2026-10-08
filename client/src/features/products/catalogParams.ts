/**
 * The catalog URL, and the only place its vocabulary is written down.
 *
 * The listing page is driven entirely by the query string: the sort order, the
 * page, the layout, and the search term all live there. That is what makes a
 * filtered listing shareable, what makes the browser's Back button walk a
 * shopper through the changes they made, and what makes a reload land where the
 * shopper left off. The alternative — component state that mirrors the URL — is
 * two sources of truth that drift the first time one of them is updated alone.
 *
 * Every reader here is tolerant, because a query string is user input. An
 * unknown sort, a page of `abc`, or a layout of `masonry` falls back to the
 * default rather than throwing or reaching the API: `?sort=cheapest` should show
 * the catalog, not a broken page. Every writer omits defaults, so a link that
 * says nothing more than which category it points at stays short.
 *
 * Parameters this module does not know about are preserved on write, so the
 * filter parameters of the next stage can be added without a sort change
 * silently dropping them.
 */

import type { ProductListQuery, ProductSort } from '@/types/product';
import { MINOR_UNITS_PER_UNIT } from '@/utils/formatPrice';

/** The two layouts the grid can be drawn in. */
export type CatalogView = 'grid' | 'list';

/**
 * One variant attribute the listing is narrowed by.
 *
 * The name and the value are the English pair the catalog stores, because they
 * are what the query is matched on and what the facets endpoint publishes as
 * keys. What the shopper reads comes from the facet's own label.
 */
export type CatalogAttribute = {
  name: string;
  value: string;
};

export type CatalogParams = {
  sort: ProductSort;
  page: number;
  /**
   * How many pages of the listing are stacked under the grid, or 1 for the
   * ordinary single page. It is what Load More advances: on a narrow screen the
   * numbers under the grid are replaced by one button, and pressing it shows the
   * next page's products below the ones already there rather than navigating to
   * them. The stack is asked for as one longer page — `page` 1 with a `limit` of
   * `CATALOG_PAGE_SIZE × pages` — so the shopper keeps their place in the list and
   * the browser does not have to reload what it already showed.
   *
   * A stacked listing starts at the first page, so `page` is ignored while this is
   * above 1; the reader keeps it at 1 for that reason.
   */
  pages: number;
  view: CatalogView;
  /** The term the listing is filtered by within its category. Empty when none. */
  q: string;
  /** Brand slug, or empty for all brands. */
  brand: string;
  /**
   * Price bounds **in so'm**, which is what the URL spells. The API counts in
   * tiyin; the conversion happens once, at the query boundary, and nowhere else.
   * `null` means the bound is not set.
   */
  minPrice: number | null;
  maxPrice: number | null;
  /** Lowest rating to include, or `null` for any. */
  minRating: number | null;
  inStock: boolean;
  onSale: boolean;
  attrs: readonly CatalogAttribute[];
};

/** What a catalog URL means when it says nothing. */
export const DEFAULT_CATALOG_PARAMS: CatalogParams = {
  sort: 'featured',
  page: 1,
  pages: 1,
  view: 'grid',
  q: '',
  brand: '',
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStock: false,
  onSale: false,
  attrs: [],
};

/**
 * Everything a filter change can reset.
 *
 * Clearing writes these defaults, which `writeCatalogParams` then removes from the
 * URL rather than spelling out — the sort order and the layout are deliberately
 * absent, because a shopper who clears the filters has not asked to change how the
 * products are ordered or shown.
 *
 * The page and the stack are both here: a filter change alters what every page
 * holds, so neither the number nor the height of what was loaded still means what
 * it did.
 */
export const CLEARED_FILTERS = {
  q: '',
  brand: '',
  minPrice: null,
  maxPrice: null,
  minRating: null,
  inStock: false,
  onSale: false,
  attrs: [],
  page: 1,
  pages: 1,
} satisfies Partial<CatalogParams>;

/**
 * How many products one page holds.
 *
 * The server's own default, repeated rather than discovered: the client asks for
 * it explicitly so the grid, the skeleton, and the pagination all agree on the
 * size of a page even if the server's default ever moves. A `limit` the server
 * caps is the one thing that would silently break the page count.
 */
export const CATALOG_PAGE_SIZE = 24;

/**
 * How many pages Load More may stack, which is as far as one request can reach.
 *
 * The ceiling is the server's: a `limit` above `MAX_PAGE_SIZE` is refused rather
 * than trimmed, and the two constants are one decision written in two places
 * because only one of them can be imported. The button stops offering another page
 * at this depth and the numbered pager — which the phone hides — is what carries
 * the shopper past it.
 */
export const MAX_CATALOG_PAGES = 5;

const SORTS: readonly ProductSort[] = ['featured', 'price_asc', 'price_desc', 'rating', 'newest'];
const VIEWS: readonly CatalogView[] = ['grid', 'list'];

function isSort(value: string | null): value is ProductSort {
  return value !== null && (SORTS as readonly string[]).includes(value);
}

function isView(value: string | null): value is CatalogView {
  return value !== null && (VIEWS as readonly string[]).includes(value);
}

/** A whole, non-negative amount of so'm, or `null` for anything else. */
function readAmount(raw: string | null): number | null {
  if (raw === null) {
    return null;
  }

  const value = Number.parseInt(raw.trim(), 10);

  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** A rating between 0 and 5, or `null`. */
function readRating(raw: string | null): number | null {
  if (raw === null) {
    return null;
  }

  const value = Number.parseFloat(raw.trim());

  return Number.isFinite(value) && value >= 0 && value <= 5 ? value : null;
}

const ATTRIBUTE_SEPARATOR = ':';

/**
 * One attribute, or `null` when the pair is not one.
 *
 * A well-formed pair the catalog does not stock is kept and sent: it matches
 * nothing, which is the truthful answer for a link somebody shared. Dropping it
 * would quietly widen the listing to everything, which is the one outcome a
 * filter must never produce.
 */
function readAttribute(raw: string): CatalogAttribute | null {
  const separator = raw.indexOf(ATTRIBUTE_SEPARATOR);

  if (separator <= 0) {
    return null;
  }

  const name = raw.slice(0, separator).trim();
  const value = raw.slice(separator + 1).trim();

  return name === '' || value === '' ? null : { name, value };
}

function readAttributes(search: URLSearchParams): CatalogAttribute[] {
  return search
    .getAll('attr')
    .map(readAttribute)
    .filter((attribute): attribute is CatalogAttribute => attribute !== null);
}

/**
 * How many pages a URL asks to have stacked. Anything unreadable, below one, or
 * past the ceiling becomes one page: a hand-edited `?pages=99` would otherwise be
 * sent as a `limit` the server refuses, turning a typo into an error page.
 */
function readPageCount(raw: string | null): number {
  const value = Number.parseInt(raw ?? '', 10);

  if (!Number.isFinite(value) || value < 1) {
    return DEFAULT_CATALOG_PARAMS.pages;
  }

  return Math.min(value, MAX_CATALOG_PAGES);
}

/**
 * The listing a query string asks for. Anything unreadable becomes the default,
 * so a hand-edited URL degrades to the plain catalog instead of an error.
 */
export function readCatalogParams(search: URLSearchParams): CatalogParams {
  const sort = search.get('sort');
  const view = search.get('view');
  const page = Number.parseInt(search.get('page') ?? '', 10);
  const pages = readPageCount(search.get('pages'));

  return {
    sort: isSort(sort) ? sort : DEFAULT_CATALOG_PARAMS.sort,
    // A stacked listing always begins at the first page, so a page number beside a
    // stack is not a page the shopper is on; reading it as 1 keeps the address and
    // the grid saying the same thing.
    page: pages > 1 || !Number.isFinite(page) || page < 1 ? DEFAULT_CATALOG_PARAMS.page : page,
    pages,
    view: isView(view) ? view : DEFAULT_CATALOG_PARAMS.view,
    q: search.get('q')?.trim() ?? DEFAULT_CATALOG_PARAMS.q,
    brand: search.get('brand')?.trim() ?? DEFAULT_CATALOG_PARAMS.brand,
    minPrice: readAmount(search.get('minPrice')),
    maxPrice: readAmount(search.get('maxPrice')),
    minRating: readRating(search.get('minRating')),
    inStock: search.get('inStock') === 'true',
    onSale: search.get('onSale') === 'true',
    attrs: readAttributes(search),
  };
}

/**
 * The same query string with some of the listing changed.
 *
 * A parameter set back to its default is removed rather than written down, and
 * everything this module does not own — a campaign tag, a parameter a later
 * stage adds — is carried over untouched.
 *
 * The attributes are written here rather than by the loop above: they are one
 * parameter repeated once per attribute, so there is no single value to compare
 * against a default, and no way for the loop to clear the old ones before the
 * new ones are appended.
 */
export function writeCatalogParams(
  search: URLSearchParams,
  changes: Partial<CatalogParams>,
): URLSearchParams {
  const next = new URLSearchParams(search);
  const { attrs, ...scalars } = changes;

  for (const [key, value] of Object.entries(scalars)) {
    const isDefault = value === DEFAULT_CATALOG_PARAMS[key as keyof CatalogParams];

    if (isDefault || value === '') {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
  }

  if (attrs !== undefined) {
    next.delete('attr');

    for (const attribute of attrs) {
      next.append('attr', `${attribute.name}${ATTRIBUTE_SEPARATOR}${attribute.value}`);
    }
  }

  return next;
}

/**
 * Everything a listing request says apart from which shelf it is and what it is
 * looking for. Both pages narrow, sort, order, and page the same way, and this is
 * the part they share.
 *
 * The only place so'm become tiyin. The URL, the panel, and the shopper think in
 * whole sums; the database counts in minor units. A conversion written down in
 * two places is a conversion that will disagree with itself.
 */
function toSharedQuery(params: CatalogParams): Omit<ProductListQuery, 'category' | 'q'> {
  const stacked = params.pages > 1;

  return {
    sort: params.sort,
    // A stack is one request for its whole height, which is why it is asked for
    // from the first page and with a longer `limit` rather than as several pages.
    page: stacked ? DEFAULT_CATALOG_PARAMS.page : params.page,
    limit: stacked ? CATALOG_PAGE_SIZE * params.pages : CATALOG_PAGE_SIZE,
    ...(params.brand === '' ? {} : { brand: params.brand }),
    ...(params.minPrice === null ? {} : { minPrice: params.minPrice * MINOR_UNITS_PER_UNIT }),
    ...(params.maxPrice === null ? {} : { maxPrice: params.maxPrice * MINOR_UNITS_PER_UNIT }),
    ...(params.minRating === null ? {} : { minRating: params.minRating }),
    ...(params.inStock ? { inStock: true } : {}),
    ...(params.onSale ? { onSale: true } : {}),
    ...(params.attrs.length === 0
      ? {}
      : { attr: params.attrs.map((attribute) => `${attribute.name}:${attribute.value}`) }),
  };
}

/** The term, sent only when there is one. An empty `q` is not a search. */
function termPart(params: CatalogParams): { q?: string } {
  return params.q === '' ? {} : { q: params.q };
}

/**
 * The request the listing page makes for a category and its parameters.
 */
export function toProductListQuery(params: CatalogParams, categorySlug: string): ProductListQuery {
  return {
    category: categorySlug,
    ...toSharedQuery(params),
    ...termPart(params),
  };
}

/**
 * The request the search page makes.
 *
 * It is the listing request without the category, because a search is of the
 * whole catalogue rather than of a shelf: a shopper who wants one shelf has the
 * category filter, which narrows a search the same way it narrows a listing.
 */
export function toSearchQuery(params: CatalogParams): ProductListQuery {
  return { ...toSharedQuery(params), ...termPart(params) };
}
