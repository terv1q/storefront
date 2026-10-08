/**
 * The bar above a catalog listing.
 *
 * It answers the three questions a shopper has arrived on a listing with: how
 * many products are here, in what order they are shown, and whether they want
 * them as a grid of pictures or a list of rows. Nothing on it filters, so nothing
 * on it can hide a product the shopper cannot see.
 *
 * The counter is the total the server reports, not the number of cards on
 * screen: on the second page of forty products the useful number is still forty,
 * and a count that said twenty-four would read as a filter the shopper never set.
 *
 * The layout control is a two-button radio group — `aria-pressed` on the current
 * one, a shared label for the pair — rather than a `<select>`, because there are
 * two options and a picture communicates them faster than a word.
 *
 * On a window too narrow for the filter column, the toolbar is also where the
 * drawer is opened from. That button and its badge are drawn only when the page
 * supplies the handler, so the pages that have no filter panel — search, in a
 * later stage — reuse this bar without a button that opens nothing.
 */

import { LayoutGrid, Rows3, SlidersHorizontal } from 'lucide-react';

import type { CatalogView } from '@/features/products/catalogParams';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { ProductSort } from '@/types/product';

import { SortSelect } from './SortSelect';

type Props = {
  total: number;
  sort: ProductSort;
  view: CatalogView;
  onSortChange: (sort: ProductSort) => void;
  onViewChange: (view: CatalogView) => void;
  /** Opens the filter drawer. Omit on a page that has no filters. */
  onOpenFilters?: () => void;
  /** How many filters are on, shown beside the button. */
  activeFilterCount?: number;
  className?: string;
};

const viewButtonClass =
  'grid h-11 w-11 place-content-center rounded-control text-ink-600 sm:h-9 sm:w-9 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/**
 * The two layouts, with their labels read here rather than in a constant at the
 * top of the file: `strings` is reassigned in place when the visitor switches
 * language, so a module-level array would keep the labels of the language the
 * page loaded in.
 */
function viewOptions(): readonly { view: CatalogView; Icon: typeof LayoutGrid; label: string }[] {
  return [
    { view: 'grid', Icon: LayoutGrid, label: strings.catalog.viewGrid },
    { view: 'list', Icon: Rows3, label: strings.catalog.viewList },
  ];
}

export function ProductToolbar({
  total,
  sort,
  view,
  onSortChange,
  onViewChange,
  onOpenFilters,
  activeFilterCount = 0,
  className,
}: Props) {
  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <p aria-live="polite" className="text-sm text-ink-600">
        {strings.catalog.resultsCount(total)}
      </p>

      <div className="flex items-center gap-2">
        {onOpenFilters !== undefined ? (
          <button
            type="button"
            onClick={onOpenFilters}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border bg-surface px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:hidden"
          >
            <SlidersHorizontal aria-hidden="true" size={16} />
            {strings.filters.open}
            {activeFilterCount > 0 ? (
              <>
                {/* The badge is a number on its own, which reads as noise. It is
                    spelled out for a screen reader, which cannot see the button
                    sitting beside the chips it counts. */}
                <span className="sr-only">, {strings.filters.activeCount(activeFilterCount)}</span>
                <span
                  aria-hidden="true"
                  className="grid h-5 min-w-5 place-content-center rounded-full bg-brand-700 px-1 text-xs text-brand-50"
                >
                  {activeFilterCount}
                </span>
              </>
            ) : null}
          </button>
        ) : null}

        <SortSelect value={sort} onChange={onSortChange} />

        <div
          role="group"
          aria-label={strings.catalog.viewLabel}
          className="flex items-center gap-0.5 rounded-control border border-border bg-surface p-0.5"
        >
          {viewOptions().map(({ view: option, Icon, label }) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              aria-label={label}
              onClick={() => onViewChange(option)}
              className={cn(
                viewButtonClass,
                view === option && 'bg-brand-700 text-brand-50 hover:bg-brand-700',
              )}
            >
              <Icon aria-hidden="true" size={16} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
