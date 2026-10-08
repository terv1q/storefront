/**
 * Cart shapes.
 *
 * The cart lives in the browser only. It stores what the shopper needs to see —
 * a name, a price, a picture — plus the ids checkout requires. Prices here are
 * for display and for the subtotal the mini-cart and the cart page show; the
 * server recomputes every price and total when the order is placed, so a stale
 * copy of the price in storage can never change what is charged.
 *
 * Money is an integer number of tiyin, as everywhere else in the client.
 */

export type CartItem = {
  productId: string;
  /**
   * The options the shopper chose, by id. Empty when the product has none.
   *
   * A list rather than one id because a product can offer more than one group of
   * options: a shirt has a size *and* a colour, and two shirts of the same size in
   * different colours are two lines. The checkout payload carries one of these —
   * the order stores the product — but the cart's identity is the whole choice.
   */
  variantIds: string[];
  name: string;
  /** Product slug, for the link back to the product page. */
  slug: string;
  /** Minor units, including the variants' price differences. */
  unitPrice: number;
  /** Minor units before an option was chosen, for showing what was saved. */
  compareAtPrice: number | null;
  imageUrl: string | null;
  quantity: number;
  /** Stock at the time the item was added, or `null` when it was unknown. */
  stock: number | null;
  /** Chosen options as shown, for example `Size: M · Colour: Navy`. */
  variantLabel: string | null;
};

/** The parts of a line that identify it, for store actions and React keys. */
export type CartLineRef = Pick<CartItem, 'productId' | 'variantIds'>;

/**
 * A promo code that has been accepted for this basket.
 *
 * The whole rule is kept, not just the amount: the shopper goes on editing the
 * basket after applying a code, and the cart prices the discount again for every
 * change with `discountFor` in `cart.totals.ts`. The server prices it once more
 * at checkout, from the database, and that is the amount charged.
 */
export type AppliedPromo = {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  /** Whole percent for `PERCENT`, minor units for `FIXED`. */
  discountValue: number;
  /** Minor units the basket has to reach for the code to apply. */
  minSubtotal: number;
  /** Ceiling in minor units for a percentage, or `null` for no ceiling. */
  maxDiscount: number | null;
  /** ISO date the code stops working, or `null` for a code with no end date. */
  expiresAt: string | null;
};

/** What the summary card adds up. All money in minor units. */
export type CartTotals = {
  /** Total quantity, not the number of lines. */
  itemCount: number;
  subtotal: number;
  /** What the lines save against their compare-at prices. A record, not a deduction. */
  savings: number;
  /** Minor units the applied code takes off, or `0` when no code is applied. */
  promoDiscount: number;
  /** Minor units. Zero when delivery is free. */
  shipping: number;
  /** `subtotal - promoDiscount + shipping`. */
  total: number;
};

/** The chosen options as a stable, order-independent string. */
function selectionKey(variantIds: readonly string[]): string {
  return [...variantIds].sort().join(',');
}

/** Stable identity of a cart line: the same product in two choices is two lines. */
export function cartItemKey(item: Pick<CartItem, 'productId' | 'variantIds'>): string {
  return `${item.productId}:${selectionKey(item.variantIds)}`;
}

/** Keys are compared as strings, so two lines never collide on a separator. */
export function sameCartLine(a: CartItem, b: CartLineRef): boolean {
  return a.productId === b.productId && selectionKey(a.variantIds) === selectionKey(b.variantIds);
}
