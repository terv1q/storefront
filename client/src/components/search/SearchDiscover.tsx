/**
 * What a search page offers when it has no result to show.
 *
 * A search that matched nothing is not a dead end and neither is a search page
 * opened with no term at all: both are the same question — what next — and the
 * answers are the same three. The terms this visitor searched before, because a
 * shopper who is here twice usually wants the same thing twice; the products the
 * shop is putting in front, because a front page is a reasonable guess at a
 * shopper's taste; and the shelves of the catalogue, because a browse is what
 * searching for the wrong word turns into.
 *
 * The block draws nothing at all when it has nothing to offer — a shop with no
 * recent terms, no featured products, and no categories would otherwise show
 * three empty headings — but it is never empty in practice, since the catalogue
 * always has shelves.
 */

import { Clock, Tag, X } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SectionHeading } from '@/components/home/SectionHeading';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { FEATURED_LIMIT } from '@/config/home';
import { useRecentSearches } from '@/features/search/recentSearches';
import { useCategoryTree, useFeaturedProducts } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** How many shelves the catalogue offers as a way back in. */
const CATEGORY_LIMIT = 8;

/** Cards in the first row of the trending grid load eagerly. */
const PRIORITY_COUNT = 4;

type Props = {
  /** Runs a term the visitor picked from their own history. */
  onSearch: (term: string) => void;
  className?: string;
};

export function SearchDiscover({ onSearch, className }: Props) {
  const recent = useRecentSearches((state) => state.terms);
  const forget = useRecentSearches((state) => state.forget);
  const clearRecent = useRecentSearches((state) => state.clear);

  const trending = useFeaturedProducts(FEATURED_LIMIT);
  const tree = useCategoryTree();

  const categories = (tree.categories ?? []).slice(0, CATEGORY_LIMIT);
  // A section that failed to load is left out rather than drawn as an error:
  // nothing below depends on it, and the rest of the block is still worth
  // reading. An genuinely empty row of trending products is the same.
  const showTrending =
    !trending.isError &&
    (trending.isLoading || (trending.products !== undefined && trending.products.length > 0));

  return (
    <div className={cn('space-y-10', className)}>
      {recent.length > 0 ? (
        <section aria-labelledby="search-recent-heading">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="search-recent-heading"
              className="text-sm font-semibold tracking-wide text-ink-500 uppercase"
            >
              {strings.pages.search.recentHeading}
            </h2>

            <button
              type="button"
              onClick={clearRecent}
              className="rounded-control px-2 py-1 text-xs text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
            >
              {strings.search.clearRecent}
            </button>
          </div>

          <ul className="mt-3 flex flex-wrap gap-2 p-0">
            {recent.map((term) => (
              <li key={term} className="group flex items-center">
                <button
                  type="button"
                  onClick={() => onSearch(term)}
                  className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <Clock aria-hidden="true" size={13} className="text-ink-400" />
                  {term}
                </button>

                <button
                  type="button"
                  onClick={() => forget(term)}
                  aria-label={strings.search.removeRecent(term)}
                  className="ml-1 rounded-control p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
                >
                  <X aria-hidden="true" size={13} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {showTrending ? (
        <section aria-labelledby="search-trending-heading">
          <SectionHeading
            id="search-trending-heading"
            title={strings.pages.search.trendingHeading}
            className="mb-6"
          />

          {trending.products === undefined ? (
            <>
              <span role="status" className="sr-only">
                {strings.loading.products}
              </span>
              <ProductGridSkeleton count={FEATURED_LIMIT} />
            </>
          ) : (
            <ProductGrid products={trending.products} priorityCount={PRIORITY_COUNT} />
          )}
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section aria-labelledby="search-categories-heading">
          <h2
            id="search-categories-heading"
            className="text-sm font-semibold tracking-wide text-ink-500 uppercase"
          >
            {strings.pages.search.categoriesHeading}
          </h2>

          <ul className="mt-3 flex flex-wrap gap-2 p-0">
            {categories.map((node) => (
              <li key={node.id}>
                <Link
                  to={paths.category(node.slug)}
                  className="inline-flex items-center gap-1.5 rounded-control border border-border px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <Tag aria-hidden="true" size={13} className="text-ink-400" />
                  {node.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Link
        to={paths.home}
        className="inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {strings.pages.search.backToCatalog}
      </Link>
    </div>
  );
}
