/**
 * What the ratings add up to, above the list they came from.
 *
 * The average is the headline, and the bars beside it say how it was arrived at:
 * an average of four stars means something different when every rating is four
 * and when half are five and half are three. Each bar is drawn from the summary
 * the API computed over the whole product, never from the page of reviews on
 * screen, so filtering the list to one star does not redraw the distribution as
 * a single bar.
 *
 * The bars are decoration — the count is written beside each one — and the whole
 * block is text, so a screen reader reads the same numbers a sighted visitor
 * reads.
 */

import { Check } from 'lucide-react';

import { Stars } from './Stars';
import type { ReviewSummary as Summary } from '@/features/products/products.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  summary: Summary;
  className?: string;
};

/** One bar of the distribution: the rating, how many reviews, and its share. */
function DistributionBar({
  rating,
  count,
  total,
}: {
  rating: number;
  count: number;
  total: number;
}) {
  const share = total === 0 ? 0 : (count / total) * 100;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-14 shrink-0 text-ink-600" aria-hidden="true">
        {rating} ★
      </span>

      <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <span className="block h-full rounded-full bg-accent-500" style={{ width: `${share}%` }} />
      </span>

      <span className="w-24 shrink-0 text-right text-ink-600">
        {strings.productPage.reviews.ratingBar(rating, count)}
      </span>
    </div>
  );
}

export function ReviewSummary({ summary, className }: Props) {
  const { average, total, verified, distribution } = summary;

  return (
    <section
      aria-label={strings.productPage.reviews.summaryHeading}
      className={cn('rounded-card border border-border bg-surface p-6', className)}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex shrink-0 flex-col items-center gap-1 sm:items-start">
          <p className="text-4xl font-semibold text-ink-900">{average.toFixed(1)}</p>

          <Stars rating={average} size={18} />

          <p className="sr-only">
            {strings.productPage.tabs.reviewRating(average)}.{' '}
            {strings.productPage.reviews.reviewCount(total)}
          </p>

          <p aria-hidden="true" className="text-sm text-ink-600">
            {strings.productPage.reviews.reviewCount(total)}
          </p>

          {verified > 0 ? (
            <p className="inline-flex items-center gap-1 text-xs text-success-600">
              <Check aria-hidden="true" size={12} />
              {strings.productPage.reviews.verifiedPurchases(verified)}
            </p>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {distribution.map((entry) => (
            <DistributionBar
              key={entry.rating}
              rating={entry.rating}
              count={entry.count}
              total={total}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
