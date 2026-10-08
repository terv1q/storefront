/**
 * The five-star drawing.
 *
 * One implementation for the card, the product page, and the review list, because
 * a rating is the same object in all three and three copies of a clip-path would
 * be three chances for the half star to be drawn differently.
 *
 * The filled portion is clipped rather than rounded to the nearest half: a rating
 * of 4.6 drawn as 4.5 is a picture that contradicts the number beside it. The
 * whole thing is decoration and is hidden from assistive technology — every place
 * that draws it puts the sentence it stands for in text next to it.
 */

import { Star } from 'lucide-react';

import { cn } from '@/lib/cn';

const STARS = [0, 1, 2, 3, 4];

type Props = {
  /** From 0 to 5. Anything outside is clamped rather than drawn off the scale. */
  rating: number;
  /** The width and height of one star, in pixels. The gap scales with it. */
  size?: number;
  className?: string;
};

export function Stars({ rating, size = 14, className }: Props) {
  const share = Math.max(0, Math.min(1, rating / 5));
  const gap = size >= 18 ? 'gap-1' : 'gap-0.5';

  return (
    <span aria-hidden="true" className={cn('relative inline-block leading-none', className)}>
      <span className={cn('flex text-ink-300', gap)}>
        {STARS.map((index) => (
          <Star key={index} size={size} fill="currentColor" strokeWidth={0} />
        ))}
      </span>

      <span
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${(1 - share) * 100}% 0 0)` }}
      >
        <span className={cn('flex text-accent-600', gap)}>
          {STARS.map((index) => (
            <Star key={index} size={size} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
      </span>
    </span>
  );
}
