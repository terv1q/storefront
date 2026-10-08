/**
 * The sentence under a field that was refused.
 *
 * Seven forms in this application draw a message under a control, and each of
 * them had written the same paragraph element: the danger colour, the size, the
 * `role="alert"`, and the id the control points at with `aria-describedby`. The
 * id is the part that matters — a message that is merely near a field may be read
 * before it or after the next one — and it is the part that a copy of the element
 * forgets.
 *
 * The size is not fixed. A field error is `text-sm` where it stands under an
 * input and `text-xs` where it stands under a compact one inside a summary line,
 * so the caller can adjust it and the colour and the role come with the
 * component either way.
 */

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Props = {
  /** The id the refused control names in its `aria-describedby`. */
  id?: string;
  children: ReactNode;
  className?: string;
};

export function ErrorMessage({ id, children, className }: Props) {
  return (
    <p id={id} role="alert" className={cn('text-sm text-danger-600', className)}>
      {children}
    </p>
  );
}
