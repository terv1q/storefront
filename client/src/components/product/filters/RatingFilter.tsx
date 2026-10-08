/**
 * The rating floor.
 *
 * Four thresholds and a row that clears them. The control only ever raises a
 * floor, never opens a band — "three stars and up" is what a shopper asks for,
 * and a between-two-and-three control would be a precision nobody wants on a
 * five-point scale.
 *
 * The stars are drawn as one glyph per point, filled up to the threshold, and the
 * whole group is `aria-hidden` beside the text: a rating a screen reader hears as
 * "star star star" is a rating it has to count. The row itself is labelled in
 * words, which is what it reads.
 */

import { Star } from 'lucide-react';
import { useId } from 'react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  /** The floor, or `null` for any rating. */
  minRating: number | null;
  onChange: (minRating: number | null) => void;
  className?: string;
};

/** The floors worth offering. Five is the top of the scale and needs no row. */
const THRESHOLDS = [4, 3, 2] as const;

const rowClass =
  'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-100';

/** Five glyphs, the first `filled` of them in the accent colour. */
function Stars({ filled }: { filled: number }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-0.5">
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          size={13}
          fill="currentColor"
          strokeWidth={0}
          className={index < filled ? 'text-accent-500' : 'text-ink-300'}
        />
      ))}
    </span>
  );
}

export function RatingFilter({ minRating, onChange, className }: Props) {
  // See BrandFilter: the same panel can be mounted twice, and radios sharing a
  // name across the two copies would behave as a single group.
  const group = useId();

  return (
    <ul className={cn('space-y-0.5', className)}>
      <li>
        <label className={rowClass}>
          <input
            type="radio"
            name={group}
            value=""
            checked={minRating === null}
            onChange={() => onChange(null)}
            className="accent-brand-700"
          />
          <span className="flex-1">{strings.filters.rating.any}</span>
        </label>
      </li>

      {THRESHOLDS.map((stars) => (
        <li key={stars}>
          <label className={rowClass}>
            <input
              type="radio"
              name={group}
              value={stars}
              checked={minRating === stars}
              onChange={() => onChange(stars)}
              className="accent-brand-700"
            />
            <Stars filled={stars} />
            <span className="flex-1">{strings.filters.rating.andUp(stars)}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}
