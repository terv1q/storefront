/**
 * The star picker a reviewer presses.
 *
 * `Stars` is the display of a rating and is hidden from assistive technology,
 * because everywhere it is drawn the same sentence is written beside it. A picker
 * is the opposite object: it is the control, so it is the one that has to be
 * reachable, named, and operable from the keyboard. That is why this is a second
 * component rather than a prop on the first.
 *
 * It is a radio group, which is what a choice of one out of five is. The arrow
 * keys move between the stars and select as they go, the way a native radio group
 * behaves, and the whole group carries one label.
 */

import { Star } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

const STARS = [1, 2, 3, 4, 5];

type Props = {
  /** The chosen rating, `0` when nothing has been chosen yet. */
  value: number;
  onChange: (rating: number) => void;
  /** What the group is called. Its own name, because a caller may draw two. */
  label: string;
  disabled?: boolean;
  describedBy?: string;
  className?: string;
};

export function StarRatingInput({
  value,
  onChange,
  label,
  disabled = false,
  describedBy,
  className,
}: Props) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? -1
          : 0;

    if (step === 0) {
      return;
    }

    event.preventDefault();

    // From nothing chosen, an arrow starts at the first star rather than below it.
    const next = Math.min(5, Math.max(1, (value === 0 ? 0 : value) + step));
    onChange(next);
  };

  return (
    <div className={className}>
      <div
        role="radiogroup"
        aria-label={label}
        aria-describedby={describedBy}
        onKeyDown={onKeyDown}
        className="inline-flex items-center gap-1"
      >
        {STARS.map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={strings.productPage.reviews.ratingChosen(star)}
            disabled={disabled}
            // Only the chosen star, or the first when nothing is chosen, is a tab
            // stop; the arrows move within the group.
            tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
            onClick={() => onChange(star)}
            className={cn(
              'rounded p-0.5 transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
              star <= value ? 'text-accent-600' : 'text-ink-500 hover:text-ink-700',
            )}
          >
            <Star aria-hidden="true" size={28} fill="currentColor" strokeWidth={0} />
          </button>
        ))}
      </div>
    </div>
  );
}
