/**
 * The grid's loading state.
 *
 * Drawn with the grid's own column classes and the card's own skeleton, so the
 * placeholders occupy exactly the space the products will and nothing moves when
 * they arrive. `count` is the number the caller expects, which is why a section
 * that asks the API for six products shows six boxes rather than a generic
 * spinner.
 *
 * The whole block is `aria-hidden` and the section that owns it announces the
 * wait once, in words, rather than forty times as forty empty cards.
 */

import { ProductCardSkeleton } from '@/components/product/ProductCard';
import { productGridColumns, productListColumns } from '@/components/product/ProductGrid';
import { cn } from '@/lib/cn';

type Props = {
  count: number;
  /** The layout the grid will arrive in, so the placeholder is the same shape. */
  layout?: 'grid' | 'list';
  className?: string;
};

export function ProductGridSkeleton({ count, layout = 'grid', className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={cn(layout === 'list' ? productListColumns : productGridColumns, className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} layout={layout} />
      ))}
    </div>
  );
}
