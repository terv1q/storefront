/**
 * The pager under a list of results.
 *
 * Links, not buttons, because a page of a listing has an address: the second
 * page of a category is something a shopper can bookmark, send to someone, or
 * open in a new tab, and a control that only responds to a click takes all three
 * away. The caller supplies the address, so this component does not need to know
 * whether it is paging a category or a search.
 *
 * The first page, the last page, and a window around the current one are always
 * drawn; the gaps between them are an ellipsis. A pager that lists forty numbers
 * is a pager nobody reads, and a pager that hides the last page makes the end of
 * the result set invisible.
 *
 * The current page is a `<span>` with `aria-current="page"` rather than a link,
 * because it is where the visitor already is; the whole control is a labelled
 * `<nav>` so it can be told apart from the header's navigation, and each link
 * carries its own number in its accessible name.
 *
 * Two controls sit outside that window, for the two ways the numbers are not
 * enough:
 *
 *   - The jump field reaches a page the window does not show. Walking thirty pages
 *     a click at a time is not something anybody does, and a pager that only
 *     offers the neighbouring numbers assumes they will.
 *   - "Load more" replaces the numbers on a narrow screen, where a row of page
 *     links under a grid is a row of thumb-sized targets. It shows the next page
 *     below the one on screen instead of navigating to it, so the shopper does not
 *     lose the products they were looking at. It is only drawn when the caller can
 *     grow the listing, and it lives beside the numbers rather than instead of
 *     them: the same page at a wider window gets the numbers back.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  page: number;
  totalPages: number;
  /** The address of a page, for a link the visitor can open or share. */
  hrefFor: (page: number) => string;
  /**
   * Called with a page number the visitor typed. Without it there is no jump
   * field, which is what a caller with no way to navigate keeps.
   */
  onJumpTo?: (page: number) => void;
  /**
   * Grows the listing by one page. Supplying it is what puts the "load more"
   * button under the numbers, for the screens that hide them.
   */
  onLoadMore?: () => void;
  /** True while the page being asked for is in flight. */
  loadingMore?: boolean;
  className?: string;
};

/**
 * The pages to draw, with `null` where a gap should be an ellipsis.
 *
 * The window is one either side of the current page — enough to step back and
 * forth without counting, small enough to read at a glance.
 */
export function pageItems(page: number, totalPages: number): (number | null)[] {
  const shown = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...shown]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | null)[] = [];
  let previous = 0;

  for (const value of pages) {
    if (previous !== 0 && value - previous > 1) {
      items.push(null);
    }

    items.push(value);
    previous = value;
  }

  return items;
}

const stepClass =
  'inline-flex h-9 min-w-9 items-center justify-center gap-1 rounded-control border border-border px-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/** The jump field. A number a shopper types, bounded by the pages that exist. */
function JumpToPage({
  totalPages,
  onJumpTo,
}: {
  totalPages: number;
  onJumpTo: (page: number) => void;
}) {
  const fieldId = useId();
  const [value, setValue] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const page = Number.parseInt(value, 10);

    // Out-of-range numbers are ignored rather than clamped: the shopper said a
    // page, and landing on a different one without being told is worse than the
    // field staying as they left it.
    if (Number.isFinite(page) && page >= 1 && page <= totalPages) {
      setValue('');
      onJumpTo(page);
    }
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-1">
      <label htmlFor={fieldId} className="sr-only">
        {strings.pagination.jumpToLabel}
      </label>
      <input
        id={fieldId}
        type="number"
        inputMode="numeric"
        min={1}
        max={totalPages}
        value={value}
        placeholder={strings.pagination.jumpToLabel}
        onChange={(event) => setValue(event.target.value)}
        className={cn(
          'h-9 w-24 rounded-control border border-border bg-surface px-2 text-sm text-ink-900 placeholder:text-ink-400',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
        )}
      />
      <button type="submit" className={cn(stepClass, 'bg-surface')}>
        {strings.pagination.jumpToAction}
      </button>
    </form>
  );
}

export function Pagination({
  page,
  totalPages,
  hrefFor,
  onJumpTo,
  onLoadMore,
  loadingMore = false,
  className,
}: Props) {
  // A listing short enough for one page has no numbers to draw, but it may still
  // have a live "load more" — the two are counted separately for that reason.
  if (totalPages <= 1 && onLoadMore === undefined) {
    return null;
  }

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {totalPages > 1 ? (
        <nav
          aria-label={strings.pagination.label}
          // Hidden where the numbers are replaced by the button below, and hidden
          // from everybody once the button has grown the listing: a set of page
          // links over a stack of pages is a second, contradictory way to move.
          className={cn('justify-center', onLoadMore === undefined ? 'flex' : 'hidden sm:flex')}
        >
          <ul className="flex flex-wrap items-center gap-1 p-0">
            <li>
              {page > 1 ? (
                <Link to={hrefFor(page - 1)} rel="prev" className={stepClass}>
                  <ChevronLeft aria-hidden="true" size={16} />
                  {strings.pagination.previous}
                </Link>
              ) : (
                <span
                  className={cn(stepClass, 'border-transparent text-ink-300 hover:bg-transparent')}
                >
                  <ChevronLeft aria-hidden="true" size={16} />
                  {strings.pagination.previous}
                </span>
              )}
            </li>

            {pageItems(page, totalPages).map((item, index) =>
              item === null ? (
                <li key={`gap-${index}`} className="px-1 text-ink-400" aria-hidden="true">
                  …
                </li>
              ) : item === page ? (
                <li key={item}>
                  <span
                    aria-current="page"
                    aria-label={strings.pagination.current(item)}
                    className="inline-flex h-9 min-w-9 items-center justify-center rounded-control bg-brand-700 px-2 text-sm font-semibold text-brand-50"
                  >
                    {item}
                  </span>
                </li>
              ) : (
                <li key={item}>
                  <Link
                    to={hrefFor(item)}
                    aria-label={strings.pagination.goTo(item)}
                    className={stepClass}
                  >
                    {item}
                  </Link>
                </li>
              ),
            )}

            <li>
              {page < totalPages ? (
                <Link to={hrefFor(page + 1)} rel="next" className={stepClass}>
                  {strings.pagination.next}
                  <ChevronRight aria-hidden="true" size={16} />
                </Link>
              ) : (
                <span
                  className={cn(stepClass, 'border-transparent text-ink-300 hover:bg-transparent')}
                >
                  {strings.pagination.next}
                  <ChevronRight aria-hidden="true" size={16} />
                </span>
              )}
            </li>

            {onJumpTo !== undefined ? (
              <li className="ml-2">
                <JumpToPage totalPages={totalPages} onJumpTo={onJumpTo} />
              </li>
            ) : null}
          </ul>
        </nav>
      ) : null}

      {onLoadMore !== undefined ? (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loadingMore}
          className={cn(
            'inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-control border border-ink-900 px-4 py-2.5 text-sm font-medium text-ink-900',
            'transition-colors hover:bg-ink-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-60 sm:hidden',
          )}
        >
          {loadingMore ? <LoadingSpinner size={16} /> : null}
          {loadingMore ? strings.pagination.loadingMore : strings.pagination.loadMore}
        </button>
      ) : null}
    </div>
  );
}
