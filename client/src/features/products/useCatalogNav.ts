/**
 * Reading and writing a catalog URL.
 *
 * Both pages that narrow a result set — a category listing and a search — are
 * driven entirely by the query string, and both change it in the same three
 * ways: a change that keeps the shopper where they are, a change that restarts
 * the listing at its first page, and a clearing that drops every filter. Writing
 * that three times would be writing it three ways, and the pages would disagree
 * about the one rule that matters: a filter change alters what every page holds,
 * so the page number a shopper was on no longer means what it did.
 *
 * The URL itself is not copied into state. `params` is read from
 * `useSearchParams` on every render, so the address bar, the chips, and the grid
 * are always describing the same listing.
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CLEARED_FILTERS, readCatalogParams, writeCatalogParams } from './catalogParams';
import type { CatalogParams } from './catalogParams';

export type CatalogNav = {
  /** What the URL currently says, in the catalog's own vocabulary. */
  params: CatalogParams;
  /** The raw parameters, for building links that carry the current filters. */
  searchParams: URLSearchParams;
  /** A change that leaves the page and the stack alone. */
  apply: (changes: Partial<CatalogParams>, replace?: boolean) => void;
  /** A change that returns to the first page with nothing stacked. */
  restart: (changes: Partial<CatalogParams>) => void;
  /** Drops every filter, keeping the sort order and the layout. */
  clear: () => void;
  /** The address of one page of `base`, with everything else left in place. */
  pageHref: (base: string, page: number) => string;
};

export function useCatalogNav(): CatalogNav {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => readCatalogParams(searchParams), [searchParams]);

  /**
   * Memoised on the parameters because a caller holds on to this: the results
   * section corrects an unreachable page number from an effect, and that effect
   * should re-run when the address changes, not whenever anything on the page
   * re-renders.
   */
  const apply = useCallback(
    (changes: Partial<CatalogParams>, replace = false) => {
      setSearchParams(writeCatalogParams(searchParams, changes), { replace });
    },
    [searchParams, setSearchParams],
  );

  const restart = (changes: Partial<CatalogParams>) => {
    apply({ ...changes, page: 1, pages: 1 });
  };

  const clear = () => {
    apply(CLEARED_FILTERS);
  };

  const pageHref = (base: string, page: number): string => {
    // Walking to a page is the same decision as typing one, so both write the
    // same thing: one page, nothing stacked.
    const next = writeCatalogParams(searchParams, { page, pages: 1 }).toString();

    return next === '' ? base : `${base}?${next}`;
  };

  return { params, searchParams, apply, restart, clear, pageHref };
}
