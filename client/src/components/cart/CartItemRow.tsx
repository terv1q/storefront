/**
 * One line of the cart.
 *
 * A row is a picture, what was chosen, what it costs, and what can be done with
 * it, in that order — which is the order somebody checks a basket in. The line
 * total is computed from the unit price and the quantity rather than stored, for
 * the same reason the summary is.
 *
 * The quantity control is the product page's own `QuantitySelector`, deliberately:
 * one control means one keyboard experience, one set of labels, and one place
 * that knows a line may not exceed the stock it was added with.
 *
 * "Save for later" is the wishlist. It adds the product to the saved list through
 * the same store and the same mutation the heart on a card uses, and only then
 * removes the line — so a failed save leaves the shopper with their basket
 * intact rather than losing the item to a request that did not arrive.
 *
 * A line the catalog has flagged keeps its price on screen but says what changed
 * under it; the page owns the banner that offers to fix it. Nothing here is
 * disabled by default: a shopper may always raise a quantity that is in stock, and
 * the reasons they cannot are written where the buttons are.
 */

import { Link } from 'react-router-dom';

import { Thumbnail } from '@/components/common/Thumbnail';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { CartItem } from '@/features/cart/cart.types';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
  onSaveForLater: () => void;
  /** What is left now, when the page has re-read the product. */
  availableStock?: number | null;
  className?: string;
};

const actionClass =
  'rounded-control text-sm font-medium text-ink-600 underline-offset-4 transition-colors hover:text-ink-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  availableStock = null,
  className,
}: Props) {
  const lineTotal = item.unitPrice * item.quantity;
  const discounted = item.compareAtPrice !== null && item.compareAtPrice > item.unitPrice;
  // The ceiling the control offers: what is left today when the page knows, and
  // what was left when the line was added otherwise.
  const ceiling = availableStock ?? item.stock ?? 0;
  const overStock = availableStock !== null && availableStock < item.quantity;

  return (
    <li
      className={cn(
        'grid gap-4 rounded-card border border-border bg-surface p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-start',
        className,
      )}
    >
      <Link
        to={paths.product(item.slug)}
        className="w-fit rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <Thumbnail
          src={item.imageUrl}
          className="h-20 w-20 rounded-control border border-border"
          iconSize={20}
        />
        <span className="sr-only">{item.name}</span>
      </Link>

      <div className="min-w-0">
        <h3 className="text-sm font-medium text-ink-900">
          <Link
            to={paths.product(item.slug)}
            className="rounded-control underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {item.name}
          </Link>
        </h3>

        {item.variantLabel !== null ? (
          <p className="mt-1 text-sm text-ink-600">{item.variantLabel}</p>
        ) : null}

        <p className="mt-2 flex flex-wrap items-baseline gap-2 text-sm">
          <span className="text-ink-900">{formatPrice(item.unitPrice)}</span>
          {discounted ? (
            <s className="text-ink-500">{formatPrice(item.compareAtPrice ?? item.unitPrice)}</s>
          ) : null}
        </p>

        {overStock ? (
          <p className="mt-2 text-sm text-warning-600">
            {strings.cart.itemStockLeft(availableStock ?? 0)}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:items-end">
        <QuantitySelector value={item.quantity} onChange={onQuantityChange} max={ceiling} />

        <p className="text-sm font-semibold text-ink-900">
          {strings.cart.lineTotal(formatPrice(lineTotal))}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={onSaveForLater} className={actionClass}>
            {strings.actions.saveForLater}
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={strings.cart.removeItem(item.name)}
            className={actionClass}
          >
            {strings.cart.remove}
          </button>
        </div>
      </div>
    </li>
  );
}
