/**
 * Product catalog shapes. These mirror the database models so the client and
 * the server never disagree about a field name.
 *
 * Money fields (`price`, `compareAtPrice`, `priceDelta`) are integers in minor
 * units (tiyin) and are only converted for display by `utils/formatPrice`.
 * Dates are ISO 8601 strings.
 */

import type { PaginationParams } from '@/types/api';

/** Sort values the product list endpoint accepts. */
export type ProductSort = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'newest';

export type Brand = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  /** Parent category for subcategories, `null` at the top level. */
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  /** Number of active products, present on the tree endpoint. */
  productCount?: number;
  /** Child categories, present on the tree endpoint. */
  children?: Category[];
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type ProductVariant = {
  id: string;
  productId: string;
  /** Option group, for example `Size` or `Color`. */
  name: string;
  value: string;
  /** Minor-unit difference against the base product price, may be negative. */
  priceDelta: number;
  stock: number;
  sku: string;
};

export type ProductSpec = {
  id: string;
  productId: string;
  /** Spec group, for example `General` or `Dimensions`. */
  group: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type ReviewImage = {
  id: string;
  url: string;
  sortOrder: number;
};

export type Review = {
  id: string;
  productId: string;
  userId: string;
  /** Whole number from 1 to 5. */
  rating: number;
  title: string | null;
  body: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  /** Display name of the reviewer, added by the API. */
  authorName: string;
  /** True when the author has a delivered order containing this product. */
  isVerifiedPurchase: boolean;
  /** How many customers found it helpful, and how many did not. */
  helpfulYes: number;
  helpfulNo: number;
  /** The viewer's own vote: `1`, `-1`, or `0` for no opinion or nobody signed in. */
  myVote: -1 | 0 | 1;
  images: ReviewImage[];
};

/** Product as it appears in list results. */
export type Product = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  currency: string;
  /** Minor units. */
  price: number;
  /** Minor units, `null` when the product is not discounted. */
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  categoryId: string;
  brandId: string | null;
  createdAt: string;
  updatedAt: string;
  /** First image, added by the API so cards do not need a second request. */
  image?: ProductImage | null;
  /** Second image, for the hover swap a card performs. `null` when there is only one. */
  hoverImage?: ProductImage | null;
  /**
   * Whether the product has options. A card offers an instant add when it does
   * not, and links to the product page when it does, because the base price is
   * not necessarily the price of the option the shopper wants.
   */
  hasVariants?: boolean;
};

/** Product with everything the detail page renders. */
export type ProductDetail = Product & {
  description: string;
  images: ProductImage[];
  variants: ProductVariant[];
  specs: ProductSpec[];
  category: Category | null;
  brand: Brand | null;
};

/** Query parameters for the product list, catalog, and search endpoints. */
export type ProductListQuery = PaginationParams & {
  /** Category slug. */
  category?: string;
  /** Free-text search term. */
  q?: string;
  /** Brand slug. */
  brand?: string;
  /** Minor units. */
  minPrice?: number;
  /** Minor units. */
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  /**
   * Variant attributes to narrow by, each written `Name:Value`.
   *
   * Repeated rather than comma-joined because an attribute name or value could
   * contain a comma, and because the api client already repeats array values in
   * the query string. The halves are the English name and value the catalog
   * stores — the same pair the facets endpoint publishes — so the text the
   * shopper reads and the text the query matches on stay separate.
   */
  attr?: string[];
  /**
   * An exact set of products, by id.
   *
   * A shopper who has not signed in keeps their saved products in the browser as
   * ids and nothing else, so the page that draws them asks the catalog for
   * exactly those products. It is a listing like any other: only products still
   * on sale come back, in the language being browsed, at today's price.
   */
  ids?: string[];
  sort?: ProductSort;
};
