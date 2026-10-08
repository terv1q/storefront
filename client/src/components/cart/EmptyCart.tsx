/**
 * The cart with nothing in it.
 *
 * An empty basket is the one page in a shop that has to answer "what now?" with
 * something to click, so it carries three ways back into the catalog rather than
 * one: the storefront, the top of the category tree, and — for a shopper who has
 * looked at products before — the ones they looked at, which is the shelf most
 * likely to be relevant and the only one that costs no request.
 *
 * Nothing new is asked of the API for this. The category tree is already the one
 * the header draws and is cached for half an hour, and the recently-viewed shelf
 * is the store the home page's recommendations already read; building a second
 * source for the same two things would be a second thing to keep in step.
 *
 * The rail is only drawn when this device remembers something, because an empty
 * shelf under a heading is a worse answer than no shelf.
 */

import { ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { ProductRail, ProductRailItem } from '@/components/home/ProductRail';
import { readRecentlyViewed } from '@/features/products/recentlyViewed';
import { useCategoryTree } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** How many categories an empty cart offers, and how many remembered products. */
const CATEGORY_LIMIT = 4;
const RECENT_LIMIT = 8;

const HEADING_ID = 'empty-cart-recent-heading';

const linkClass =
  'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const primaryLinkClass = cn(linkClass, 'bg-brand-700 text-brand-50 hover:bg-brand-600');
const secondaryLinkClass = cn(
  linkClass,
  'border border-border text-ink-900 hover:bg-surface-muted',
);

export function EmptyCart({ className }: { className?: string }) {
  // Read once, when the page first renders: nothing on this page writes to the
  // shelf, so a subscription would be a listener that never fires.
  const [remembered] = useState(readRecentlyViewed);
  const tree = useCategoryTree();
  const categories = (tree.categories ?? []).slice(0, CATEGORY_LIMIT);

  // Products the shopper has already seen are the ones already in the cart's
  // neighbourhood, so they are not offered the product they were just looking at.
  const recent = remembered.slice(0, RECENT_LIMIT);

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <EmptyState Icon={ShoppingCart} title={strings.cart.empty} body={strings.cart.emptyHint}>
        <Link to={paths.home} className={primaryLinkClass}>
          {strings.cart.emptyCta}
        </Link>

        {categories.map((category) => (
          <Link key={category.id} to={paths.category(category.slug)} className={secondaryLinkClass}>
            {category.name}
          </Link>
        ))}
      </EmptyState>

      {recent.length > 0 ? (
        <ProductRail
          headingId={HEADING_ID}
          title={strings.cart.emptyRecentHeading}
          hint={strings.cart.emptyRecentHint}
        >
          {recent.map((product) => (
            <ProductRailItem key={product.id} product={product} />
          ))}
        </ProductRail>
      ) : null}
    </div>
  );
}
