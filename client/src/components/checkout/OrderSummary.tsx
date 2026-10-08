/**
 * What is being ordered, beside the step that confirms it.
 *
 * The summary follows the shopper down the page on a wide screen and sits above
 * the form on a narrow one, so what is about to be bought is on screen at the
 * moment the button that buys it is pressed. It is the same arithmetic the cart
 * page shows, with one difference: shipping is priced for the delivery method
 * chosen two steps earlier, and a pickup is free at any order value.
 *
 * Every completed step gets a shortcut back to it. A shopper who notices the
 * wrong city while reading the review is one click from fixing it rather than
 * three, and the alternative — restarting the checkout — is how a basket gets
 * abandoned.
 *
 * The per-item error is drawn against the line it belongs to, not in a banner:
 * when the server refuses a line because it sold out while the form was open,
 * the only useful place to say so is next to that product.
 */

import type { ReactNode } from 'react';
import { Pencil } from 'lucide-react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Thumbnail } from '@/components/common/Thumbnail';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { AppliedPromo, CartItem, CartTotals } from '@/features/cart/cart.types';
import { cartItemKey } from '@/features/cart/cart.types';
import { formatPrice } from '@/utils/formatPrice';

import { FreeDeliveryProgress } from '@/components/cart/FreeDeliveryProgress';

type Step = {
  /** What the shortcut goes back to; the index is the step's position. */
  label: string;
  index: number;
};

type Props = {
  items: readonly CartItem[];
  totals: CartTotals;
  promo: AppliedPromo | null;
  /** What the applied code takes off right now, for the confirmation line. */
  appliedDiscount: number;
  freeDeliveryFrom: number | null;
  /** Steps that have been completed, for the shortcuts at the top. */
  completedSteps: readonly Step[];
  onEditStep: (index: number) => void;
  /** A refusal for one line, keyed as the cart keys its lines. */
  lineErrors?: Readonly<Record<string, string>>;
  /** The promo form, which belongs with the figures it changes. */
  children?: ReactNode;
  className?: string;
};

export function OrderSummary({
  items,
  totals,
  promo,
  appliedDiscount,
  freeDeliveryFrom,
  completedSteps,
  onEditStep,
  lineErrors = {},
  children,
  className,
}: Props) {
  return (
    <section
      aria-labelledby="checkout-summary-heading"
      className={cn(
        'rounded-card border border-border bg-surface p-5 lg:sticky lg:top-24',
        className,
      )}
    >
      <h2 id="checkout-summary-heading" className="text-lg font-semibold text-ink-900">
        {strings.checkout.summary.heading}
      </h2>

      <p className="mt-1 text-sm text-ink-600">{strings.cart.itemCount(totals.itemCount)}</p>

      {completedSteps.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {completedSteps.map((step) => (
            <li key={step.index}>
              <button
                type="button"
                onClick={() => onEditStep(step.index)}
                className="inline-flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1 text-xs font-medium text-ink-600 transition-colors hover:bg-surface-muted hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Pencil aria-hidden="true" size={12} />
                {strings.checkout.editStep(step.label)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="mt-5 flex flex-col gap-4 border-t border-border pt-5">
        {items.map((item) => {
          const key = cartItemKey(item);
          const failure = lineErrors[key];

          return (
            <li key={key} className="flex gap-3">
              <Thumbnail
                src={item.imageUrl}
                alt={item.name}
                className="size-14 rounded-control"
                iconSize={16}
              />

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-sm font-medium text-ink-900">{item.name}</p>

                {item.variantLabel !== null ? (
                  <p className="truncate text-xs text-ink-500">{item.variantLabel}</p>
                ) : null}

                <p className="text-xs text-ink-600">
                  {strings.checkout.summary.quantity(item.quantity)} ·{' '}
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>

                {failure !== undefined ? (
                  <ErrorMessage className="text-xs">{failure}</ErrorMessage>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
        <Row label={strings.cart.subtotal} value={formatPrice(totals.subtotal)} />

        {totals.savings > 0 ? (
          <Row
            label={strings.cart.savings}
            value={`−${formatPrice(totals.savings)}`}
            tone="credit"
          />
        ) : null}

        {totals.promoDiscount > 0 && promo !== null ? (
          <Row
            label={strings.cart.promoLine(promo.code)}
            value={`−${formatPrice(totals.promoDiscount)}`}
            tone="credit"
          />
        ) : null}

        <Row
          label={strings.cart.shipping}
          value={totals.shipping === 0 ? strings.cart.shippingFree : formatPrice(totals.shipping)}
          tone={totals.shipping === 0 ? 'credit' : 'default'}
        />

        <div className="mt-1 border-t border-border pt-3">
          <Row label={strings.cart.total} value={formatPrice(totals.total)} tone="total" />
        </div>
      </dl>

      <div className="mt-4">
        <FreeDeliveryProgress subtotal={totals.subtotal} freeDeliveryFrom={freeDeliveryFrom} />
      </div>

      {children ? <div className="mt-5 border-t border-border pt-5">{children}</div> : null}

      {appliedDiscount > 0 ? (
        <p className="mt-3 text-xs text-ink-500">
          {strings.checkout.summary.promoNote(formatPrice(appliedDiscount))}
        </p>
      ) : null}
    </section>
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
    <div className="flex items-baseline justify-between gap-4 text-sm">
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
