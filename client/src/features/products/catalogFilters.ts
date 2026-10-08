/**
 * What a listing is currently narrowed to.
 *
 * The panel can set eight things at once — a brand, two price bounds, a rating
 * floor, two toggles, and any number of variant attributes — and all of them live
 * in the URL rather than on the page. That is what makes a filtered listing
 * shareable, and it is also what makes it unreadable: a shopper looking at six
 * products out of a category of two hundred cannot see why from the address bar.
 * The chips built here are the answer, and the count built here is what the
 * filter button badges.
 *
 * Each chip is described rather than wired: a label to read and the parameter
 * change that removes it. The page turns that into an `ActiveFilter`, because the
 * page is what owns the URL. Keeping the descriptions here means the panel, the
 * chips, and the no-index rule all agree on what counts as a filter, which is the
 * one thing that would otherwise drift between three files.
 *
 * Labels are read at call time, never hoisted into a module constant: `strings`
 * is reassigned when the visitor switches language, and a constant built at
 * import time would keep the language the app loaded in.
 */

import type { ActiveFilter } from '@/components/product/ActiveFilters';
import { strings } from '@/i18n/strings';
import { MINOR_UNITS_PER_UNIT, formatPrice } from '@/utils/formatPrice';

import type { CatalogAttribute, CatalogParams } from './catalogParams';
import type { ProductFacets } from './products.types';

/** One narrowing, and the change to the URL that undoes it. */
export type CatalogFilterChip = {
  key: string;
  label: string;
  clear: Partial<CatalogParams>;
};

/** How many panel filters are on. The search term is not one of them. */
export function countActiveFilters(params: CatalogParams): number {
  return (
    (params.brand === '' ? 0 : 1) +
    (params.minPrice === null ? 0 : 1) +
    (params.maxPrice === null ? 0 : 1) +
    (params.minRating === null ? 0 : 1) +
    (params.inStock ? 1 : 0) +
    (params.onSale ? 1 : 0) +
    params.attrs.length
  );
}

/**
 * Whether anything at all narrows the listing.
 *
 * A filtered listing is a view of a page rather than a page: it has no address
 * of its own to be canonical, and there is nothing in it a search engine should
 * prefer over the category it came from. The search term is included, because a
 * result set for one shopper's words is not a page either.
 */
export function hasActiveFilters(params: CatalogParams): boolean {
  return params.q !== '' || countActiveFilters(params) > 0;
}

/** The facet label for one attribute value, or the stored key when unknown. */
function attributeLabel(
  value: string,
  attributeName: string,
  facets: ProductFacets | undefined,
): string {
  const attribute = facets?.attributes.find((entry) => entry.name === attributeName);
  const facet = attribute?.values.find((entry) => entry.value === value);

  return facet?.label ?? value;
}

/** The brand's own name, or the slug when the facets are not here yet. */
function brandLabel(slug: string, facets: ProductFacets | undefined): string {
  return facets?.brands.find((brand) => brand.slug === slug)?.name ?? slug;
}

/** A price bound in so'm, written the way the rest of the store writes money. */
function amount(som: number): string {
  return formatPrice(som * MINOR_UNITS_PER_UNIT);
}

/**
 * The price chip.
 *
 * One bound reads as "under" or "over" and two read as a range, because that is
 * what a shopper set: replacing "Under 500 000" with "0 – 500 000" would describe
 * the same set and read as though they had named a floor they did not.
 */
function priceChip(params: CatalogParams): CatalogFilterChip[] {
  if (params.minPrice === null && params.maxPrice === null) {
    return [];
  }

  const label =
    params.minPrice !== null && params.maxPrice !== null
      ? strings.filters.price.between(amount(params.minPrice), amount(params.maxPrice))
      : params.maxPrice !== null
        ? strings.filters.price.under(amount(params.maxPrice))
        : strings.filters.price.over(amount(params.minPrice as number));

  return [
    {
      key: 'price',
      label,
      clear: { minPrice: null, maxPrice: null, page: 1 },
    },
  ];
}

/** The rating chip. Always a floor, because the control only offers floors. */
function ratingChip(params: CatalogParams): CatalogFilterChip[] {
  if (params.minRating === null) {
    return [];
  }

  return [
    {
      key: 'minRating',
      label: strings.filters.rating.andUp(params.minRating),
      clear: { minRating: null, page: 1 },
    },
  ];
}

/** One chip per toggle, because they undepend on each other. */
function toggleChips(params: CatalogParams): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];

  if (params.inStock) {
    chips.push({
      key: 'inStock',
      label: strings.filters.availability.inStock,
      clear: { inStock: false, page: 1 },
    });
  }

  if (params.onSale) {
    chips.push({
      key: 'onSale',
      label: strings.filters.availability.onSale,
      clear: { onSale: false, page: 1 },
    });
  }

  return chips;
}

/**
 * Everything narrowing the listing, in reading order: the search term first,
 * then the panel's own filters in the order the panel shows them.
 */
export function catalogFilterChips(
  params: CatalogParams,
  facets: ProductFacets | undefined,
): CatalogFilterChip[] {
  const chips: CatalogFilterChip[] = [];

  if (params.q !== '') {
    chips.push({ key: 'q', label: strings.catalog.matching(params.q), clear: { q: '', page: 1 } });
  }

  if (params.brand !== '') {
    chips.push({
      key: 'brand',
      label: brandLabel(params.brand, facets),
      clear: { brand: '', page: 1 },
    });
  }

  chips.push(...priceChip(params), ...ratingChip(params), ...toggleChips(params));

  for (const attribute of params.attrs) {
    chips.push({
      key: `attr-${attribute.name}-${attribute.value}`,
      label: attributeLabel(attribute.value, attribute.name, facets),
      clear: {
        attrs: params.attrs.filter(
          (entry) => entry.name !== attribute.name || entry.value !== attribute.value,
        ),
        page: 1,
      },
    });
  }

  return chips;
}

/** The chips as the filter bar renders them, each wired to the page's writer. */
export function toActiveFilters(
  chips: readonly CatalogFilterChip[],
  apply: (changes: Partial<CatalogParams>) => void,
): ActiveFilter[] {
  return chips.map((chip) => ({
    key: chip.key,
    label: chip.label,
    onRemove: () => {
      apply(chip.clear);
    },
  }));
}

/** Whether one attribute value is currently selected. */
export function isAttributeSelected(
  attrs: readonly CatalogAttribute[],
  name: string,
  value: string,
): boolean {
  return attrs.some((attr) => attr.name === name && attr.value === value);
}
