/**
 * The product in full, under the fold.
 *
 * Three tabs: the description, the specifications, and the reviews. Tabs rather
 * than three stacked sections because a shopper wants one of the three and the
 * other two are a page of scrolling between them and what they came for.
 *
 * The tabs are a `tablist` with real `tab` and `tabpanel` roles, arrow keys
 * moving between them, and `Home` and `End` going to the ends — the behaviour a
 * tab strip is expected to have and the reason this is not three buttons with a
 * `hidden` class. Every panel stays mounted and is hidden with the `hidden`
 * attribute, so the reviews are in the document before the tab is opened: the
 * rating summary in the panel above is a link to them, and a link that has to
 * open a tab before it can scroll to what it points at is a link that lands
 * nowhere.
 *
 * How the reviews are sliced — which page, which ordering, which rating — lives
 * in the address rather than in state here, so a page of reviews can be linked to
 * and the pagination controls can be real links. Everything else the review
 * section does is a request: the list, the viewer's own review, and the vote they
 * cast. Writing a review, or changing one, is the cache's business; the mutations
 * invalidate the product and its reviews, and this component only has to close
 * the form.
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { ReviewEmptyState } from './ReviewEmptyState';
import { ReviewFilters } from './ReviewFilters';
import { ReviewForm } from './ReviewForm';
import { ReviewGuestCallout } from './ReviewGuestCallout';
import { ReviewList } from './ReviewList';
import { ReviewSummary } from './ReviewSummary';
import { ProductSpecs } from './ProductSpecs';
import { useSession } from '@/features/auth/auth.queries';
import {
  useOwnReview,
  useProductReviews,
  useVoteReview,
} from '@/features/products/products.queries';
import { readReviewParams, writeReviewParams } from '@/features/products/reviewParams';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { ProductDetail } from '@/types/product';

type TabKey = 'description' | 'specs' | 'reviews';

const TAB_ORDER: TabKey[] = ['description', 'specs', 'reviews'];

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

type Props = {
  product: ProductDetail;
  /** The id of the reviews panel, which the rating summary above links to. */
  reviewsId: string;
  className?: string;
};

export function ProductTabs({ product, reviewsId, className }: Props) {
  const headingId = useId();
  const container = useRef<HTMLDivElement | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [active, setActive] = useState<TabKey>('description');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const reviewParams = readReviewParams(searchParams);

  const session = useSession();
  const isSignedIn = session.data != null;

  const reviews = useProductReviews(product.slug, {
    page: reviewParams.page,
    sort: reviewParams.sort,
    rating: reviewParams.rating ?? undefined,
  });

  // A guest has no review to own, and the endpoint would answer 401. Asking only
  // when somebody is signed in keeps a failed request out of a normal visit.
  const ownReview = useOwnReview(product.slug, isSignedIn);
  const vote = useVoteReview();

  const listing = reviews.data;
  const total = listing?.total ?? 0;
  const isNarrowed = reviewParams.rating !== null || reviewParams.sort !== 'newest';

  /**
   * Opening the page at the reviews anchor — the rating summary links there —
   * selects the tab the anchor points into and brings the panel into view. The
   * panel is in the document either way, but a shopper who followed the link
   * meant to read the reviews, not to arrive above a hidden list of them. A link
   * that carries a slice of the reviews means the same thing.
   */
  useEffect(() => {
    const onHash = location.hash === `#${reviewsId}`;
    const onParams = reviewParams.page > 1 || isNarrowed;

    if (!onHash && !onParams) {
      return;
    }

    setActive('reviews');

    if (onHash) {
      container.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [location.hash, reviewsId, reviewParams.page, isNarrowed]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = TAB_ORDER.indexOf(active);
    let next: TabKey | undefined;

    if (event.key === 'ArrowRight') {
      next = TAB_ORDER[(current + 1) % TAB_ORDER.length];
    } else if (event.key === 'ArrowLeft') {
      next = TAB_ORDER[(current - 1 + TAB_ORDER.length) % TAB_ORDER.length];
    } else if (event.key === 'Home') {
      next = TAB_ORDER[0];
    } else if (event.key === 'End') {
      next = TAB_ORDER[TAB_ORDER.length - 1];
    }

    if (next === undefined) {
      return;
    }

    event.preventDefault();
    setActive(next);
  };

  const label = (key: TabKey): string =>
    key === 'reviews'
      ? strings.productPage.tabs.reviewsCount(total)
      : key === 'specs'
        ? strings.productPage.tabs.specs
        : strings.productPage.tabs.description;

  /** Applies a change to the review slice of the address. */
  const slice = (changes: Parameters<typeof writeReviewParams>[1]) => {
    setSearchParams(writeReviewParams(searchParams, changes));
  };

  const own = ownReview.data ?? undefined;

  return (
    <section ref={container} aria-labelledby={headingId} className={cn('scroll-mt-24', className)}>
      <h2 id={headingId} className="sr-only">
        {strings.productPage.tabs.label}
      </h2>

      <div
        role="tablist"
        aria-label={strings.productPage.tabs.label}
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {TAB_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`${headingId}-${key}`}
            aria-selected={active === key}
            aria-controls={`${headingId}-${key}-panel`}
            // Only the selected tab is reachable by Tab; the arrow keys move
            // between them, which is what a tablist is for.
            tabIndex={active === key ? 0 : -1}
            onClick={() => setActive(key)}
            className={cn(
              '-mb-px rounded-t-control border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              active === key
                ? 'border-brand-600 text-ink-900'
                : 'border-transparent text-ink-600 hover:border-ink-300 hover:text-ink-900',
            )}
          >
            {label(key)}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`${headingId}-description-panel`}
        aria-labelledby={`${headingId}-description`}
        hidden={active !== 'description'}
        tabIndex={0}
        className="py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {product.description ? (
          // The catalog stores the description as plain text with blank lines
          // between paragraphs, which is what the seed writes. Splitting on them
          // keeps the paragraphs the author wrote.
          product.description.split(/\n{2,}/).map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="mb-4 text-sm leading-relaxed text-ink-700 last:mb-0"
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm text-ink-500">{strings.productPage.tabs.descriptionEmpty}</p>
        )}
      </div>

      <div
        role="tabpanel"
        id={`${headingId}-specs-panel`}
        aria-labelledby={`${headingId}-specs`}
        hidden={active !== 'specs'}
        tabIndex={0}
        className="py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <ProductSpecs specs={product.specs} />
      </div>

      <div
        role="tabpanel"
        id={reviewsId}
        aria-labelledby={`${headingId}-reviews`}
        hidden={active !== 'reviews'}
        tabIndex={0}
        className="flex flex-col gap-6 py-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {reviews.isLoading ? (
          <p className="py-8 text-center text-sm text-ink-500">
            {strings.productPage.tabs.reviewsLoading}
          </p>
        ) : reviews.isError ? (
          <p role="alert" className="py-8 text-center text-sm text-danger-600">
            {`${strings.productPage.tabs.reviewsFailed} ${errorMessageOf(reviews.error)}`}
          </p>
        ) : total === 0 ? (
          <>
            <ReviewEmptyState onWriteReview={isSignedIn ? () => setIsFormOpen(true) : undefined} />

            {isSignedIn ? null : <ReviewGuestCallout />}
          </>
        ) : (
          <>
            {listing === undefined ? null : <ReviewSummary summary={listing.summary} />}

            <div className="flex flex-wrap items-center justify-between gap-4">
              <ReviewFilters
                sort={reviewParams.sort}
                rating={reviewParams.rating}
                onSortChange={(sort) => slice({ sort })}
                onRatingChange={(rating) => slice({ rating })}
              />

              {isSignedIn ? (
                <button
                  type="button"
                  onClick={() => setIsFormOpen(true)}
                  className={primaryButtonClass}
                >
                  {own === undefined
                    ? strings.productPage.reviews.writeReview
                    : strings.productPage.reviews.editReview}
                </button>
              ) : null}
            </div>

            {listing !== undefined && listing.items.length > 0 ? (
              <ReviewList
                reviews={listing.items}
                page={listing.page}
                totalPages={listing.totalPages}
                basePath={paths.product(product.slug)}
                searchParams={searchParams}
                ownReviewId={own?.id}
                canVote={isSignedIn}
                isVoting={vote.isPending}
                onVote={(reviewId, value) => vote.mutate({ slug: product.slug, reviewId, value })}
              />
            ) : (
              <p className="py-6 text-sm text-ink-500">
                {isNarrowed
                  ? strings.productPage.reviews.filteredEmpty
                  : strings.productPage.tabs.reviewsAll}
              </p>
            )}

            {isSignedIn ? null : <ReviewGuestCallout />}
          </>
        )}

        {isSignedIn ? (
          <ReviewForm
            productSlug={product.slug}
            existingReview={own}
            open={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        ) : null}
      </div>
    </section>
  );
}
