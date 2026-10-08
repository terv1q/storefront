/**
 * How far the basket is from free delivery.
 *
 * The threshold and the fee are the store's, not this component's: the cart page
 * reads them from the delivery policy the API publishes and passes them down, so
 * the bar and the shipping line above it are computed from one number. Until
 * that answer arrives the store's own constant stands in — see `config/site`.
 *
 * A `progressbar` with a real `aria-valuenow`, `aria-valuemin`, and
 * `aria-valuemax` is what makes the bar mean something to a screen reader; the
 * sentence under it says the same thing in words, because "412 000 of 500 000"
 * is not an answer to "how much more do I need to spend".
 *
 * Once delivery is free the bar is not drawn at all. A filled bar that stays on
 * screen after the goal is reached is a progress bar with nothing left to
 * progress towards, and the summary already says "Free".
 */

import { Truck } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { amountToFreeDelivery } from '@/features/cart/cart.totals';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  subtotal: number;
  /** Minor units, or `null` when the store has no free-delivery threshold. */
  freeDeliveryFrom: number | null;
  className?: string;
};

export function FreeDeliveryProgress({ subtotal, freeDeliveryFrom, className }: Props) {
  if (freeDeliveryFrom === null || freeDeliveryFrom <= 0 || subtotal === 0) {
    return null;
  }

  const remaining = amountToFreeDelivery(subtotal, freeDeliveryFrom);

  if (remaining === null) {
    return (
      <p
        className={cn(
          'flex items-center gap-2 rounded-card border border-success-600 bg-success-50 px-4 py-3 text-sm font-medium text-success-600',
          className,
        )}
      >
        <Truck aria-hidden="true" size={16} />
        {strings.cart.freeDeliveryReached}
      </p>
    );
  }

  const percent = Math.min(100, Math.round((subtotal / freeDeliveryFrom) * 100));

  return (
    <div className={cn('rounded-card border border-border bg-surface p-4', className)}>
      <p className="flex items-center gap-2 text-sm text-ink-900">
        <Truck aria-hidden="true" size={16} className="text-ink-500" />
        {strings.cart.freeDeliveryProgress(formatPrice(remaining))}
      </p>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={freeDeliveryFrom}
        aria-valuenow={Math.min(subtotal, freeDeliveryFrom)}
        aria-label={strings.cart.freeDeliveryBar}
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink-100"
      >
        <div
          className="h-full rounded-full bg-brand-700 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
