/**
 * What an order holds: the lines and the money.
 *
 * Both the confirmation page and the order page draw the same two things, so
 * they are written once here. The lines keep the name and the price the order
 * recorded rather than the ones the catalog shows today — an order is a
 * receipt, and a receipt does not change when the price does. A line whose
 * product is still in the catalog links to it, because the most common reason
 * to open an old order is to buy the same thing again; a line whose product is
 * gone renders as plain text rather than as a link to nowhere.
 *
 * The money block reads its labels from the cart's copy, which is where those
 * words are already written in all three languages. The total is the server's
 * own `total`, never a sum computed here: `subtotal - promoDiscount +
 * shippingTotal` is the server's rule, and repeating it in a second place is
 * how the two would eventually disagree.
 */

import { Link } from 'react-router-dom';

import { Thumbnail } from '@/components/common/Thumbnail';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { Order } from '@/types/order';
import { formatPrice } from '@/utils/formatPrice';

type LinesProps = {
  items: readonly OrderLine[];
  className?: string;
};

/** As much of a line as the summary needs, so the confirmation can pass its own. */
type OrderLine = NonNullable<Order['items']>[number];

export function OrderLines({ items, className }: LinesProps) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((line) => (
        <li key={line.id} className="flex items-center gap-3">
          <Thumbnail
            src={line.imageUrl ?? null}
            alt={line.name}
            className="size-14 rounded-control"
            iconSize={16}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            {line.productSlug === undefined || line.productSlug === null ? (
              <p className="truncate text-sm font-medium text-ink-900">{line.name}</p>
            ) : (
              <Link
                to={paths.product(line.productSlug)}
                className="truncate text-sm font-medium text-ink-900 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {line.name}
              </Link>
            )}

            <p className="text-xs text-ink-600">
              {strings.checkout.summary.quantity(line.quantity)} · {formatPrice(line.unitPrice)}
            </p>
          </div>

          <p className="text-sm font-medium text-ink-900">{formatPrice(line.lineTotal)}</p>
        </li>
      ))}
    </ul>
  );
}

type TotalsProps = {
  order: Pick<Order, 'subtotal' | 'promoCode' | 'promoDiscount' | 'shippingTotal' | 'total'>;
  /** What the last line is called: what was charged, or what the order comes to. */
  totalLabel: string;
  className?: string;
};

export function OrderTotals({ order, totalLabel, className }: TotalsProps) {
  return (
    <dl className={cn('flex flex-col gap-2 text-sm', className)}>
      <Row label={strings.cart.subtotal} value={formatPrice(order.subtotal)} />

      {order.promoDiscount > 0 ? (
        <Row
          label={
            order.promoCode === null
              ? strings.cart.promoLabel
              : strings.cart.promoLine(order.promoCode)
          }
          value={`−${formatPrice(order.promoDiscount)}`}
          tone="credit"
        />
      ) : null}

      <Row
        label={strings.cart.shipping}
        value={
          order.shippingTotal === 0 ? strings.cart.shippingFree : formatPrice(order.shippingTotal)
        }
      />

      <div className="mt-1 border-t border-border pt-3">
        <Row label={totalLabel} value={formatPrice(order.total)} tone="total" />
      </div>
    </dl>
  );
}

function Row({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'credit' | 'total';
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={tone === 'total' ? 'font-medium text-ink-900' : 'text-ink-600'}>{label}</dt>
      <dd
        className={cn(
          tone === 'total' ? 'text-base font-semibold text-ink-900' : 'text-ink-900',
          tone === 'credit' && 'text-success-600',
        )}
      >
        {value}
      </dd>
    </div>
  );
}
