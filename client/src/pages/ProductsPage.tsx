/**
 * A category listing.
 *
 * The URL is the only state this page has. The sort order, the page number, the
 * search term, and every filter all live in the query string and are read back
 * through `catalogParams`, which is also the only place that knows how they are
 * spelled. Nothing here keeps a copy of them in component state, because two
 * sources of truth for the same thing drift the first time one of them is written
 * alone. The payoff is that the third page of a category filtered to one brand
 * under 500 000 so'm is an address: it can be bookmarked, sent to someone,
 * reloaded, and walked back with the browser's Back button.
 *
 * The page asks three questions of the server and draws the answer to each as
 * soon as it arrives. The category answers what this shelf is — its name, its
 * description, its ancestors, and the shelves beside it — the listing answers what
 * is on it, and the facets answer what can be narrowed to. None waits for the
 * others, so the heading, the pills, and the filter column are on screen while
 * the products are still in flight.
 *
 * Everything below the heading is the shared results section, which the search
 * page draws too. What is left here is what makes this a shelf rather than a
 * result set: the breadcrumb trail, the category's own header, the nav to the
 * shelves beside it, and the empty state that offers those shelves as the next
 * step.
 */

import { FolderX, PackageOpen } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { FormEvent } from 'react';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { CatalogResults } from '@/components/product/CatalogResults';
import { SubcategoryNav } from '@/components/product/SubcategoryNav';
import { absoluteUrl } from '@/config/seo';
import { categoryRow } from '@/features/products/categoryTree';
import { hasActiveFilters } from '@/features/products/catalogFilters';
import { toProductListQuery } from '@/features/products/catalogParams';
import { useCatalogNav } from '@/features/products/useCatalogNav';
import {
  errorMessageOf,
  useCategory,
  useCategoryTree,
  useProductFacets,
  useProducts,
} from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { isApiError } from '@/types/api';
import type { Product } from '@/types/product';

/** How many alternative categories the empty state offers before it stops. */
const EMPTY_STATE_ALTERNATIVES = 6;

/**
 * The shelf, told to a search engine as a list.
 *
 * A category page is one page of a shelf, and what makes it worth indexing is
 * what is on it: this is the shape that says so. `position` starts where the
 * page starts rather than at one, so the third page of a category continues the
 * numbering of the first instead of claiming to be a list of its own.
 *
 * The entries are names and addresses, not products. Everything else a search
 * engine knows about a product — its price, its brand, its rating, whether it is
 * in stock — is published once, on the product's own page, from the one
 * description the API returns for it. A second copy here would be a second copy
 * to keep true, and the two would disagree the first time a price changed.
 *
 * The page that draws this is the unfiltered one. A listing narrowed to a brand
 * and a price is a view of a page rather than a page, which is why it is also
 * the one that is not indexed.
 */
function itemListSchema(
  name: string,
  products: Product[],
  startAt: number,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: startAt + index,
      url: absoluteUrl(paths.product(product.slug)),
      name: product.name,
    })),
  };
}

const inputClass =
  'min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const quietLinkClass =
  'inline-flex items-center justify-center gap-2 rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export function ProductsPage() {
  const { categorySlug = '' } = useParams<{ categorySlug: string }>();
  const nav = useCatalogNav();
  const { params, clear, restart } = nav;

  const query = toProductListQuery(params, categorySlug);

  const category = useCategory(categorySlug);
  const tree = useCategoryTree();
  const listing = useProducts(query);
  const facets = useProductFacets(query);

  useSeo({
    title: category.data?.name ?? strings.pages.category.title,
    description: category.data?.description ?? undefined,
    // A filtered listing is a view of a page, not a page: it has no canonical
    // address of its own and nothing to gain from being indexed. The search term
    // counts here too, because a result set for one shopper's words is no more a
    // page than a result set for one shopper's filters.
    noIndex: hasActiveFilters(params),
  });

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const term = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    restart({ q: term });
  };

  const row = tree.categories === undefined ? [] : categoryRow(tree.categories, categorySlug);
  const siblings = row.filter((node) => node.slug !== categorySlug);

  const trail = (category.data?.breadcrumbs ?? []).map((node, index, all) => ({
    label: node.name,
    // The last crumb is the page being viewed, which is not a link.
    ...(index === all.length - 1 ? {} : { to: paths.category(node.slug) }),
  }));

  // An unknown slug is not a failed request: the category does not exist, so
  // there is no shelf to show and no filters to explain. A request that failed
  // for any other reason is a different page — one that offers to ask again.
  const unknownCategory = isApiError(category.error) && category.error.status === 404;

  if (category.isError) {
    return (
      <div className="mx-auto max-w-page px-page-x py-10 sm:py-14">
        {unknownCategory ? (
          <EmptyState
            Icon={FolderX}
            title={strings.catalog.notFoundTitle}
            body={strings.catalog.notFoundBody}
          >
            <Link to={paths.home} className={buttonClass}>
              {strings.catalog.backHome}
            </Link>
          </EmptyState>
        ) : (
          <ErrorState
            body={errorMessageOf(category.error)}
            onRetry={() => void category.refetch()}
          />
        )}
      </div>
    );
  }

  /**
   * What the shelf offers a shopper who found nothing on it. A category is not a
   * dead end: the shelves beside it are where they are most likely to look next,
   * and they are already in the tree this page loaded.
   */
  const empty = (
    <>
      <EmptyState
        Icon={PackageOpen}
        title={strings.catalog.emptyTitle}
        body={strings.catalog.emptyBody}
      >
        <form onSubmit={submitSearch} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <label htmlFor="catalog-search" className="sr-only">
            {strings.catalog.emptySearchLabel}
          </label>
          <input
            id="catalog-search"
            type="search"
            name="q"
            defaultValue={params.q}
            placeholder={strings.catalog.emptySearchLabel}
            className={inputClass}
          />
          <button type="submit" className={buttonClass}>
            {strings.catalog.searchWithin}
          </button>
        </form>

        {/* Nothing here is as likely to be the shopper's next step as undoing
            what emptied the shelf. */}
        {hasActiveFilters(params) ? (
          <button type="button" onClick={clear} className={buttonClass}>
            {strings.filters.clearAll}
          </button>
        ) : null}

        <Link to={paths.search} className={quietLinkClass}>
          {strings.catalog.emptyBrowse}
        </Link>
      </EmptyState>

      {siblings.length > 0 ? (
        <nav aria-label={strings.catalog.subcategoriesHeading} className="mt-8">
          <ul className="flex flex-wrap gap-2 p-0">
            {siblings.slice(0, EMPTY_STATE_ALTERNATIVES).map((node) => (
              <li key={node.id}>
                <Link to={paths.category(node.slug)} className={quietLinkClass}>
                  {node.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </>
  );

  return (
    <div className="mx-auto max-w-page px-page-x py-6 sm:py-8">
      {trail.length > 0 ? <Breadcrumbs items={trail} className="mb-4" /> : null}

      {/* The shelf as a list, on the unfiltered page only: the filtered one is
          the page that is not indexed, and a list of what a shopper narrowed to
          is not what a search engine should be told this category holds. */}
      {!hasActiveFilters(params) && listing.data && listing.data.items.length > 0 ? (
        <script type="application/ld+json">
          {JSON.stringify(
            itemListSchema(
              category.data?.name ?? strings.pages.category.title,
              listing.data.items,
              (listing.data.page - 1) * listing.data.pageSize + 1,
            ),
          )}
        </script>
      ) : null}

      <section aria-labelledby="catalog-heading">
        <SubcategoryNav categories={row} currentSlug={categorySlug} className="mb-4" />

        <div className="flex items-center gap-4">
          {/* Decorative: the category's name is the heading beside it, so the
              picture is hidden from assistive technology rather than read out
              twice. The catalog holds one square illustration per category, so
              the header shows that rather than stretching it into a wide banner
              it was not drawn to be. */}
          {category.data?.imageUrl ? (
            <img
              src={category.data.imageUrl}
              alt=""
              width={96}
              height={96}
              className="hidden h-20 w-20 shrink-0 rounded-panel border border-border object-cover sm:block sm:h-24 sm:w-24"
            />
          ) : null}

          <div className="min-w-0">
            <h1 id="catalog-heading" className="text-display-sm font-semibold text-ink-900">
              {category.data?.name ?? strings.pages.category.title}
            </h1>

            {category.data?.description ? (
              <p className="mt-2 max-w-2xl text-sm text-ink-600">{category.data.description}</p>
            ) : null}
          </div>
        </div>

        <CatalogResults
          nav={nav}
          listing={listing}
          facets={facets}
          basePath={paths.category(categorySlug)}
          empty={empty}
          className="mt-6"
        />
      </section>
    </div>
  );
}
