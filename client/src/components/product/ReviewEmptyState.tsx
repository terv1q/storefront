/**
 * What a product shows when nobody has reviewed it yet.
 *
 * It is a state to be acted on rather than a blank to be apologised for: the
 * product has no reviews, and the way it gets its first one is the customer
 * reading this. A signed-in customer is given the button; a guest is not offered
 * a form they cannot submit, because the form would ask them to fill it in before
 * telling them to sign in.
 *
 * The panel is drawn in the shop's own voice — "no reviews yet", not "there was a
 * problem" — because nothing has gone wrong: this is a new product.
 */

import { MessageSquare } from 'lucide-react';

import { EmptyState } from '@/components/common/EmptyState';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  /** Opens the form. Absent for a guest, who has no review to write yet. */
  onWriteReview?: (() => void) | undefined;
  className?: string;
};

export function ReviewEmptyState({ onWriteReview, className }: Props) {
  return (
    <EmptyState
      Icon={MessageSquare}
      title={strings.productPage.reviews.noReviews}
      body={strings.productPage.reviews.noReviewsBody}
      className={cn('py-10', className)}
    >
      {onWriteReview === undefined ? null : (
        <button
          type="button"
          onClick={onWriteReview}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {strings.productPage.reviews.writeFirst}
        </button>
      )}
    </EmptyState>
  );
}
