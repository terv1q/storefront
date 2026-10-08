/**
 * The catalog's URL vocabulary, exercised through the two functions that read
 * and write it.
 *
 * These are worth a test because every failure mode here is silent. A missed
 * conversion makes a price filter off by a hundred and the listing simply shows
 * the wrong products; a default written instead of omitted makes long addresses
 * that still work; a mangled parameter that throws instead of degrading takes the
 * whole page down for a link somebody edited by hand. None of those announce
 * themselves on screen, and all of them are cheap to catch here.
 */

import { describe, expect, it } from 'vitest';

import {
  CATALOG_PAGE_SIZE,
  DEFAULT_CATALOG_PARAMS,
  MAX_CATALOG_PAGES,
  readCatalogParams,
  toProductListQuery,
  toSearchQuery,
  writeCatalogParams,
} from './catalogParams';
import type { CatalogParams } from './catalogParams';
import { MINOR_UNITS_PER_UNIT } from '@/utils/formatPrice';

/** A query string as the router hands it over. */
function search(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

/** A fully populated set of parameters, for the round-trip cases. */
const FULL: CatalogParams = {
  sort: 'price_desc',
  page: 3,
  pages: 1,
  view: 'list',
  q: 'lamp',
  brand: 'artel',
  minPrice: 250_000,
  maxPrice: 1_500_000,
  minRating: 4,
  inStock: true,
  onSale: true,
  attrs: [
    { name: 'Size', value: 'M' },
    { name: 'Color', value: 'Navy' },
  ],
};

describe('readCatalogParams', () => {
  it('answers with the defaults for an empty query string', () => {
    expect(readCatalogParams(search(''))).toEqual(DEFAULT_CATALOG_PARAMS);
  });

  it('reads every parameter back', () => {
    const params = readCatalogParams(
      search(
        'sort=price_desc&page=3&view=list&q=lamp&brand=artel&minPrice=250000&maxPrice=1500000&minRating=4&inStock=true&onSale=true&attr=Size%3AM&attr=Color%3ANavy',
      ),
    );

    expect(params).toEqual(FULL);
  });

  it('keeps a well-formed attribute that the catalog does not stock', () => {
    // Dropping it would quietly widen the listing to everything, which is the
    // one answer a filter must never give.
    expect(readCatalogParams(search('attr=Material%3AWood')).attrs).toEqual([
      { name: 'Material', value: 'Wood' },
    ]);
  });

  it('drops an attribute with no separator or an empty half', () => {
    expect(readCatalogParams(search('attr=Size&attr=%3AM&attr=Size%3A')).attrs).toEqual([]);
  });

  it('falls back on a mangled query string rather than failing', () => {
    const params = readCatalogParams(
      search(
        'sort=cheapest&page=abc&view=masonry&page=-4&minPrice=&minRating=9&inStock=yes&onSale=1',
      ),
    );

    expect(params.sort).toBe(DEFAULT_CATALOG_PARAMS.sort);
    expect(params.page).toBe(DEFAULT_CATALOG_PARAMS.page);
    expect(params.view).toBe(DEFAULT_CATALOG_PARAMS.view);
    expect(params.minPrice).toBeNull();
    expect(params.minRating).toBeNull();
    expect(params.inStock).toBe(false);
    expect(params.onSale).toBe(false);
  });

  it('reads a stack of pages', () => {
    expect(readCatalogParams(search('pages=3')).pages).toBe(3);
  });

  it('holds a stack at the first page, whatever page it is given with it', () => {
    // A stack is one long first page, so a page number beside it is not the page
    // the shopper is on. Reading it as anything else would put the address and the
    // grid out of step.
    expect(readCatalogParams(search('pages=2&page=4')).page).toBe(1);
  });

  it('clamps a stack to what the server will answer in one request', () => {
    // The ceiling is real: past it the listing endpoint rejects the request, so a
    // hand-typed number has to be read as the deepest stack there is rather than
    // handed on.
    expect(readCatalogParams(search('pages=99')).pages).toBe(MAX_CATALOG_PAGES);
    expect(readCatalogParams(search('pages=2.5')).pages).toBe(2);
    expect(readCatalogParams(search('pages=0')).pages).toBe(DEFAULT_CATALOG_PARAMS.pages);
    expect(readCatalogParams(search('pages=abc')).pages).toBe(DEFAULT_CATALOG_PARAMS.pages);
  });
});

describe('writeCatalogParams', () => {
  it('writes nothing back when nothing is set', () => {
    expect(writeCatalogParams(search(''), DEFAULT_CATALOG_PARAMS).toString()).toBe('');
  });

  it('round-trips every parameter', () => {
    const written = writeCatalogParams(search(''), FULL);

    expect(readCatalogParams(written)).toEqual(FULL);
  });

  it('removes a parameter that is being set back to its default', () => {
    const written = writeCatalogParams(search('?brand=artel&page=2'), { brand: '', page: 1 });

    expect(written.has('brand')).toBe(false);
    expect(written.has('page')).toBe(false);
  });

  it('writes one repeated parameter per attribute and clears the old ones', () => {
    const written = writeCatalogParams(search('attr=Size%3AS&attr=Color%3ABlack'), {
      attrs: [{ name: 'Size', value: 'M' }],
    });

    expect(written.getAll('attr')).toEqual(['Size:M']);
  });

  it('carries a parameter it does not own through a change', () => {
    const written = writeCatalogParams(search('utm_source=newsletter'), { sort: 'newest' });

    expect(written.get('utm_source')).toBe('newsletter');
    expect(written.get('sort')).toBe('newest');
  });
});

describe('toProductListQuery', () => {
  it('asks for a whole page of the default listing', () => {
    const query = toProductListQuery(DEFAULT_CATALOG_PARAMS, 'mens-clothing');

    expect(query.category).toBe('mens-clothing');
    expect(query.limit).toBe(CATALOG_PAGE_SIZE);
    expect(query.page).toBe(1);
    expect(query.brand).toBeUndefined();
    expect(query.minPrice).toBeUndefined();
    expect(query.attr).toBeUndefined();
  });

  it('converts so’m from the URL into tiyin for the API', () => {
    const query = toProductListQuery({ ...DEFAULT_CATALOG_PARAMS, minPrice: 250_000 }, 'clothing');

    expect(query.minPrice).toBe(250_000 * MINOR_UNITS_PER_UNIT);
  });

  it('sends each attribute as a Name:Value pair', () => {
    const query = toProductListQuery(FULL, 'clothing');

    expect(query.attr).toEqual(['Size:M', 'Color:Navy']);
  });

  it('leaves out every filter that is not set', () => {
    const query = toProductListQuery(DEFAULT_CATALOG_PARAMS, 'clothing');

    expect(Object.keys(query).sort()).toEqual(['category', 'limit', 'page', 'sort']);
  });

  it('never sends a price of zero for an unset bound', () => {
    // Zero is a real price and a filter for it; `null` is the absence of one, and
    // confusing the two would empty the listing for every shopper who cleared it.
    const query = toProductListQuery({ ...DEFAULT_CATALOG_PARAMS, maxPrice: null }, 'clothing');

    expect(query.maxPrice).toBeUndefined();
  });

  it('asks for a stack of pages as one long first page', () => {
    const query = toProductListQuery({ ...DEFAULT_CATALOG_PARAMS, pages: 4 }, 'clothing');

    expect(query.page).toBe(1);
    expect(query.limit).toBe(CATALOG_PAGE_SIZE * 4);
  });

  it('keeps the stack inside what one request may ask for', () => {
    const query = toProductListQuery(
      { ...DEFAULT_CATALOG_PARAMS, pages: MAX_CATALOG_PAGES },
      'clothing',
    );

    expect(query.limit).toBe(CATALOG_PAGE_SIZE * MAX_CATALOG_PAGES);
  });
});

describe('toSearchQuery', () => {
  it('asks the whole catalogue, not one shelf of it', () => {
    const query = toSearchQuery({ ...DEFAULT_CATALOG_PARAMS, q: 'kettle' });

    expect(query.category).toBeUndefined();
    expect(query.q).toBe('kettle');
    expect(query.limit).toBe(CATALOG_PAGE_SIZE);
  });

  it('carries the same filters a listing carries', () => {
    // The two pages share one URL vocabulary, so a search narrowed by a brand and
    // a price has to reach the API exactly as the same listing does.
    const query = toSearchQuery(FULL);

    expect(query.brand).toBe('artel');
    expect(query.minPrice).toBe(250_000 * MINOR_UNITS_PER_UNIT);
    expect(query.maxPrice).toBe(1_500_000 * MINOR_UNITS_PER_UNIT);
    expect(query.minRating).toBe(4);
    expect(query.inStock).toBe(true);
    expect(query.onSale).toBe(true);
    expect(query.attr).toEqual(['Size:M', 'Color:Navy']);
    expect(query.sort).toBe('price_desc');
  });

  it('sends no term for an empty one', () => {
    // A blank `q` is not a search: sent as an empty string it would ask the server
    // to rank every product against nothing.
    const query = toSearchQuery(DEFAULT_CATALOG_PARAMS);

    expect(query.q).toBeUndefined();
    expect(Object.keys(query).sort()).toEqual(['limit', 'page', 'sort']);
  });

  it('asks for a stack of pages as one long first page', () => {
    const query = toSearchQuery({ ...DEFAULT_CATALOG_PARAMS, q: 'lamp', pages: 3 });

    expect(query.page).toBe(1);
    expect(query.limit).toBe(CATALOG_PAGE_SIZE * 3);
  });
});
