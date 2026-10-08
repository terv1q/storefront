/**
 * What the basket comes to.
 *
 * Every line here is computed from the cart's items when the card draws —
 * nothing is a stored number, so a quantity change cannot leave a total behind
 * that was true a moment ago. The arithmetic is `calculateTotals`, which the
 * header and the mini-cart read as well, so the subtotal in the drawer and the
 * subtotal on this page are the same subtraction.
 *
 * The saving is shown as its own line because it is a fact about the basket
 * rather than a deduction: the lines already carry the reduced price, and a
 * shopper who saw the compare-at price on the card wants to see that it applied.
 * Then the promo discount, then shipping, then the total — the order somebody
 * checks a receipt in.
 *
 * Tax is absent on purpose. This store's prices are what is charged, the API has
 * no tax field, and a rate invented here would be a number on a receipt that
 * nothing else in the system agrees with.
 *
 * The cart is not a checkout. A cart holds what a shopper is considering, on this
 * device, and the shop cannot confirm a line until the order is written — which
 * is why the CTA is the only thing here that spends anything, and why it goes to
 * the checkout rather than placing an order from this page.
 */

import type { ReactNode } from 'react';

import { Button } from '@/components/common/Button';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { CartTotals, AppliedPromo } from '@/features/cart/cart.types';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  totals: CartTotals;
  promo: AppliedPromo | null;
  /** The checkout goes here; a component may be passed instead of a handler. */
  onCheckout: () => void;
  /** The promo form, which belongs with the figures it changes. */
  children?: ReactNode;
  /** Warnings from the re-validation, above the button that would spend money. */
  notices?: ReactNode;
  /** False while something in the basket is wrong, so nothing is charged blindly. */
  checkoutEnabled?: boolean;
  className?: string;
};

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

export function CartSummary({
  totals,
  promo,
  onCheckout,
  children,
  notices,
  checkoutEnabled = true,
  className,
}: Props) {
  const freeDelivery = totals.shipping === 0 && totals.subtotal > 0;

  return (
    <section
      aria-labelledby="cart-summary-heading"
      className={cn('rounded-card border border-border bg-surface p-5', className)}
    >
      <h2 id="cart-summary-heading" className="text-lg font-semibold text-ink-900">
        {strings.cart.summaryHeading}
      </h2>

      <dl className="mt-4 flex flex-col gap-3">
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
          value={freeDelivery ? strings.cart.shippingFree : formatPrice(totals.shipping)}
          tone={freeDelivery ? 'credit' : 'default'}
        />

        <div className="mt-1 border-t border-border pt-3">
          <Row label={strings.cart.total} value={formatPrice(totals.total)} tone="total" />
        </div>
      </dl>

      <p className="mt-3 text-xs text-ink-500">{strings.cart.checkoutNote}</p>

      {children ? <div className="mt-5 border-t border-border pt-5">{children}</div> : null}

      {notices}

      <Button
        onClick={onCheckout}
        disabled={!checkoutEnabled}
        className="mt-5 w-full py-3 text-base"
      >
        {strings.actions.checkout}
      </Button>

      <p className="mt-4 text-center text-xs text-ink-500">{strings.cart.secureNote}</p>

      {/* The badges are a statement about the payment methods the API accepts,
          written as words rather than as card logos this store cannot claim. */}
      <ul className="mt-3 flex flex-wrap justify-center gap-2">
        {strings.cart.paymentBadges.map((badge) => (
          <li
            key={badge}
            className="rounded-control border border-border px-2.5 py-1 text-xs font-medium text-ink-600"
          >
            {badge}
          </li>
        ))}
      </ul>
    </section>
  );
}
