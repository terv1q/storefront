/**
 * A product shelf: one catalog query, drawn as a rail.
 *
 * The rail knows how to scroll and how to look; this knows what to ask for. The
 * two are separate because the home page shows three shelves that differ only in
 * their query and their copy, and because the recommendations section draws the
 * same rail from a different source entirely.
 *
 * `limit` is sent to the API rather than applied here, so the shelf asks for the
 * ten products it will show instead of fetching a page and discarding most of it.
 */

import { ProductRail, ProductRailItem, ProductRailSkeleton } from '@/components/home/ProductRail';
import { RAIL_LIMIT } from '@/config/home';
import { useProducts } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import type { ProductListQuery } from '@/types/product';

type Props = {
  headingId: string;
  title: string;
  hint?: string;
  action?: { label: string; to: string };
  query: ProductListQuery;
  limit?: number;
};

export function ProductShelf({ headingId, title, hint, action, query, limit = RAIL_LIMIT }: Props) {
  const { products, isLoading, isError, errorMessage, refetch } = useProducts({ ...query, limit });

  return (
    <ProductRail
      headingId={headingId}
      title={title}
      hint={hint}
      action={action}
      isLoading={isLoading}
      // A failed shelf keeps its heading and says what happened, because a rail
      // is a category of its own — "new arrivals" — and its absence would read
      // as "there are none" rather than "this did not load".
      errorMessage={isError ? (errorMessage ?? strings.errors.generic) : null}
      onRetry={refetch}
    >
      {isLoading || !products ? (
        <ProductRailSkeleton count={4} />
      ) : (
        products.map((product, index) => (
          <ProductRailItem key={product.id} product={product} priority={index < 2} />
        ))
      )}
    </ProductRail>
  );
}
