/**
 * One saved product.
 *
 * The row is a checkbox, the product card the rest of the app already draws, and
 * two actions under it. The card is reused rather than reimplemented, because a
 * saved product should look exactly like the same product in the catalog —
 * picture, badges, price, rating, and its own heart, which is how a shopper
 * takes it off the list from here as well.
 *
 * A product with options cannot be moved to the cart blind. The base price is a
 * real price, but it is not necessarily the price of the option the shopper
 * wanted, so the row's action is a link to the product page instead of a button
 * that would add the wrong line — the same rule the catalog card follows with
 * "choose options". Its checkbox is disabled for the same reason: a bulk move
 * that silently skipped it would be a bulk move that lied about what it did.
 *
 * The checkbox is a native `input` because a checkbox is what it is: it brings
 * the role, the keyboard behaviour, and the mixed state with it. Its label
 * carries the product's name, so a screen reader reads what is being selected
 * rather than a column of anonymous boxes.
 */

import { ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ProductCard } from '@/components/product/ProductCard';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { Product } from '@/types/product';

type Props = {
  product: Product;
  selected: boolean;
  onSelectChange: (productId: string, selected: boolean) => void;
  /** Adds the line to the cart and takes the product off the list. */
  onMoveToCart: (product: Product) => void;
  /** Takes the product off the list. */
  onRemove: (product: Product) => void;
  className?: string;
};

const actionClass =
  'inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export function WishlistItem({
  product,
  selected,
  onSelectChange,
  onMoveToCart,
  onRemove,
  className,
}: Props) {
  const needsChoice = product.hasVariants === true;

  return (
    <li className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-start gap-3">
        <label
          className={cn(
            'mt-3 grid h-5 w-5 shrink-0 place-content-center',
            needsChoice ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          <input
            type="checkbox"
            checked={selected}
            disabled={needsChoice}
            onChange={(event) => onSelectChange(product.id, event.target.checked)}
            className="h-4 w-4 accent-brand-700 disabled:opacity-50"
          />
          <span className="sr-only">{strings.wishlist.selectItem(product.name)}</span>
        </label>

        <ProductCard product={product} layout="list" className="min-w-0 flex-1" />
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-8">
        {needsChoice ? (
          <>
            <Link
              to={paths.product(product.slug)}
              className={cn(actionClass, 'bg-brand-700 text-brand-50 hover:bg-brand-600')}
            >
              {strings.wishlist.chooseOptions}
            </Link>
            <span className="text-xs text-ink-500">{strings.wishlist.needsChoice}</span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onMoveToCart(product)}
            className={cn(actionClass, 'bg-brand-700 text-brand-50 hover:bg-brand-600')}
          >
            <ShoppingCart aria-hidden="true" size={16} />
            {strings.wishlist.moveToCart}
          </button>
        )}

        <button
          type="button"
          onClick={() => onRemove(product)}
          className={cn(actionClass, 'text-ink-600 hover:bg-ink-100 hover:text-ink-900')}
        >
          <Trash2 aria-hidden="true" size={16} />
          {strings.wishlist.remove}
        </button>
      </div>
    </li>
  );
}
