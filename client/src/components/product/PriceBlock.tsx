/**
 * What it costs.
 *
 * The price of the current choice, what it cost before if it is discounted, what
 * that saves, and how the amount divides into monthly payments.
 *
 * The percentage badge and the saving in money are both computed from the two
 * prices every time the block is drawn, so neither can outlive the discount it
 * describes. The money is the more useful of the two and the percentage is the
 * more legible, which is why both are there rather than one.
 *
 * The instalment tags come from the store's published schedule rather than from a
 * percentage written into this file, and the note under them says the split is
 * confirmed at checkout. That sentence is not decoration: this storefront cannot
 * see a bank's decision, and an offer drawn as a fact would be a promise nobody
 * here can keep. A product too cheap for a plan is simply not offered it — no
 * greyed-out tag advertising a term the shopper cannot have.
 */

import { installmentQuotes } from '@/config/payments';
import { discountPercent } from '@/features/products/discount';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  /** The current choice's price in minor units, options included. */
  price: number;
  /** The price before the discount, in minor units, or `null` when there is none. */
  compareAtPrice: number | null;
  currency: string;
  className?: string;
};

export function PriceBlock({ price, compareAtPrice, currency, className }: Props) {
  const percent = discountPercent({ price, compareAtPrice });
  const saving = compareAtPrice !== null && compareAtPrice > price ? compareAtPrice - price : null;
  const quotes = installmentQuotes(price);

  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={cn(
            'text-display-sm font-semibold',
            percent !== null ? 'text-sale-600' : 'text-ink-900',
          )}
        >
          {formatPrice(price, { currency })}
        </span>

        {compareAtPrice !== null && percent !== null ? (
          <span className="text-lg text-ink-500 line-through">
            {formatPrice(compareAtPrice, { currency })}
          </span>
        ) : null}

        {saving !== null ? (
          <span className="rounded-control bg-sale-600 px-2 py-0.5 text-xs font-semibold text-white">
            {percent !== null ? `-${percent}% · ` : ''}
            {strings.productPage.price.save(formatPrice(saving, { currency }))}
          </span>
        ) : null}
      </div>

      {/* The drawing of a price is not a price, so the sentence it stands for is
          what is read: "Now X, was Y" — or just the price, when nothing is cut. */}
      <span className="sr-only">
        {compareAtPrice !== null && percent !== null
          ? `${strings.product.priceNow(formatPrice(price, { currency }))}, ${strings.product.priceWas(formatPrice(compareAtPrice, { currency }))}`
          : strings.product.priceNow(formatPrice(price, { currency }))}
      </span>

      {quotes.length > 0 ? (
        <div className="mt-4 rounded-card border border-border bg-surface-muted p-3">
          <p className="text-xs font-semibold tracking-wide text-ink-600 uppercase">
            {strings.productPage.price.installment.heading}
          </p>

          <ul className="mt-2 flex flex-wrap gap-2 p-0">
            {quotes.map((quote) => (
              <li
                key={quote.months}
                className="rounded-control border border-border bg-surface px-2 py-1 text-xs text-ink-700"
              >
                {strings.productPage.price.installment.plan(
                  quote.months,
                  formatPrice(quote.monthlyMinor, { currency }),
                )}
              </li>
            ))}
          </ul>

          <p className="mt-2 text-xs text-ink-500">{strings.productPage.price.installment.note}</p>
        </div>
      ) : null}
    </div>
  );
}
