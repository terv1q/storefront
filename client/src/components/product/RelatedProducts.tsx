/**
 * What to look at next.
 *
 * Two shelves. The first is the catalog's own answer — products from the same
 * category, then the same brand — and the second is what this device has already
 * looked at, which is the only personalisation the store has: nothing here knows
 * who the shopper is, and the recommendations shelf elsewhere is built the same
 * way.
 *
 * Both shelves are the same rail, and both stand still. Nothing here moves on its
 * own: a shelf the shopper is reading is not a shelf they can scroll to a
 * particular card. The two rows differ only in where their products come from.
 *
 * A shelf that failed says so and offers a retry, while an empty one hides
 * itself: a shopper who has looked at exactly one product and is looking at it
 * now has no history, and a heading over a row of nothing reads as a fault.
 */

import { useEffect, useState } from 'react';

import { ProductRail, ProductRailItem, ProductRailSkeleton } from '@/components/home/ProductRail';
import { readRecentlyViewed } from '@/features/products/recentlyViewed';
import { RELATED_LIMIT } from '@/features/products/products.queries';
import { useRelatedProducts } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';
import type { Product, ProductDetail } from '@/types/product';

import { ProductCard } from './ProductCard';

/** How many remembered products the history row shows. */
const HISTORY_LIMIT = 8;

/** What this device has looked at, newest first, minus the product being read. */
function useHistory(currentId: string): Product[] {
  const [history, setHistory] = useState<Product[]>([]);

  useEffect(() => {
    setHistory(readRecentlyViewed());
  }, [currentId]);

  return history.filter((product) => product.id !== currentId).slice(0, HISTORY_LIMIT);
}

type Props = {
  /**
   * The product being read, which its own history row leaves out. It is the
   * detail rather than the summary because the shelf links to the category the
   * product belongs to, and only the detail carries it.
   */
  product: ProductDetail;
  className?: string;
};

export function RelatedProducts({ product, className }: Props) {
  const related = useRelatedProducts(product.slug, RELATED_LIMIT);
  const history = useHistory(product.id);

  const relatedPath = product.category ? paths.category(product.category.slug) : paths.search;

  return (
    <div className={className}>
      {related.isError || (related.products?.length ?? 0) > 0 || related.isLoading ? (
        <ProductRail
          headingId="related-heading"
          title={strings.productPage.related.heading}
          hint={strings.productPage.related.hint}
          action={{ label: strings.actions.seeAll, to: relatedPath }}
          isLoading={related.isLoading}
          errorMessage={
            related.isError ? (related.errorMessage ?? strings.productPage.related.failed) : null
          }
          onRetry={related.refetch}
        >
          {related.isLoading ? (
            <ProductRailSkeleton count={4} />
          ) : (
            (related.products ?? []).map((item) => <ProductRailItem key={item.id} product={item} />)
          )}
        </ProductRail>
      ) : null}

      {history.length > 0 ? (
        <section aria-labelledby="history-heading" className="mt-12">
          <h2 id="history-heading" className="text-lg font-semibold text-ink-900">
            {strings.productPage.recentlyViewed.heading}
          </h2>
          <p className="mt-1 text-sm text-ink-500">{strings.productPage.recentlyViewed.hint}</p>

          <ul className="mt-4 flex gap-4 overflow-x-auto pb-2 p-0 [scrollbar-width:thin]">
            {history.map((item) => (
              <li key={item.id} className="w-44 shrink-0 sm:w-48">
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
