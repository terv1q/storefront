/**
 * Checking the basket against the catalog.
 *
 * A cart is a copy: it holds the price and the stock a product had when it was
 * added, and both can move while it sits in a browser. The cart page therefore
 * re-reads its products when it opens and compares them with the lines, which is
 * the only moment the shopper is looking at the basket and can act on the
 * difference.
 *
 * The comparison is a pure function over two arrays, so what counts as a problem
 * is stated in one place and can be read without a browser. It reports; it does
 * not repair. Every difference has more than one reasonable answer — pay the new
 * price or drop the line, take what is left or take none — and choosing for the
 * shopper would be the cart deciding to spend their money differently than they
 * asked. So each problem travels with the line it belongs to and the numbers
 * needed to describe it, and the page offers the fix.
 *
 * What it cannot see: the stock of a single option. The listing carries the
 * product's stock and not each variant's, so a line with options chosen is
 * checked against the product, which is the ceiling the variant cannot exceed.
 * The checkout, which reads every row itself, is what finally refuses a line
 * that has gone.
 */

import type { Product } from '@/types/product';

import { cartItemKey, type CartItem } from './cart.types';

/** Why a line cannot simply be bought as it stands. */
export type CartIssueKind =
  /** The product is no longer on sale. */
  | 'inactive'
  /** Nothing is left of it. */
  | 'out_of_stock'
  /** Less is left than the line asks for. */
  | 'insufficient_stock'
  /** The price is no longer what the line holds. */
  | 'price_changed';

export type CartIssue = {
  /** Identifies the line, for a React key and for the action that fixes it. */
  key: string;
  line: CartItem;
  kind: CartIssueKind;
  /** What the catalog says now, when the issue is about the price. */
  currentPrice: number | null;
  /** What is left now, when the issue is about stock. */
  availableStock: number | null;
};

/**
 * Every product the cart asks about is answered, but the listing only returns
 * what is still on sale — so a line with no product in the answer is a product
 * that has been switched off, and that is an issue too.
 */
export function findCartIssues(
  items: readonly CartItem[],
  products: readonly Product[],
): CartIssue[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  const issues: CartIssue[] = [];

  for (const line of items) {
    const key = cartItemKey(line);
    const product = byId.get(line.productId);

    if (product === undefined) {
      issues.push({
        key,
        line,
        kind: 'inactive',
        currentPrice: null,
        availableStock: null,
      });
      continue;
    }

    if (product.stock <= 0) {
      issues.push({ key, line, kind: 'out_of_stock', currentPrice: null, availableStock: 0 });
      continue;
    }

    if (product.stock < line.quantity) {
      issues.push({
        key,
        line,
        kind: 'insufficient_stock',
        currentPrice: null,
        availableStock: product.stock,
      });
    }

    if (product.price !== line.unitPrice) {
      issues.push({
        key,
        line,
        kind: 'price_changed',
        currentPrice: product.price,
        availableStock: null,
      });
    }
  }

  return issues;
}

/**
 * The lines with today's price and today's stock, for the one-click fixes the
 * page offers. A line whose product is gone is left as it is: it cannot be
 * repriced, and its own action is to remove it.
 */
export function withCurrentPrices(
  items: readonly CartItem[],
  products: readonly Product[],
): CartItem[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return items.map((line) => {
    const product = byId.get(line.productId);

    if (product === undefined) {
      return line;
    }

    return {
      ...line,
      name: product.name,
      slug: product.slug,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.image?.url ?? line.imageUrl,
      stock: product.stock,
      quantity: Math.max(1, Math.min(line.quantity, product.stock)),
    };
  });
}
