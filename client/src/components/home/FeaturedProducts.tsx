/**
 * The featured grid: the products the store has chosen to put in front.
 *
 * The list is curated rather than computed — it is whatever carries `isFeatured`
 * — so this is the one home section whose contents are an editorial decision
 * rather than a consequence of sorting. `GET /api/products/featured` is what
 * serves it, and it is rated as slow-changing on the client, because a shop
 * changes its front page on purpose and not often.
 *
 * The section hides itself when the response fails or comes back empty. A
 * heading over an empty grid and an error panel in the middle of a shop front
 * are both worse than the section simply not being there: nothing below depends
 * on it, and the rest of the page is still worth reading.
 */

import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { SectionHeading } from '@/components/home/SectionHeading';
import { FEATURED_LIMIT } from '@/config/home';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

/** Cards in the first row or two load eagerly: they are usually above the fold. */
const PRIORITY_COUNT = 4;

export function FeaturedProducts() {
  const { products, isLoading, isError } = useFeaturedProducts(FEATURED_LIMIT);

  if (isError) {
    return null;
  }

  return (
    <section aria-labelledby="home-featured-heading">
      <SectionHeading
        id="home-featured-heading"
        title={strings.home.featuredHeading}
        hint={strings.home.featuredHint}
        action={{ label: strings.home.featuredAll, to: paths.search }}
        className="mb-6"
      />

      {isLoading || !products ? (
        <>
          <span role="status" className="sr-only">
            {strings.loading.products}
          </span>
          <ProductGridSkeleton count={FEATURED_LIMIT} />
        </>
      ) : products.length === 0 ? null : (
        <ProductGrid products={products} priorityCount={PRIORITY_COUNT} />
      )}
    </section>
  );
}
