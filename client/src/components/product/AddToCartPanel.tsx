/**
 * The buttons under the choices.
 *
 * Add to cart, buy now, and save for later. All three act on the same two
 * decisions the panel above has already made — which options and how many — so
 * they belong together and none of them asks again.
 *
 * Buy now adds the line and goes straight to checkout, which is what "express"
 * can honestly mean in a store with no accounts required: the cart is kept, so a
 * shopper who arrives at checkout and decides not to pay finds what they picked
 * still there.
 *
 * The heart follows the card's rule: it is drawn for everybody and works for
 * everybody — a signed-in visitor's press goes to their account, and a visitor
 * who has not registered has the product kept in their browser.
 *
 * The confirmation is a line under the buttons rather than a floating toast. The
 * buttons do not move when it appears, it is announced through its `role`, and it
 * says what was added — which a corner notification covering the button the
 * shopper is about to press again does not.
 *
 * A sold-out product gets the one action that still means something: an address
 * to be told when it returns, which is the same dialog the sold-out card opens.
 */

import { Check, Heart, LoaderCircle, ShoppingCart, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAddToCart } from '@/features/cart/useAddToCart';
import { useWishlistState } from '@/features/wishlist/wishlist.queries';
import { useCart } from '@/hooks/useCart';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { ProductDetail } from '@/types/product';

import { NotifyMeDialog } from './NotifyMeDialog';

type Props = {
  product: ProductDetail;
  /** The current choice's price in minor units, options included. */
  price: number;
  /** How many of the current choice are left. */
  stock: number;
  /** The chosen option rows, which identify the cart line. */
  variantIds: readonly string[];
  /** The choice as a sentence, or `null` when the product has no options. */
  variantLabel: string | null;
  quantity: number;
  /** True when the product cannot be added right now. */
  disabled: boolean;
  className?: string;
};

export function AddToCartPanel({
  product,
  price,
  stock,
  variantIds,
  variantLabel,
  quantity,
  disabled,
  className,
}: Props) {
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useWishlistState();

  // The line this panel would add. The same hook serves the bar that repeats
  // this button below the fold, so both record the same choice.
  const { add, justAdded } = useAddToCart({
    productId: product.id,
    variantIds: [...variantIds],
    name: product.name,
    slug: product.slug,
    unitPrice: price,
    compareAtPrice: product.compareAtPrice,
    imageUrl: product.images[0]?.url ?? product.image?.url ?? null,
    stock,
    variantLabel,
    quantity,
  });

  const soldOut = stock <= 0;
  const saved = wishlist.isSaved(product.id);
  const wishlistPending = wishlist.isPending(product.id);

  const buyNow = () => {
    add();
    navigate(paths.checkout);
  };

  const toggleWishlist = () => {
    wishlist.toggle(product.id, product);
  };

  if (soldOut) {
    return (
      <div className={cn('flex flex-col gap-3', className)}>
        <p className="text-sm text-ink-600">{strings.productPage.actions.soldOut}</p>
        <NotifyMeDialog product={{ slug: product.slug, name: product.name }} />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={add}
          disabled={disabled}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-control px-4 py-3 text-sm font-medium transition-colors',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-60',
            justAdded
              ? 'bg-success-600 text-white'
              : 'bg-brand-700 text-brand-50 hover:bg-brand-600',
          )}
        >
          {justAdded ? (
            <Check aria-hidden="true" size={18} />
          ) : (
            <ShoppingCart aria-hidden="true" size={18} />
          )}
          {justAdded ? strings.product.added : strings.actions.addToCart}
        </button>

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishlistPending}
          aria-pressed={saved}
          aria-label={
            saved
              ? strings.product.removeFromWishlist(product.name)
              : strings.product.saveToWishlist(product.name)
          }
          className={cn(
            'grid w-12 shrink-0 place-content-center rounded-control border border-border transition-colors',
            'hover:border-brand-600 disabled:cursor-not-allowed disabled:opacity-60',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            saved ? 'text-sale-600' : 'text-ink-600',
          )}
        >
          <Heart aria-hidden="true" size={20} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <button
        type="button"
        onClick={buyNow}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-control border border-ink-900 px-4 py-3 text-sm font-medium text-ink-900',
          'transition-colors hover:bg-ink-900 hover:text-white',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <Zap aria-hidden="true" size={18} />
        {strings.actions.buyNow}
      </button>

      <p className="text-xs text-ink-500">{strings.productPage.actions.buyNowHint}</p>

      {wishlistPending ? (
        <p role="status" className="flex items-center gap-2 text-xs text-ink-500">
          <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
          {strings.loading.default}
        </p>
      ) : null}

      {wishlist.isError && !wishlistPending ? (
        <p role="alert" className="text-xs text-danger-600">
          {strings.productPage.actions.wishlistFailed}
        </p>
      ) : null}

      {/* Held open whether or not it has something to say, so the buttons above
          do not move when the confirmation appears. */}
      <p
        role="status"
        className={cn('min-h-5 text-sm', justAdded ? 'text-success-600' : 'text-transparent')}
      >
        {justAdded
          ? `${strings.productPage.actions.addedTitle} — ${strings.cart.itemCount(cart.itemCount)}`
          : ''}
      </p>
    </div>
  );
}
