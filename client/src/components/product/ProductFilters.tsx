/**
 * The filter panel.
 *
 * One component serves two places: the column beside the grid on a wide window,
 * and the drawer that slides in below it. Nothing here knows which of the two it
 * is standing in — it is a list of sections and the changes they make — so the two
 * cannot offer different filters or disagree about what is on.
 *
 * Every section is collapsible. A category with three attribute names and a dozen
 * brands is a column taller than the products beside it, and a shopper who wants
 * only the price range should not scroll past the rest of it. All sections start
 * open, because a filter nobody can see is a filter nobody uses.
 *
 * The panel never holds the filter state. Each control reports what changed and
 * the page writes it to the URL, which is what keeps the chips, the grid, and the
 * address bar describing the same listing. The facets arrive separately and may
 * lag a change by a moment; the controls keep rendering the previous counts until
 * the new ones land, so the panel does not collapse while the shopper is using it.
 */

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

import { Skeleton } from '@/components/common/Skeleton';
import type { CatalogAttribute, CatalogParams } from '@/features/products/catalogParams';
import { countActiveFilters, isAttributeSelected } from '@/features/products/catalogFilters';
import type { ProductFacets } from '@/features/products/products.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { toMajorUnits } from '@/utils/formatPrice';

import { AttributeFilter } from './filters/AttributeFilter';
import { BrandFilter } from './filters/BrandFilter';
import { PriceRangeFilter } from './filters/PriceRangeFilter';
import { RatingFilter } from './filters/RatingFilter';

type Props = {
  params: CatalogParams;
  /** `undefined` until the first answer arrives. */
  facets: ProductFacets | undefined;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  /** Applies a filter change. The page adds the return to the first page. */
  onChange: (changes: Partial<CatalogParams>) => void;
  onClearAll: () => void;
  /**
   * Whether the panel draws its own frame and heading. The drawer says both
   * itself, and a second heading inside it would be a heading that repeats.
   */
  framed?: boolean;
  className?: string;
};

const SECTION_PRICE = 'price';
const SECTION_BRAND = 'brand';
const SECTION_RATING = 'rating';
const SECTION_AVAILABILITY = 'availability';

const plainButtonClass =
  'inline-flex items-center justify-center rounded-control border border-border px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const toggleRowClass =
  'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-100';

/** One collapsible section, with the same header in the panel and the drawer. */
function Section({
  value,
  title,
  children,
}: {
  value: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Accordion.Item value={value} className="border-b border-border last:border-b-0">
      <Accordion.Header>
        <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 py-3 text-left text-sm font-semibold text-ink-900">
          {title}
          <ChevronDown
            aria-hidden="true"
            size={16}
            className="text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Content className="overflow-hidden pb-4">{children}</Accordion.Content>
    </Accordion.Item>
  );
}

/** What the panel shows while the first facets are in flight. */
function PanelSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-5 py-3">
      {[3, 5, 4].map((rows, section) => (
        <div key={section} className="space-y-2">
          <Skeleton className="h-4 w-24 rounded-control" />
          {Array.from({ length: rows }, (_, row) => (
            <Skeleton key={row} className="h-6 rounded-control" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ProductFilters({
  params,
  facets,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  onChange,
  onClearAll,
  framed = true,
  className,
}: Props) {
  const active = countActiveFilters(params);
  const attributes = facets?.attributes ?? [];

  // The price control works in so'm, which is what the shopper types and what the
  // URL spells. The facets count in tiyin, and the conversion happens here, once,
  // rather than inside a control that would then have to know about both.
  const bounds =
    facets?.price === undefined || facets.price === null
      ? null
      : { min: toMajorUnits(facets.price.min), max: toMajorUnits(facets.price.max) };

  const sections = [
    SECTION_PRICE,
    SECTION_BRAND,
    SECTION_RATING,
    SECTION_AVAILABILITY,
    ...attributes.map((attribute) => attribute.name),
  ];

  const toggleAttribute = (name: string, value: string) => {
    const selected: CatalogAttribute[] = isAttributeSelected(params.attrs, name, value)
      ? params.attrs.filter((attr) => attr.name !== name || attr.value !== value)
      : [...params.attrs, { name, value }];

    onChange({ attrs: selected });
  };

  return (
    <div className={cn(framed && 'rounded-card border border-border bg-surface p-4', className)}>
      {framed || active > 0 ? (
        <div className="flex items-center justify-between gap-2">
          {framed ? (
            <h2 className="text-sm font-semibold text-ink-900">{strings.filters.heading}</h2>
          ) : (
            <span />
          )}

          {active > 0 ? (
            <button
              type="button"
              onClick={onClearAll}
              className="text-sm font-medium text-brand-700 underline-offset-2 hover:underline"
            >
              {strings.filters.clearAll}
            </button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? <PanelSkeleton /> : null}

      {!isLoading && isError ? (
        <div className="py-4">
          <p role="alert" className="text-sm text-ink-600">
            {errorMessage ?? strings.errors.generic}
          </p>
          <button type="button" onClick={onRetry} className={cn(plainButtonClass, 'mt-3')}>
            {strings.actions.retry}
          </button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <Accordion.Root type="multiple" defaultValue={sections} className="mt-1">
          <Section value={SECTION_PRICE} title={strings.filters.price.heading}>
            <PriceRangeFilter
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
              bounds={bounds}
              onChange={onChange}
            />
          </Section>

          {facets !== undefined && facets.brands.length > 0 ? (
            <Section value={SECTION_BRAND} title={strings.filters.brand.heading}>
              <BrandFilter
                brands={facets.brands}
                selected={params.brand}
                onChange={(brand) => onChange({ brand })}
              />
            </Section>
          ) : null}

          <Section value={SECTION_RATING} title={strings.filters.rating.heading}>
            <RatingFilter
              minRating={params.minRating}
              onChange={(minRating) => onChange({ minRating })}
            />
          </Section>

          <Section value={SECTION_AVAILABILITY} title={strings.filters.availability.heading}>
            <ul className="space-y-0.5">
              <li>
                <label className={toggleRowClass}>
                  <input
                    type="checkbox"
                    checked={params.inStock}
                    onChange={(event) => onChange({ inStock: event.target.checked })}
                    className="accent-brand-700"
                  />
                  <span className="flex-1">{strings.filters.availability.inStock}</span>
                </label>
              </li>
              <li>
                <label className={toggleRowClass}>
                  <input
                    type="checkbox"
                    checked={params.onSale}
                    onChange={(event) => onChange({ onSale: event.target.checked })}
                    className="accent-brand-700"
                  />
                  <span className="flex-1">{strings.filters.availability.onSale}</span>
                </label>
              </li>
            </ul>
          </Section>

          {attributes.map((attribute) => (
            <Section key={attribute.name} value={attribute.name} title={attribute.label}>
              <AttributeFilter
                attribute={attribute}
                selected={params.attrs}
                onToggle={(value) => toggleAttribute(attribute.name, value)}
              />
            </Section>
          ))}
        </Accordion.Root>
      ) : null}
    </div>
  );
}
