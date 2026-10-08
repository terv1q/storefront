/**
 * The panel a page shows when it has nothing to show.
 *
 * Empty is a state, not an error and not a blank: a shopper who filtered the
 * catalog down to nothing needs to know the search worked and the answer is
 * zero, and needs somewhere to go next. The caller supplies both — the wording
 * and the actions as children — because what "somewhere to go" means is
 * different on every page: another category here, a wider search there.
 *
 * The icon is `aria-hidden` and title and body are real text, so the message is
 * read out once, in words, rather than announced as a picture.
 */

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

type Props = {
  Icon?: LucideIcon;
  title: string;
  body?: string;
  /** Buttons, links, or a form that gives the visitor a way forward. */
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ Icon, title, body, children, className }: Props) {
  return (
    <div
      className={cn(
        'grid place-items-center rounded-card border border-border bg-surface-muted px-6 py-12 text-center',
        className,
      )}
    >
      <div className="max-w-md">
        {Icon ? (
          <span className="mx-auto grid h-12 w-12 place-content-center rounded-full bg-surface text-ink-400">
            <Icon aria-hidden="true" size={22} />
          </span>
        ) : null}

        <h2 className="mt-4 text-lg font-semibold text-ink-900">{title}</h2>

        {body ? <p className="mt-2 text-sm text-ink-600">{body}</p> : null}

        {children ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
        ) : null}
      </div>
    </div>
  );
}
