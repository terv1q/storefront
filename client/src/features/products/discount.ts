/**
 * The discount a product's `compareAtPrice` represents.
 *
 * It sits in its own module rather than beside the card that draws the badge,
 * for two reasons. It is arithmetic and not a component, so a file that exports
 * both is a file the development server cannot hot-reload without throwing the
 * whole module away. And the deals section prints the same number in a different
 * place, so the sum has one home rather than one per caller.
 *
 * The percentage is derived from the two prices every time it is shown. Nothing
 * stores it, so a badge and the struck-through price beside it cannot disagree.
 */

import type { Product } from '@/types/product';

/**
 * The whole-number percentage off, or `null` when the product is not discounted.
 *
 * `compareAtPrice` at or below the price is not a discount: it is either a
 * catalog entry that has not been cleaned up or a price rise, and neither should
 * be drawn as a saving.
 */
export function discountPercent(product: Pick<Product, 'price' | 'compareAtPrice'>): number | null {
  const { compareAtPrice } = product;

  if (compareAtPrice === null || compareAtPrice <= product.price) {
    return null;
  }

  return Math.round((1 - product.price / compareAtPrice) * 100);
}
