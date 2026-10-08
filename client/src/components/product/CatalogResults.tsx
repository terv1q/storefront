/**
 * The results half of a catalog page.
 *
 * A category listing and a search results page ask the same question of the
 * server — what matches these filters, in this order, on this page — and differ
 * only in what they put above the answer. So the answer is drawn once, here, and
 * both pages supply their own heading. What this component owns is everything
 * between the toolbar and the pager: the filter column and the drawer that
 * replaces it on a narrow window, the chips describing what is on, the grid with
 * its skeleton and its error and empty states, the pager, and the scroll that
 * brings the first product back into view when the listing changes.
 *
 * The panel is drawn twice from one component, because there is only one panel.
 *
 * Moving through the listing happens two ways, because the width of the window
 * decides which one a shopper can use. A wide one gets the numbered pager, with a
 * field for jumping to a page the numbers do not show; a narrow one gets a single
 * button that adds the next page below the one on screen, since a row of page
 * links is a row of targets too small to hit. Both write to the URL, so either way
 * the view can be shared and come back.
 *
 * A page number past the end is corrected rather than shown. That happens when a
 * bookmark outlives the result set it pointed at — a category shrinks, a filter
 * narrows it, or a search that once matched stops matching — and the honest answer
 * is the last page of what exists now, not an empty grid with a page number
 * nothing can reach.
 */

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { ActiveFilters } from '@/components/product/ActiveFilters';
import { FiltersDrawer } from '@/components/product/FiltersDrawer';
import { ProductFilters } from '@/components/product/ProductFilters';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { ProductToolbar } from '@/components/product/ProductToolbar';
import type { CatalogParams } from '@/features/products/catalogParams';
import { CATALOG_PAGE_SIZE, MAX_CATALOG_PAGES } from '@/features/products/catalogParams';
import {
  catalogFilterChips,
  countActiveFilters,
  toActiveFilters,
} from '@/features/products/catalogFilters';
import type { ProductFacets } from '@/features/products/products.types';
import type { CatalogNav } from '@/features/products/useCatalogNav';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { ProductListResource, Resource } from '@/hooks/useProducts';
import { cn } from '@/lib/cn';

/**
 * How many placeholders a first load draws. The grid draws a page's worth, so
 * the arrival of the products does not move anything. A list row is several
 * times taller than a grid tile, so twenty-four of them would be a page of
 * scrolling with nothing on it.
 */
const LIST_SKELETON_COUNT = 6;

/** Cards in the first row or two load eagerly: they are usually above the fold. */
const PRIORITY_COUNT = 4;

type Props = {
  nav: CatalogNav;
  listing: ProductListResource;
  facets: Resource<ProductFacets>;
  /**
   * The address of one page of this result set, without its query string. Used
   * for the pager's links, which have to be real links so they can be opened in
   * a new tab and read by a crawler that never runs the click handler.
   */
  basePath: string;
  /** What to show when the request succeeded and matched nothing. */
  empty: ReactNode;
  className?: string;
};

export function CatalogResults({ nav, listing, facets, basePath, empty, className }: Props) {
  const { params, apply, restart, clear, pageHref } = nav;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  /** The top of the results, which a page change brings back into view. */
  const resultsTop = useRef<HTMLDivElement | null>(null);

  /**
   * Counted in ordinary pages rather than in what was asked for. A stack of three
   * pages is one request for seventy-two products, and the server counts its pages
   * at that size — but the numbers under the grid are the pages a shopper can move
   * between, which are always the ones the catalog is divided into.
   */
  const totalPages = Math.max(1, Math.ceil(listing.total / CATALOG_PAGE_SIZE));
  const activeCount = countActiveFilters(params);
  const canLoadMore =
    params.pages < MAX_CATALOG_PAGES && params.pages * CATALOG_PAGE_SIZE < listing.total;

  const total = listing.total;

  /**
   * Send the visitor to the last page that exists when the URL asks for one that
   * does not. `replace` rather than a push, so the unreachable page is not left
   * in the history for the Back button to return to.
   */
  useEffect(() => {
    if (listing.isLoading || listing.isError || totalPages < 1 || params.page <= totalPages) {
      return;
    }

    apply({ page: totalPages }, true);
  }, [listing.isLoading, listing.isError, totalPages, params.page, apply]);

  /**
   * Everything a change to the listing is summarised by, so that returning to the
   * top of the results happens once per real change and not once per render. The
   * layout is left out: switching between a grid and a list redraws the same
   * products, and a shopper who is looking at the twentieth of them is still
   * looking at the twentieth of them.
   */
  const viewKey = [
    params.page,
    params.pages,
    params.sort,
    params.q,
    params.brand,
    params.minPrice,
    params.maxPrice,
    params.minRating,
    params.inStock,
    params.onSale,
    params.attrs.map((attribute) => `${attribute.name}:${attribute.value}`).join(','),
  ].join('|');

  const seenView = useRef<string | null>(null);

  /**
   * Bring the first product back into view when the listing changes.
   *
   * Without it a shopper who pages to the fourth page of a category lands near the
   * bottom of a page that no longer exists and has to find their way up. The first
   * render is skipped: on arrival the browser has a position of its own to restore,
   * and scrolling on top of that would throw it away. `smooth` is what keeps it
   * from being a jump, and is dropped when the visitor has asked for less motion.
   */
  useEffect(() => {
    if (seenView.current === null || seenView.current === viewKey) {
      seenView.current = viewKey;
      return;
    }

    seenView.current = viewKey;
    resultsTop.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, [viewKey, reduceMotion]);

  /**
   * A filter change also returns to the first page. Narrowing a listing changes
   * what its pages hold, so page four of the filtered set is not page four of
   * anything the shopper was looking at.
   */
  const applyFilters = (changes: Partial<CatalogParams>) => {
    restart(changes);
  };

  /** Shows the next page below the one on screen. */
  const loadMore = () => {
    apply({ pages: params.pages + 1 });
  };

  const busy = listing.isFetching && !listing.isLoading;
  const showGrid = listing.products !== undefined && listing.products.length > 0;

  const panelBindings = {
    params,
    facets: facets.data,
    isLoading: facets.isLoading,
    isError: facets.isError,
    errorMessage: facets.errorMessage,
    onRetry: facets.refetch,
    onChange: applyFilters,
    onClearAll: clear,
  };

  return (
    <div className={className}>
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* The column, where there is room for it. Sticky so the panel is still
            reachable at the bottom of a long page. */}
        <aside className="hidden lg:sticky lg:top-20 lg:block">
          <ProductFilters {...panelBindings} />
        </aside>

        <div className="min-w-0">
          <div className="flex flex-col gap-3">
            <ProductToolbar
              total={total}
              sort={params.sort}
              view={params.view}
              // Changing the order of a result set changes what its pages hold,
              // so the shopper is returned to the first one rather than left on
              // a page number that now means something else.
              onSortChange={(sort) => restart({ sort })}
              onViewChange={(view) => apply({ view })}
              onOpenFilters={() => setDrawerOpen(true)}
              activeFilterCount={activeCount}
            />

            {/* Removing a chip narrows or widens the listing exactly as setting the
                filter did, so it restarts it the same way: first page, nothing
                stacked. */}
            <ActiveFilters
              filters={toActiveFilters(catalogFilterChips(params, facets.data), applyFilters)}
              onClearAll={clear}
            />
          </div>

          {/* `scroll-mt` clears the sticky header, so returning here puts the
              first card below the header rather than behind it. */}
          <div className="mt-5 scroll-mt-20" ref={resultsTop}>
            {listing.isLoading ? (
              <ProductGridSkeleton
                count={params.view === 'list' ? LIST_SKELETON_COUNT : CATALOG_PAGE_SIZE}
                layout={params.view}
              />
            ) : listing.isError ? (
              <ErrorState body={listing.errorMessage ?? undefined} onRetry={listing.refetch} />
            ) : showGrid ? (
              <div
                aria-busy={busy}
                className={cn('transition-opacity duration-200', busy && 'opacity-60')}
              >
                <ProductGrid
                  products={listing.products ?? []}
                  priorityCount={PRIORITY_COUNT}
                  layout={params.view}
                />
              </div>
            ) : (
              // The empty state is the caller's, because what a shopper should do
              // next is the one thing the two pages do not share: a category
              // offers the shelves beside it, a search offers other words.
              empty
            )}
          </div>

          {showGrid && (totalPages > 1 || canLoadMore) ? (
            <Pagination
              page={Math.min(params.page, totalPages)}
              totalPages={totalPages}
              hrefFor={(page) => pageHref(basePath, page)}
              onJumpTo={(page) => apply({ page, pages: 1 })}
              onLoadMore={canLoadMore ? loadMore : undefined}
              loadingMore={listing.isFetching}
              className="mt-8"
            />
          ) : null}
        </div>
      </div>

      <FiltersDrawer open={drawerOpen} onOpenChange={setDrawerOpen} resultCount={total}>
        <ProductFilters framed={false} {...panelBindings} />
      </FiltersDrawer>
    </div>
  );
}
