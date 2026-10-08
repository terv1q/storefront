/**
 * The panel a page shows when a request failed.
 *
 * Failure is three things at once, and a page that shows only the first is a page
 * a shopper cannot act on: what happened, what can be tried next, and where to go
 * if trying again does not help. So the panel carries the server's own message as
 * its detail text, a retry that re-runs the query that failed, and a support line
 * with the store's address in it.
 *
 * It is not `EmptyState` with different words. Empty is an answer — the search
 * worked and found nothing — and the next step is somewhere else in the catalog.
 * This is a broken request: the same question can be asked again, and the retry
 * is the point of the panel. Keeping them apart is what stops a page from
 * offering "browse the catalog" to somebody whose connection dropped.
 *
 * `role="alert"` is on the container rather than on a child, because the whole
 * panel is the announcement: a screen reader that hears only the detail text
 * would miss that there is a way to try again.
 */

import { AlertTriangle } from 'lucide-react';
import type { ReactNode } from 'react';

import { siteConfig } from '@/config/site';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  /** Usually `strings.errors.pageFailed`. The caller may be more specific. */
  title?: string;
  /** What went wrong, in the server's words. */
  body?: string | undefined;
  /** Re-runs the request that failed. Left out, no retry button is drawn. */
  onRetry?: (() => void) | undefined;
  retryLabel?: string;
  /** Further actions or links, beside the retry. */
  children?: ReactNode;
  /** Draws the line pointing at the store's support address. */
  support?: boolean;
  className?: string;
};

export function ErrorState({
  title = strings.errors.pageFailed,
  body,
  onRetry,
  retryLabel = strings.actions.retry,
  children,
  support = true,
  className,
}: Props) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-panel border border-border bg-surface-muted px-6 py-8 text-center',
        className,
      )}
    >
      <div className="mx-auto max-w-lg">
        <span className="mx-auto grid h-12 w-12 place-content-center rounded-full bg-surface text-danger-600">
          <AlertTriangle aria-hidden="true" size={22} />
        </span>

        <h2 className="mt-4 text-lg font-semibold text-ink-900">{title}</h2>

        {/* The server's message is the detail: a generic sentence above and the
            reason below is more use than a generic sentence alone. */}
        <p className="mt-2 text-sm text-ink-600">{body ?? strings.errors.generic}</p>

        {onRetry === undefined && children === undefined ? null : (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {onRetry === undefined ? null : (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {retryLabel}
              </button>
            )}

            {children}
          </div>
        )}

        {support ? (
          <p className="mt-6 text-xs text-ink-500">
            {strings.errors.supportBody}{' '}
            <a href={`mailto:${siteConfig.supportEmail}`} className="font-medium">
              {siteConfig.supportEmail}
            </a>
          </p>
        ) : null}
      </div>
    </div>
  );
}
