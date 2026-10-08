/**
 * The secondary navigation row, and the copy the mobile drawer repeats.
 *
 * Every entry here points at something the API can actually answer: a category
 * that exists in the tree, or a product-list filter the catalog accepts. A link
 * that cannot be honoured is worse than a missing link, so two of the labels a
 * store this size usually shows — Bestsellers and Weekly Flash Offers — are left
 * out. There is no sales-count sort to rank bestsellers by, and a flash offers
 * link would be the same `onSale` filter the row already carries under a name
 * that promises a deadline the catalog does not have. Adding either is one entry
 * below once the data exists.
 *
 * These are functions rather than constants because the labels are copy: a
 * constant would be evaluated once, at import, in whichever language the page
 * happened to load in, and would keep saying it after the visitor switched.
 */

import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

export type QuickLink = {
  key: string;
  label: string;
  to: string;
};

/**
 * Deals is a real category, so it links to its page. The other three are list
 * filters, which the search page reads from the query string.
 */
export function getQuickLinks(): readonly QuickLink[] {
  return [
    { key: 'deals', label: strings.nav.deals, to: paths.category('deals') },
    { key: 'new-arrivals', label: strings.nav.newArrivals, to: `${paths.search}?sort=newest` },
    { key: 'top-rated', label: strings.nav.topRated, to: `${paths.search}?sort=rating` },
    { key: 'on-sale', label: strings.nav.onSale, to: `${paths.search}?onSale=true` },
  ];
}

/** Account links the mobile drawer repeats, so the bottom bar is not the only way in. */
export function getAccountLinks(): readonly QuickLink[] {
  return [
    { key: 'orders', label: strings.nav.orders, to: paths.orders },
    { key: 'wishlist', label: strings.nav.wishlist, to: paths.wishlist },
    { key: 'cart', label: strings.nav.cart, to: paths.cart },
  ];
}
