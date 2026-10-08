/**
 * The grey box a page draws where its content will be.
 *
 * Every loading state in the application used to be a `div` with
 * `animate-pulse` and a set of sizes written at the call site, which meant the
 * same box was described slightly differently in eleven files and a change to the
 * pulse or the corner radius was eleven edits. This is that box, once.
 *
 * The variants are the four shapes the pages actually draw — a line of text, a
 * whole card, something round, and a picture — and each is only a default: the
 * caller passes the width, the height, and the radius it needs through
 * `className`, because a skeleton is right when it matches the thing it stands
 * in for. What the variant decides is the part every caller got the same anyway.
 *
 * It is always `aria-hidden`. A skeleton says "something is coming" to the eye,
 * and to a screen reader it would be a run of empty boxes; the announcement
 * belongs to the element that owns the wait, which is where `aria-busy` and a
 * status sentence live.
 */

import type { CSSProperties } from 'react';

import { cn } from '@/lib/cn';

type Variant = 'text' | 'card' | 'avatar' | 'image';

type Props = {
  variant?: Variant;
  className?: string;
  /** For the caller whose placeholder is sized to something it measured. */
  style?: CSSProperties;
};

/** What each shape is before the caller adjusts it. */
const VARIANT_STYLES: Record<Variant, string> = {
  text: 'h-3 w-full rounded',
  card: 'h-72 w-full rounded-card',
  avatar: 'size-12 rounded-full',
  image: 'aspect-square w-full rounded-card',
};

export function Skeleton({ variant = 'text', className, style }: Props) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn('animate-pulse bg-surface-muted', VARIANT_STYLES[variant], className)}
    />
  );
}
