/**
 * The reviews themselves: one page of them, newest first unless the shopper asked
 * otherwise.
 *
 * A review is somebody's opinion of the product, so the block that draws one
 * shows what the opinion is about — the rating, the words, the photographs — and
 * what backs it up: the verified purchase badge, which the server computes from
 * the author's delivered orders and the client cannot claim, and how many other
 * customers found the review useful.
 *
 * A vote is one choice out of three, and the third is "no opinion": pressing the
 * button that is already lit takes the vote back, rather than leaving a customer
 * stuck with a vote they have changed their mind about. Only a signed-in customer
 * can vote, and nobody can vote on their own review — the count is meant to be
 * other people's answer, so a review the viewer wrote shows the tally without the
 * buttons.
 *
 * Photographs come back from the API as paths under its own origin, so they are
 * resolved through `resolveApiAssetUrl` before the browser is asked to draw them.
 */

import { Check, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Pagination } from '@/components/common/Pagination';
import { Stars } from './Stars';
import type { Review } from '@/features/products/products.types';
import { reviewPageHref } from '@/features/products/reviewParams';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { resolveApiAssetUrl } from '@/services/api';
import { formatDate } from '@/utils/formatDate';

type Props = {
  reviews: Review[];
  page: number;
  totalPages: number;
  /** The product's own address, for the pagination links. */
  basePath: string;
  searchParams: URLSearchParams;
  /** The review the viewer wrote, which is shown without voting buttons. */
  ownReviewId?: string | undefined;
  /** Whether the viewer is signed in. A guest sees the tally and no buttons. */
  canVote: boolean;
  onVote: (reviewId: string, value: -1 | 0 | 1) => void;
  isVoting: boolean;
  className?: string;
};

/** The three states of a vote, drawn as one pair of buttons. */
function VoteButtons({
  review,
  disabled,
  onVote,
}: {
  review: Review;
  disabled: boolean;
  onVote: (value: -1 | 0 | 1) => void;
}) {
  const base =
    'inline-flex min-h-11 items-center gap-1.5 rounded-control border px-2.5 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-0';

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-ink-500">{strings.productPage.reviews.helpful}</span>

      <button
        type="button"
        disabled={disabled}
        // Pressing the lit button withdraws the vote; pressing the other one
        // changes it. Either way the customer is left with what they meant.
        onClick={() => onVote(review.myVote === 1 ? 0 : 1)}
        aria-pressed={review.myVote === 1}
        aria-label={strings.productPage.reviews.helpful}
        className={cn(
          base,
          review.myVote === 1
            ? 'border-success-600 bg-success-50 text-success-600'
            : 'border-border text-ink-600 hover:bg-surface-muted',
        )}
      >
        <ThumbsUp aria-hidden="true" size={14} />
        {review.helpfulYes}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onVote(review.myVote === -1 ? 0 : -1)}
        aria-pressed={review.myVote === -1}
        aria-label={strings.productPage.reviews.notHelpful}
        className={cn(
          base,
          review.myVote === -1
            ? 'border-danger-600 bg-danger-50 text-danger-600'
            : 'border-border text-ink-600 hover:bg-surface-muted',
        )}
      >
        <ThumbsDown aria-hidden="true" size={14} />
        {review.helpfulNo}
      </button>
    </div>
  );
}

function ReviewItem({
  review,
  isOwn,
  canVote,
  onVote,
  isVoting,
}: {
  review: Review;
  isOwn: boolean;
  canVote: boolean;
  onVote: (value: -1 | 0 | 1) => void;
  isVoting: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 py-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars rating={review.rating} size={16} />

        <span className="sr-only">{strings.productPage.tabs.reviewRating(review.rating)}</span>

        <span className="font-medium break-words text-ink-900">
          {review.authorName || strings.productPage.tabs.anonymous}
        </span>

        <time dateTime={review.createdAt} className="text-sm text-ink-500">
          {formatDate(review.createdAt)}
        </time>

        {review.isVerifiedPurchase ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-600">
            <Check aria-hidden="true" size={12} />
            {strings.productPage.reviews.verifiedPurchase}
          </span>
        ) : null}
      </div>

      {review.title ? (
        <h4 className="text-base font-semibold text-ink-900">{review.title}</h4>
      ) : null}

      <p className="text-sm leading-relaxed text-ink-700 whitespace-pre-line">{review.body}</p>

      {review.images.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {review.images.map((image, index) => (
            <li key={image.id}>
              <img
                src={resolveApiAssetUrl(image.url)}
                alt={`${strings.productPage.reviews.photosHeading} ${index + 1}`}
                loading="lazy"
                width={80}
                height={80}
                className="h-20 w-20 rounded-control border border-border object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {canVote && !isOwn ? (
        <VoteButtons review={review} disabled={isVoting} onVote={onVote} />
      ) : (
        <p className="text-sm text-ink-500">
          {strings.productPage.reviews.helpful}: {review.helpfulYes}
          {' · '}
          {strings.productPage.reviews.notHelpful}: {review.helpfulNo}
        </p>
      )}
    </li>
  );
}

export function ReviewList({
  reviews,
  page,
  totalPages,
  basePath,
  searchParams,
  ownReviewId,
  canVote,
  onVote,
  isVoting,
  className,
}: Props) {
  return (
    <div className={className}>
      <ul className="divide-y divide-border">
        {reviews.map((review) => (
          <ReviewItem
            key={review.id}
            review={review}
            isOwn={review.id === ownReviewId}
            canVote={canVote}
            isVoting={isVoting}
            onVote={(value) => onVote(review.id, value)}
          />
        ))}
      </ul>

      {totalPages > 1 ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={(target) => reviewPageHref(basePath, searchParams, target)}
          className="mt-6"
        />
      ) : null}
    </div>
  );
}
