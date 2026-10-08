/**
 * The controls above the saved products.
 *
 * Two things live here: the count of what the page holds, and the actions that
 * work on a selection. Selection is component state and not a URL parameter —
 * it is not something to send anybody, it does not survive a reload, and a link
 * that opened the page with six products preselected would be a link that had
 * decided something for the shopper.
 *
 * "Select all" covers only the rows that can be acted on. A product with options
 * cannot be moved to the cart without choosing one, so its row has no checkbox;
 * a select-all that included it would promise a move that will not happen.
 * Removing is offered per row for those, where the shopper can see which product
 * they are removing.
 */

import { Trash2, X } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  /** How many rows could be selected at all. */
  selectableCount: number;
  selectedCount: number;
  allSelected: boolean;
  onToggleAll: (selected: boolean) => void;
  onMoveSelected: () => void;
  onRemoveSelected: () => void;
  onClearAll: () => void;
  className?: string;
};

export function WishlistToolbar({
  selectableCount,
  selectedCount,
  allSelected,
  onToggleAll,
  onMoveSelected,
  onRemoveSelected,
  onClearAll,
  className,
}: Props) {
  const hasSelection = selectedCount > 0;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-border bg-surface-muted px-4 py-3',
        className,
      )}
    >
      <label
        className={cn(
          'flex items-center gap-2 text-sm text-ink-700',
          selectableCount === 0 ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        )}
      >
        <input
          type="checkbox"
          checked={allSelected}
          disabled={selectableCount === 0}
          // `indeterminate` is not an attribute, so it is set on the element.
          // Without it a partial selection looks like no selection, and the next
          // click would clear what the shopper had picked.
          ref={(node) => {
            if (node !== null) {
              node.indeterminate = hasSelection && !allSelected;
            }
          }}
          onChange={(event) => onToggleAll(event.target.checked)}
          className="h-4 w-4 accent-brand-700"
        />
        {strings.wishlist.selectAll}
      </label>

      <p aria-live="polite" className="text-sm text-ink-600">
        {strings.wishlist.selectedCount(selectedCount)}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={!hasSelection} onClick={onMoveSelected}>
          {strings.wishlist.moveSelected}
        </Button>

        <Button variant="ghost" disabled={!hasSelection} onClick={onRemoveSelected}>
          <Trash2 aria-hidden="true" size={16} />
          {strings.wishlist.removeSelected}
        </Button>

        <Button variant="ghost" onClick={onClearAll}>
          <X aria-hidden="true" size={16} />
          {strings.wishlist.clearAll}
        </Button>
      </div>
    </div>
  );
}
