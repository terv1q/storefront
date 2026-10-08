/**
 * The card the sign-in and registration forms are written inside.
 *
 * Both pages are the same shape — a narrow column, a heading, the form, and a
 * link to the other one — so the shape is written once. A page supplies its own
 * heading, its own form, and its own footer link; nothing that differs between
 * the two is decided here.
 *
 * It is deliberately narrow: a form is read one field at a time, and a wide
 * column of short inputs is a column the eye has to hunt across. The card is
 * the same `rounded-panel` surface the rest of the store uses for its raised
 * blocks, so the auth pages belong to the site rather than to a separate design.
 */

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Props = {
  title: string;
  /** One sentence under the heading, saying what the form is for. */
  body: string;
  children: ReactNode;
  /** The way to the other form: a sentence and a link. */
  footer: ReactNode;
  className?: string;
};

export function AuthPanel({ title, body, children, footer, className }: Props) {
  return (
    <div className={cn('mx-auto w-full max-w-narrow px-page-x py-10 sm:py-14', className)}>
      <div className="rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
        <p className="mt-2 text-sm text-ink-600">{body}</p>

        <div className="mt-6">{children}</div>
      </div>

      <p className="mt-4 text-center text-sm text-ink-600">{footer}</p>
    </div>
  );
}
