/**
 * The recommendations shelf.
 *
 * Two sources, one rail. When this device has seen products before, the shelf
 * shows them — in the order they were last opened, with the most recent first.
 * When it has not, the shelf falls back to the best-rated products in the
 * catalog and says so, rather than showing an empty row or a heading with
 * nothing under it.
 *
 * The storage is read once, when the section first renders. It cannot change
 * while the home page is open — nothing on this page writes to it, since it is
 * written when a product page is opened — so subscribing to it would be a
 * listener that never fires.
 *
 * The shelf is rendered through the same rail and the same cards as the catalog
 * shelves above it. A product seen in "picked for you" is the same card as the
 * one in "new arrivals", including its heart, its quick-add, and its cart count.
 *
 * Nothing writes to that store yet. `rememberProduct` is called by the product
 * page, which is still a placeholder, so today the shelf always takes the
 * fallback branch. It is written the other way round on purpose: the reader
 * exists and the writer is one line in a page that is not built, rather than the
 * other way round, which would be a store nobody reads.
 */

import { useState } from 'react';

import { ProductRail, ProductRailItem } from '@/components/home/ProductRail';
import { ProductShelf } from '@/components/home/ProductShelf';
import { RECOMMENDATION_LIMIT } from '@/config/home';
import { readRecentlyViewed } from '@/features/products/recentlyViewed';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

const HEADING_ID = 'home-recommendations-heading';

/** What the shelf asks for when nothing has been looked at yet. */
const FALLBACK_QUERY = { sort: 'rating' as const };

export function Recommendations() {
  const [remembered] = useState(readRecentlyViewed);

  if (remembered.length === 0) {
    return (
      <ProductShelf
        headingId={HEADING_ID}
        title={strings.home.recommendationsHeading}
        hint={strings.home.recommendationsFallbackHint}
        action={{ label: strings.home.railAll, to: paths.search }}
        query={FALLBACK_QUERY}
      />
    );
  }

  const shown = remembered.slice(0, RECOMMENDATION_LIMIT);

  return (
    <ProductRail
      headingId={HEADING_ID}
      title={strings.home.recommendationsHeading}
      hint={strings.home.recommendationsHint}
    >
      {shown.map((product) => (
        <ProductRailItem key={product.id} product={product} />
      ))}
    </ProductRail>
  );
}
