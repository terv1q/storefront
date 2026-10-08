/**
 * The product grid.
 *
 * A list of articles, one column on a phone and four on a wide screen. The
 * column count is the only thing that changes with width; the card itself keeps
 * its own proportions, so the square picture and the row of controls below it
 * are the same shape at every size and nothing reflows when the window is
 * resized.
 *
 * The first `priorityCount` cards load their picture eagerly. Those are the ones
 * usually above the fold, and they are what the browser would otherwise discover
 * last, because a lazy image inside a list is deferred until layout has already
 * happened.
 */

import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/cn';
import type { Product } from '@/types/product';

/**
 * The column layout, exported so the skeleton is drawn with the same classes.
 * A placeholder that guessed at the breakpoints would be a second place to
 * change them, and the first one to fall out of step.
 */
export const productGridColumns =
  'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

/** The list layout: one card per row, each drawn as a row rather than a tile. */
export const productListColumns = 'grid grid-cols-1 gap-3';

type Props = {
  products: readonly Product[];
  /** How many of the leading cards load their picture eagerly. */
  priorityCount?: number;
  /**
   * How the cards are drawn. The same value goes to every card, so the grid and
   * the list are one switch rather than a prop per card that could disagree with
   * its neighbour.
   */
  layout?: 'grid' | 'list';
  className?: string;
};

export function ProductGrid({ products, priorityCount = 0, layout = 'grid', className }: Props) {
  return (
    <ul className={cn(layout === 'list' ? productListColumns : productGridColumns, className)}>
      {products.map((product, index) => (
        <li key={product.id} className="flex">
          <ProductCard
            product={product}
            priority={index < priorityCount}
            layout={layout}
            className="w-full"
          />
        </li>
      ))}
    </ul>
  );
}
