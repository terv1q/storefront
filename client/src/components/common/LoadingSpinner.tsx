/**
 * The spinner, drawn rather than imported.
 *
 * `lucide-react` has a `LoaderCircle` that does this job, and this is one of the
 * few places where a drawn icon is worth its own file: the spinner appears inside
 * buttons that are already using an icon library, and swapping it for a two-shape
 * SVG means the loading affordance does not have to travel with the icon bundle
 * or inherit its stroke settings.
 *
 * It is a circle with a quarter of it drawn over the top, which is what makes the
 * rotation readable — a full ring turning looks like a ring. The animation is
 * `animate-spin`, so it inherits the reduced-motion rules the stylesheet already
 * applies to that utility.
 *
 * It carries no label and is `aria-hidden`: a spinner is never the only thing
 * that says something is happening. The button whose label is unchanged, the
 * status line beside it, or the `aria-busy` on the region it sits in is what a
 * screen reader reads, and a second announcement here would say it twice.
 */

import { cn } from '@/lib/cn';

type Props = {
  /** Side length in pixels. Matches the icon sizes used beside it. */
  size?: number;
  className?: string;
};

export function LoadingSpinner({ size = 16, className }: Props) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      role="presentation"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('animate-spin', className)}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
