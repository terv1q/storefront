/**
 * The banner a line gets when the catalog has moved on.
 *
 * One banner per problem, and every banner carries the action that fixes it —
 * that is the point of the re-validation. Telling a shopper "the price changed"
 * and leaving them to find which row is a notification; telling them where and
 * offering the one click is a fix.
 *
 * Each action does exactly what it says. "Update the price" takes today's price
 * for that line. "Reduce to N" takes what is left. "Remove" takes the line out.
 * None of them are silent about the money involved: the banner says what the
 * price was and what it is, or what is left, before the button is pressed.
 *
 * The region is `aria-live="polite"` and the banners are ordered by what they
 * cost the shopper to ignore: something that cannot be bought comes first, a
 * price that moved second.
 */

import { AlertTriangle, Info } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { CartIssue } from '@/features/cart/cart.revalidate';
import { formatPrice } from '@/utils/formatPrice';

/** Unable to be bought at all is worse than a price that moved. */
const SEVERITY: Record<CartIssue['kind'], number> = {
  inactive: 0,
  out_of_stock: 1,
  insufficient_stock: 2,
  price_changed: 3,
};

export function sortIssues(issues: readonly CartIssue[]): CartIssue[] {
  return [...issues].sort((a, b) => SEVERITY[a.kind] - SEVERITY[b.kind]);
}

type Props = {
  issues: readonly CartIssue[];
  /** Applies today's price and stock to every flagged line. */
  onUpdatePrices: () => void;
  /** Brings one line down to what is left. */
  onReduceQuantity: (issue: CartIssue) => void;
  /** Takes one line out of the basket. */
  onRemove: (issue: CartIssue) => void;
  className?: string;
};

export function CartIssues({
  issues,
  onUpdatePrices,
  onReduceQuantity,
  onRemove,
  className,
}: Props) {
  if (issues.length === 0) {
    return null;
  }

  const ordered = sortIssues(issues);
  const priceMoved = ordered.some((issue) => issue.kind === 'price_changed');

  return (
    <div aria-live="polite" className={cn('flex flex-col gap-3', className)}>
      {priceMoved ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning-600 bg-warning-50 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-ink-900">
            <Info aria-hidden="true" size={16} className="text-warning-600" />
            {strings.cart.pricesChanged}
          </p>
          <Button variant="outline" onClick={onUpdatePrices}>
            {strings.cart.updatePrices}
          </Button>
        </div>
      ) : null}

      {ordered.map((issue) => (
        <div
          key={`${issue.key}:${issue.kind}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning-600 bg-warning-50 px-4 py-3"
        >
          <p className="flex items-center gap-2 text-sm text-ink-900">
            <AlertTriangle aria-hidden="true" size={16} className="text-warning-600" />
            {describe(issue)}
          </p>

          <div className="flex flex-wrap gap-2">
            {issue.kind === 'insufficient_stock' && issue.availableStock !== null ? (
              <Button variant="outline" onClick={() => onReduceQuantity(issue)}>
                {strings.cart.reduceTo(issue.availableStock)}
              </Button>
            ) : null}

            <Button variant="ghost" onClick={() => onRemove(issue)}>
              {strings.actions.remove}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/** The sentence for one issue, with the numbers the shopper needs to decide. */
function describe(issue: CartIssue): string {
  switch (issue.kind) {
    case 'inactive':
      return strings.cart.issueInactive(issue.line.name);
    case 'out_of_stock':
      return strings.cart.issueOutOfStock(issue.line.name);
    case 'insufficient_stock':
      return strings.cart.issueStockLeft(
        issue.line.name,
        issue.availableStock ?? 0,
        issue.line.quantity,
      );
    case 'price_changed':
      return strings.cart.issuePrice(
        issue.line.name,
        formatPrice(issue.line.unitPrice),
        formatPrice(issue.currentPrice ?? issue.line.unitPrice),
      );
  }
}
