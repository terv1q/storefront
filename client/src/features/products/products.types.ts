/**
 * Catalog types for the client data layer.
 *
 * The domain shapes already exist in `@/types/product` and are the same objects
 * the cards, the pages, and the server talk about, so they are re-exported here
 * rather than described a second time. What this file adds is the part that is
 * specific to talking to the catalog endpoints: the small envelopes the list,
 * related, featured, and reviews endpoints return.
 *
 * Money is an integer number of tiyin and dates are ISO strings, as everywhere
 * else in the client.
 */

import type { Paginated } from '@/types/api';
import type { Category, Product, Review } from '@/types/product';

export type {
  Brand,
  Category,
  Product,
  ProductDetail,
  ProductImage,
  ProductListQuery,
  ProductSort,
  ProductSpec,
  ProductVariant,
  Review,
  ReviewImage,
} from '@/types/product';
/** A page of catalog products, as `GET /api/products` returns it. */
export type ProductListPage = Paginated<Product>;

/** A category with its children and its product totals, as the tree returns it. */
export type CategoryNode = Category & {
  /** Active products in this category and in everything beneath it. */
  productCount: number;
  children: CategoryNode[];
};

/** One category with the chain of ancestors that leads to it. */
export type CategoryDetail = CategoryNode & {
  /** Root first, the category itself last. */
  breadcrumbs: CategoryNode[];
};

/** What the summary block draws. */
export type ReviewSummary = {
  /** The mean of the approved ratings, rounded to one decimal. `0` when there are none. */
  average: number;
  /** How many approved reviews there are. */
  total: number;
  /** How many of them come from a customer whose order was delivered. */
  verified: number;
  /** How many reviews each rating has, from five stars down to one. */
  distribution: { rating: number; count: number }[];
};

/** A page of reviews, with the summary drawn above them. */
export type ReviewPage = Paginated<Review> & {
  /**
   * The whole product's summary, not the filtered page's: a shopper who filtered
   * to one star still needs to see how the rest of the ratings fall, and a
   * distribution computed over the filtered set would show one bar at 100%.
   */
  summary: ReviewSummary;
};

/** `GET /api/products/related` and `/featured` answer with a bare list. */
export type ProductListResult = {
  items: Product[];
};

/** `GET /api/categories` answers with the whole tree. */
export type CategoryTreeResult = {
  items: CategoryNode[];
};

/** One brand present in a filtered set, with how many products it holds. */
export type BrandFacet = {
  slug: string;
  name: string;
  logoUrl: string | null;
  count: number;
};

/** One value of one variant attribute, with how many products offer it. */
export type AttributeFacetValue = {
  /** The English string the listing is filtered by. */
  value: string;
  /** The same value in the language being read. */
  label: string;
  count: number;
};

/** One variant attribute, with its values. */
export type AttributeFacet = {
  /** The English attribute name, sent back as the left half of `attr=`. */
  name: string;
  label: string;
  values: AttributeFacetValue[];
};

/**
 * What the filter panel can offer for a listing.
 *
 * `GET /api/products/facets` answers with this shape. It is computed from the
 * whole filtered set rather than from the page on screen, and deliberately
 * ignores the attribute filters themselves, so the counts are what the shopper
 * would get by clearing them.
 */
export type ProductFacets = {
  total: number;
  /** Minor units. `null` when nothing matches, which the panel reads as "no range to offer". */
  price: { min: number; max: number } | null;
  brands: BrandFacet[];
  attributes: AttributeFacet[];
};
