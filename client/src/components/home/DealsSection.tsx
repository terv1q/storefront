/**
 * The deals section.
 *
 * Everything on this shelf has a `compareAtPrice` above its price, which is what
 * the `onSale` filter selects. The percentage is worked out from those two
 * numbers rather than stored, so the badge and the struck-through price can
 * never disagree.
 *
 * There is no countdown here, and that is deliberate. A countdown is a claim
 * that something ends at a particular moment, and nothing in this catalog says
 * when a discount ends: `compareAtPrice` records that a price was lowered, not
 * until when. A timer would therefore be a number the store made up, counting
 * down to a deadline that does not exist. What actually limits a deal is stock,
 * and stock is real, so that is what the section shows instead — how many are
 * left, and a bar comparing it with the fullest shelf on the page.
 *
 * The bar is drawn against the largest stock among the deals shown, not against
 * the stock the product started with, because the catalog does not record that
 * either. It is a comparison between what is on screen, and the number beside it
 * carries the fact on its own for anyone who cannot see the bar or does not
 * trust a scale without units.
 */

import { Flame } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/common/Skeleton';
import { SectionHeading } from '@/components/home/SectionHeading';
import { DEALS_LIMIT } from '@/config/home';
import { discountPercent } from '@/features/products/discount';
import { useProducts } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

/** The shelf the deals are asked for: discounted, newest first among themselves. */
const DEALS_QUERY = { onSale: true, sort: 'newest' as const, limit: DEALS_LIMIT };

function DealTile({ product, fullest }: { product: Product; fullest: number }) {
  const off = discountPercent(product);
  const path = paths.product(product.slug);
  const image = product.image;
  // A bar needs a denominator. The fullest shelf on the page is the only one
  // this page knows, so it is the one used.
  const share = fullest > 0 ? Math.round((product.stock / fullest) * 100) : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface transition-shadow hover:shadow-raised">
      <Link
        to={path}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-4/3 overflow-hidden bg-surface-muted"
      >
        {image ? (
          <img
            src={image.url}
            alt=""
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}

        {off !== null ? (
          <span className="absolute top-2 left-2 rounded-control bg-sale-600 px-2 py-0.5 text-xs font-semibold text-white">
            -{off}%
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-medium text-ink-900">
          <Link to={path} className="line-clamp-2 hover:text-brand-700 hover:underline">
            {product.name}
          </Link>
        </h3>

        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold text-sale-600">
            {formatPrice(product.price, { currency: product.currency })}
          </span>
          {product.compareAtPrice !== null ? (
            <span className="text-sm text-ink-500 line-through">
              {formatPrice(product.compareAtPrice, { currency: product.currency })}
            </span>
          ) : null}
          {off !== null ? (
            <span className="sr-only">
              {strings.home.dealsSave(off)} —{' '}
              {strings.product.priceNow(formatPrice(product.price, { currency: product.currency }))}
            </span>
          ) : null}
        </p>

        <div className="mt-auto pt-2">
          <p className="flex items-center gap-1.5 text-xs font-medium text-warning-600">
            <Flame aria-hidden="true" size={14} />
            {strings.home.dealsLeft(product.stock)}
          </p>

          <span
            aria-hidden="true"
            className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
          >
            <span
              className={cn('block h-full rounded-full bg-warning-600')}
              style={{ width: `${Math.max(4, Math.min(100, share))}%` }}
            />
          </span>
          <span className="sr-only">{strings.home.dealsStockBar(product.stock, fullest)}</span>
        </div>
      </div>
    </article>
  );
}

export function DealsSection() {
  const { products, isLoading, isError } = useProducts(DEALS_QUERY);

  if (isError) {
    return null;
  }

  const fullest = Math.max(0, ...(products ?? []).map((product) => product.stock));

  return (
    <section aria-labelledby="home-deals-heading">
      <SectionHeading
        id="home-deals-heading"
        title={strings.home.dealsHeading}
        hint={strings.home.dealsHint}
        action={{ label: strings.home.dealsAll, to: `${paths.search}?onSale=true` }}
        className="mb-6"
      />

      {isLoading || !products ? (
        <>
          <span role="status" className="sr-only">
            {strings.loading.products}
          </span>
          <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: DEALS_LIMIT }, (_, index) => (
              <Skeleton key={index} variant="card" />
            ))}
          </div>
        </>
      ) : products.length === 0 ? (
        <div
          role="status"
          className="rounded-card border border-border bg-surface-muted p-8 text-center"
        >
          <p className="text-sm text-ink-600">{strings.home.dealsEmpty}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <DealTile key={product.id} product={product} fullest={fullest} />
          ))}
        </div>
      )}
    </section>
  );
}
