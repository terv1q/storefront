/**
 * What the product is, above the price.
 *
 * The trail, the name, the brand, the rating, the article number, and whether it
 * can be bought — in that order, because that is the order a shopper checks them
 * in: where am I, what is it, who makes it, is it any good, which one exactly,
 * can I have it.
 *
 * The rating is a link to the reviews rather than a number to read. It is the one
 * place on the page where "4.6 from 217 reviews" is a question — *from whom, and
 * saying what* — and the answer is a tab further down, so the summary goes there.
 * It scrolls rather than navigates, because the reviews are on the same page; the
 * anchor is the tab's panel id, set by the tabs component.
 *
 * The brand has no page of its own in this store, so following it runs the search
 * the shopper is already able to run by hand — every product of that brand, from
 * the filter the search page already offers. The alternative would be a link that
 * does nothing, and a brand name that looks like a link but is not one is worse
 * than a plain word.
 *
 * The stock line and the article number follow the chosen options, not the base
 * product: an article number that does not change when the size does would be
 * wrong for every shopper who chose anything.
 */

import { Link } from 'react-router-dom';

import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { ProductDetail } from '@/types/product';

import { Stars } from './Stars';

/** Stock at or below which the page says how few are left rather than just "in stock". */
const LOW_STOCK = 5;

type Props = {
  product: ProductDetail;
  /** The trail below the home entry, built by the page. */
  trail: readonly BreadcrumbItem[];
  /** The article number of the current choice, which the options change. */
  sku: string;
  /** How many of the current choice are left. */
  stock: number;
  /** The id of the reviews panel, which the rating links to. */
  reviewsId: string;
  className?: string;
};

export function ProductInfo({ product, trail, sku, stock, reviewsId, className }: Props) {
  const rated = product.reviewCount > 0;

  const stockTone =
    stock === 0 ? 'text-danger-600' : stock <= LOW_STOCK ? 'text-warning-600' : 'text-success-600';

  const stockLabel =
    stock === 0
      ? strings.product.outOfStock
      : stock <= LOW_STOCK
        ? strings.product.lowStock(stock)
        : strings.product.inStock;

  return (
    <div className={cn('min-w-0', className)}>
      <Breadcrumbs items={trail} className="mb-3" />

      <h1 className="text-display-sm font-semibold text-ink-900">{product.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        {product.brand ? (
          <Link
            to={`${paths.search}?brand=${encodeURIComponent(product.brand.slug)}`}
            aria-label={strings.productPage.brandLink(product.brand.name)}
            className="font-medium text-brand-700 underline-offset-4 hover:underline"
          >
            {product.brand.name}
          </Link>
        ) : null}

        {rated ? (
          <a
            href={`#${reviewsId}`}
            aria-label={strings.productPage.ratingJump(product.reviewCount)}
            className="inline-flex items-center gap-1.5 text-ink-600 underline-offset-4 hover:text-brand-700 hover:underline"
          >
            <Stars rating={product.rating} size={16} />
            <span className="font-medium text-ink-900">{product.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <span>{product.reviewCount}</span>
          </a>
        ) : (
          <span className="text-ink-500">{strings.product.noRating}</span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-control bg-ink-100 px-2 py-1 font-mono text-xs text-ink-600">
          {strings.productPage.sku(sku)}
        </span>

        <span className={cn('text-sm font-medium', stockTone)}>{stockLabel}</span>
      </div>

      {product.shortDescription ? (
        <p className="mt-4 text-sm text-ink-600">{product.shortDescription}</p>
      ) : null}
    </div>
  );
}
