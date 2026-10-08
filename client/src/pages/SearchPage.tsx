/**
 * Search results.
 *
 * The field is the shared `SearchBar`, so a search started in the header and a
 * search started here behave the same way, including the recent terms and the
 * suggestion panel. It is keyed by the term in the URL: arriving at a new `?q=`
 * — from the header, from a suggestion, or from the browser's Back — remounts
 * the field with that term already in it rather than leaving the previous one on
 * screen.
 *
 * Everything under the heading is the shared results section, which the category
 * listing draws too. A search is a listing over the whole catalogue rather than
 * over one shelf, so it takes the same filters, the same sort orders, the same
 * pager, and the same grid; what this page adds is the heading that names the
 * words that produced the results, and the answer to a search that found
 * nothing.
 *
 * A term shorter than the minimum is never sent, and a search that matched
 * nothing is told apart from one that was never asked — which is why this page
 * looks at the term rather than at the result count alone. Nothing is a normal
 * answer to a search, and the page offers the three ways back into the catalogue
 * rather than an empty grid.
 *
 * The "did you mean" block appears only when the results are empty and the
 * catalogue recognises the words as a near miss of something it holds: a brand
 * or a category whose name is close to the term. A brand has no page of its own,
 * so following one narrows the current search to it; a category has a page, so
 * following one leaves the search behind and browses the shelf.
 */

import { Link } from 'react-router-dom';
import type { FormEvent } from 'react';

import { CatalogResults } from '@/components/product/CatalogResults';
import { SearchBar } from '@/components/search/SearchBar';
import { SearchDiscover } from '@/components/search/SearchDiscover';
import { toSearchQuery } from '@/features/products/catalogParams';
import { useCatalogNav } from '@/features/products/useCatalogNav';
import { useSearchSuggestions } from '@/features/search/search.queries';
import type { Suggestion } from '@/features/search/search.types';
import { useSearchFacets, useSearchResults } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';

const quietLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/**
 * The names close enough to the term to be worth offering.
 *
 * Products are left out: a shopper who typed a word that matched nothing does
 * not want the product that matched it partially — the grid above would be
 * showing it. A brand or a category is the broader answer, which is what a
 * correction is for.
 */
function nearMisses(suggestions: readonly Suggestion[]): Suggestion[] {
  return suggestions.filter((suggestion) => suggestion.type !== 'product').slice(0, 4);
}

export function SearchPage() {
  const nav = useCatalogNav();
  const { params, restart } = nav;
  const term = params.q;

  const query = toSearchQuery(params);
  const listing = useSearchResults(query);
  const facets = useSearchFacets(query);

  // Asked only when it can be shown. The query is already disabled below the
  // minimum term length, so this costs nothing before then.
  const suggestions = useSearchSuggestions(term);
  const misses = listing.isEmpty ? nearMisses(suggestions.data?.items ?? []) : [];

  useSeo({
    title: term === '' ? strings.pages.search.title : strings.pages.search.heading(term),
    // A result set for one shopper's words is not a page: it has no canonical
    // address of its own, and two shoppers typing the same word would arrive at
    // the same one from anywhere.
    noIndex: true,
  });

  const search = (next: string) => {
    restart({ q: next });
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    search(String(new FormData(event.currentTarget).get('q') ?? '').trim());
  };

  /**
   * What the page shows instead of a grid. It is drawn inside the results
   * section, so the filters stay where they are: a shopper who narrowed a search
   * into nothing can undo that from the panel rather than by clearing the term.
   */
  const empty = (
    <div className="space-y-10">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">
          {strings.pages.search.emptyTitle(term)}
        </h2>
        <p className="mt-2 text-sm text-ink-600">{strings.pages.search.emptyBody}</p>

        {/* The correction is offered before the ways back into the catalogue,
            because it is the cheapest of them: the shopper meant something the
            shop holds, and this is it. */}
        {misses.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
              {strings.pages.search.didYouMean}
            </h3>

            <ul className="mt-3 flex flex-wrap justify-center gap-2 p-0">
              {misses.map((miss) =>
                miss.type === 'brand' ? (
                  <li key={`brand-${miss.slug}`}>
                    {/* A brand has no page in the catalogue yet, so following it
                        scopes the search the shopper is already running. */}
                    <button
                      type="button"
                      onClick={() => restart({ brand: miss.slug })}
                      className={quietLinkClass}
                    >
                      {strings.pages.search.didYouMeanBrand(miss.label)}
                    </button>
                  </li>
                ) : (
                  <li key={`category-${miss.slug}`}>
                    <Link to={paths.category(miss.slug)} className={quietLinkClass}>
                      {strings.pages.search.didYouMeanCategory(miss.label)}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ) : null}

        <form
          onSubmit={submitSearch}
          className="mx-auto mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="search-again" className="sr-only">
            {strings.catalog.emptySearchLabel}
          </label>
          <input
            id="search-again"
            type="search"
            name="q"
            defaultValue={term}
            placeholder={strings.catalog.emptySearchLabel}
            className="min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {strings.actions.search}
          </button>
        </form>
      </div>

      <SearchDiscover onSearch={search} />
    </div>
  );

  return (
    <div className="mx-auto max-w-page px-page-x py-6 sm:py-8">
      <SearchBar key={term} initialTerm={term} className="max-w-xl" />

      {term === '' ? (
        // No question has been asked, so there is no result set to narrow and no
        // filters to offer: the page is the ways into the catalogue.
        <section aria-labelledby="search-browse-heading" className="mt-8">
          <h1 id="search-browse-heading" className="text-display-sm font-semibold text-ink-900">
            {strings.pages.search.browseTitle}
          </h1>
          <p className="mt-2 text-sm text-ink-600">{strings.pages.search.browseBody}</p>

          <SearchDiscover onSearch={search} className="mt-8" />
        </section>
      ) : (
        <section aria-labelledby="search-heading" className="mt-8">
          <h1 id="search-heading" className="text-display-sm font-semibold text-ink-900">
            {strings.pages.search.heading(term)}
          </h1>

          {/* The count is the server's, and it is the same number the toolbar
              prints. It is repeated here because the heading is what a shopper
              reads first, and "no results" is the one thing about a result set
              worth knowing before the grid arrives. */}
          {listing.isLoading ? (
            <p aria-live="polite" className="mt-2 text-sm text-ink-600">
              {strings.search.searching}
            </p>
          ) : (
            <p aria-live="polite" className="mt-2 text-sm text-ink-600">
              {strings.catalog.resultsCount(listing.total)}
            </p>
          )}

          <CatalogResults
            nav={nav}
            listing={listing}
            facets={facets}
            basePath={paths.search}
            empty={empty}
            className="mt-6"
          />
        </section>
      )}
    </div>
  );
}
