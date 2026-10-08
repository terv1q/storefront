/**
 * The chips that show what a listing is currently narrowed to.
 *
 * A listing can be narrowed by several things at once, and the state that does
 * it lives in the URL rather than on the page. That is right for sharing and
 * reloading, and wrong for reading: a shopper looking at twenty products out of
 * a category that holds two hundred has no way to see why, or to undo one thing
 * without undoing all of them. The chips are that answer — one per active
 * narrowing, each with its own remove button, plus one control that clears the
 * lot.
 *
 * The component is generic on purpose: it knows a key, a label, and what
 * removing means, and nothing about categories, prices, or search terms. The
 * page that owns the URL decides what is active and what clearing it does.
 *
 * Each remove button is labelled with the chip it removes rather than "remove",
 * because a screen reader hears the buttons in sequence and five identical
 * labels are five identical labels.
 */

import { X } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

export type ActiveFilter = {
  /** Stable identity for the React list — usually the parameter name. */
  key: string;
  /** What the shopper sees, already worded for the current language. */
  label: string;
  onRemove: () => void;
};

type Props = {
  filters: readonly ActiveFilter[];
  /** Shown only when there is more than one thing to clear. */
  onClearAll?: () => void;
  className?: string;
};

export function ActiveFilters({ filters, onClearAll, className }: Props) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={strings.catalog.activeFiltersLabel}
      role="group"
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={filter.onRemove}
          aria-label={strings.catalog.removeFilter(filter.label)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {filter.label}
          <X aria-hidden="true" size={14} className="text-ink-500" />
        </button>
      ))}

      {filters.length > 1 && onClearAll !== undefined ? (
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-control px-2 py-1.5 text-sm font-medium text-brand-700 underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {strings.catalog.clearAll}
        </button>
      ) : null}
    </div>
  );
}
