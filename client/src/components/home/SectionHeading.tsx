/**
 * The heading a home page section wears.
 *
 * Every section on the page is a `section` with an `aria-labelledby` pointing at
 * this heading, which is why the title is the element that carries the id rather
 * than the wrapper: the accessible name of a region has to come from something
 * inside it, and a `section` with a name is a landmark a screen reader can jump
 * between.
 *
 * The heading is an `h2`. The page owns the only `h1` — in the hero — so every
 * section below it sits at the same level and the document outline reads as a
 * list of sections rather than a chain that gets deeper for no reason.
 *
 * A section that needs a control of its own — the arrows a product shelf moves
 * with — passes it as `children`, and it lands at the end of the same row. That
 * is where the eye already is, and it keeps the control from floating over the
 * products the way an overlay button would.
 */

import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Props = {
  /** The id the owning section points its `aria-labelledby` at. */
  id: string;
  title: string;
  hint?: string;
  /** Optional link at the end of the row, for the whole collection behind the section. */
  action?: { label: string; to: string };
  /** Controls shown after the action, in the same row. */
  children?: ReactNode;
  className?: string;
};

export function SectionHeading({ id, title, hint, action, children, className }: Props) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-display-sm font-semibold text-ink-900">
          {title}
        </h2>
        {hint ? <p className="mt-1 max-w-2xl text-sm text-ink-600">{hint}</p> : null}
      </div>

      {action || children ? (
        <div className="flex shrink-0 items-center gap-3">
          {action ? (
            <Link
              to={action.to}
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"
            >
              {action.label}
              <ArrowRight
                aria-hidden="true"
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          ) : null}

          {children}
        </div>
      ) : null}
    </div>
  );
}
