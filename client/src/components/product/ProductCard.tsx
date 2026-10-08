/**
 * The product card.
 *
 * One card is used everywhere a product is shown in a list — the featured grid,
 * the rails, the deals row, the recommendations shelf, and later the catalog and
 * search pages — so a product looks the same wherever it is met, and the badges
 * and prices follow one implementation rather than several.
 *
 * Three decisions are worth naming.
 *
 * The card is an `article` with its own `h3`, and its caller puts it in a `li`.
 * A grid of cards is therefore a list of articles, which is what it is, and the
 * heading outline of a page that shows forty products stays navigable. The
 * picture is a link too, because clicking a product image is what people do,
 * but it is taken out of the tab order and hidden from assistive technology:
 * the name is the one control that should be reachable, and a card that offers
 * two links to the same place doubles every list for anybody navigating by
 * keyboard or by screen reader.
 *
 * The heart is drawn for everybody, and it works for everybody. A signed-in
 * visitor's press goes to their account; a visitor who has not registered has
 * their saved products kept in the browser, and the card says so with the same
 * filled heart. Either way the state read is `useWishlistState`, so every heart
 * on the page answers "is this saved?" from the same place and they all refill
 * or empty together.
 *
 * The hover swap and the quick-add overlay only exist on a pointer device. On a
 * touch screen there is no hover to trigger them, so the card shows one image
 * and a button that is always visible: the same information, without a control
 * that can only be reached by hovering. `hover: hover` is what decides, not the
 * screen width, because a narrow window on a laptop still has a pointer.
 *
 * A sold-out card is dimmed and marked, and its action is the one that still makes
 * sense: an address to be told when the product returns. A disabled "add to cart"
 * would say the same thing and offer nothing, so the card does not render one.
 */

import { Check, Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/common/Skeleton';
import { useWishlistState } from '@/features/wishlist/wishlist.queries';
import { discountPercent } from '@/features/products/discount';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useCart } from '@/hooks/useCart';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import { notify } from '@/store/toast.store';
import type { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

import { NotifyMeDialog } from './NotifyMeDialog';
import { Stars } from './Stars';

/**
 * Rating a product needs before it is called top rated, and how many reviews
 * that rating has to rest on. A single five-star review is not a verdict, so a
 * product with a high average and too few ratings is not badged.
 */
const TOP_RATING = 4.5;
const TOP_RATING_MIN_REVIEWS = 10;

/** Stock at or below which the card says how few are left rather than just "in stock". */
const LOW_STOCK = 5;

/** How long the button shows its confirmation before returning to its normal label. */
const ADDED_FEEDBACK_MS = 2000;

/** The five-star row. The sentence it stands for is in the `sr-only` span beside it. */
function Badge({ tone, children }: { tone: 'new' | 'sale' | 'top'; children: ReactNode }) {
  return (
    <span
      className={cn(
        'rounded-control px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase',
        tone === 'sale' && 'bg-sale-600 text-white',
        tone === 'new' && 'bg-ink-900 text-white',
        tone === 'top' && 'bg-accent-100 text-accent-700',
      )}
    >
      {children}
    </span>
  );
}

/** The stock line. Always present, so a card's height does not depend on stock. */
function StockNote({ stock }: { stock: number }) {
  const tone =
    stock === 0 ? 'text-danger-600' : stock <= LOW_STOCK ? 'text-warning-600' : 'text-success-600';

  return (
    <p className={cn('text-xs font-medium', tone)}>
      {stock === 0
        ? strings.product.outOfStock
        : stock <= LOW_STOCK
          ? strings.product.lowStock(stock)
          : strings.product.inStock}
    </p>
  );
}

type Props = {
  product: Product;
  /**
   * True for the first row of a grid, which is often the largest contentful
   * paint: those images load eagerly so the card does not arrive late.
   */
  priority?: boolean;
  /**
   * `grid` is the square card; `list` is the same card laid out as a row, with
   * the picture on the left. The catalog offers both, so the choice belongs to
   * the card rather than to a second component that would drift from this one.
   */
  layout?: 'grid' | 'list';
  className?: string;
};

export function ProductCard({ product, priority = false, layout = 'grid', className }: Props) {
  const cart = useCart();
  const wishlist = useWishlistState();

  /** True when a pointer can hover, which is what the swap and overlay need. */
  const hasPointer = useMediaQuery('(hover: hover)');

  const [justAdded, setJustAdded] = useState(false);
  const addedTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(addedTimer.current), []);

  const saved = wishlist.isSaved(product.id);
  const wishlistPending = wishlist.isPending(product.id);
  const lineQuantity = cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;

  const productPath = paths.product(product.slug);
  const discount = discountPercent(product);
  const isTop = product.rating >= TOP_RATING && product.reviewCount >= TOP_RATING_MIN_REVIEWS;
  const image = product.image;
  const hoverImage = product.hoverImage;
  const canSwapImage = hasPointer && hoverImage != null && hoverImage.url !== image?.url;
  const soldOut = product.stock <= 0;
  const needsChoice = product.hasVariants === true;

  const addNow = () => {
    cart.add({
      productId: product.id,
      variantIds: [],
      name: product.name,
      slug: product.slug,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: image?.url ?? null,
      stock: product.stock,
      variantLabel: null,
    });

    setJustAdded(true);
    window.clearTimeout(addedTimer.current);
    addedTimer.current = window.setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);

    // The button says "Added" for a moment, which is enough for a shopper who
    // stays on this card and no use at all to one adding four things from a grid.
    // The notification is what survives the next click.
    notify(strings.toast.addedToCart(product.name), { tone: 'success' });
  };

  const toggleWishlist = () => {
    wishlist.toggle(product.id, product);
  };

  return (
    <article
      className={cn(
        'group relative flex h-full overflow-hidden rounded-card border border-border bg-surface',
        'transition-shadow duration-200 hover:shadow-raised focus-within:shadow-raised',
        layout === 'list' ? 'flex-row' : 'flex-col',
        className,
      )}
    >
      <Link
        to={productPath}
        tabIndex={-1}
        aria-hidden="true"
        className={cn(
          'relative block overflow-hidden bg-surface-muted',
          layout === 'list' ? 'w-28 shrink-0 self-stretch sm:w-44' : 'aspect-square',
        )}
      >
        {image ? (
          <img
            src={image.url}
            alt=""
            width={800}
            height={800}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className={cn(
              'h-full w-full object-cover transition-opacity duration-300',
              canSwapImage && 'group-hover:opacity-0',
            )}
          />
        ) : null}

        {canSwapImage ? (
          <img
            src={hoverImage.url}
            alt=""
            width={800}
            height={800}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        ) : null}

        {soldOut ? <span aria-hidden="true" className="absolute inset-0 bg-surface/55" /> : null}

        <span className="pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1">
          {discount !== null ? <Badge tone="sale">-{discount}%</Badge> : null}
          {product.isNew ? <Badge tone="new">{strings.product.badgeNew}</Badge> : null}
          {isTop ? <Badge tone="top">{strings.product.badgeTop}</Badge> : null}
        </span>

        {/* The wash above dims the picture, which says "not available" only to
            somebody who can see it. This says it in words, on the picture, where
            the eye already is. */}
        {soldOut ? (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-ink-900/80 px-2 py-1 text-center text-[0.625rem] font-semibold tracking-wide text-white uppercase"
          >
            {strings.product.outOfStock}
          </span>
        ) : null}
      </Link>

      <button
        type="button"
        onClick={toggleWishlist}
        disabled={wishlistPending}
        // A guest's heart is a real toggle too: the list it writes to is the one
        // in their browser, which becomes the account's when they sign in.
        aria-pressed={saved}
        aria-label={
          saved
            ? strings.product.removeFromWishlist(product.name)
            : strings.product.saveToWishlist(product.name)
        }
        className={cn(
          // `z-10` puts the heart above the stretched link of the title, so the
          // two controls do not fight over the same press.
          'absolute top-2 right-2 z-10 grid h-11 w-11 place-content-center rounded-full border border-border bg-surface/90 backdrop-blur sm:h-9 sm:w-9',
          'transition-colors hover:border-brand-600 hover:text-brand-700 disabled:opacity-60',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          saved ? 'text-sale-600' : 'text-ink-600',
        )}
      >
        <Heart aria-hidden="true" size={18} fill={saved ? 'currentColor' : 'none'} />
      </button>

      <div className={cn('flex flex-1 flex-col gap-2 p-3', layout === 'list' && 'pr-12')}>
        <h3 className="text-sm font-medium text-ink-900">
          {/**
           * The link covers the whole card, not just the words.
           *
           * `after:absolute after:inset-0` stretches its own hit area over the
           * nearest positioned ancestor — the card itself — so a press on the
           * price, the rating, the padding, or the gap between the picture and
           * the title opens the product. Before this, only the picture and the
           * name were links, and the rest of a card that looks like one thing
           * did nothing at all.
           *
           * An overlay has to sit under whatever is meant to stay its own
           * control, which is why the heart and the add button carry `z-10`
           * below: they are above the stretched link and keep their own clicks.
           */}
          <Link
            to={productPath}
            className="line-clamp-2 after:absolute after:inset-0 hover:text-brand-700 hover:underline"
          >
            {product.name}
          </Link>
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-ink-500">
          {product.reviewCount > 0 ? (
            <>
              <Stars rating={product.rating} />
              <span>{product.rating.toFixed(1)}</span>
              <span aria-hidden="true">·</span>
              <span>{product.reviewCount}</span>
              <span className="sr-only">
                {strings.product.ratingSummary(product.rating, product.reviewCount)}
              </span>
            </>
          ) : (
            <span>{strings.product.noRating}</span>
          )}
        </div>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span
            className={cn(
              'text-base font-semibold',
              discount !== null ? 'text-sale-600' : 'text-ink-900',
            )}
          >
            {formatPrice(product.price, { currency: product.currency })}
          </span>
          {product.compareAtPrice !== null ? (
            <span className="text-sm text-ink-500 line-through">
              {formatPrice(product.compareAtPrice, { currency: product.currency })}
            </span>
          ) : null}
          <span className="sr-only">
            {product.compareAtPrice !== null
              ? `${strings.product.priceNow(formatPrice(product.price, { currency: product.currency }))}, ${strings.product.priceWas(formatPrice(product.compareAtPrice, { currency: product.currency }))}`
              : strings.product.priceNow(
                  formatPrice(product.price, { currency: product.currency }),
                )}
          </span>
        </div>

        <StockNote stock={product.stock} />

        {/* Above the stretched link of the title, like the heart: the add button
            and the "choose options" link are the card's own controls and must
            not be swallowed by the overlay that opens the product. */}
        <div className="relative z-10 mt-auto pt-1">
          {soldOut ? (
            <NotifyMeDialog product={{ slug: product.slug, name: product.name }} />
          ) : needsChoice ? (
            <Link
              to={productPath}
              className="inline-flex w-full items-center justify-center gap-2 rounded-control border border-ink-900 px-3 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
            >
              {strings.product.chooseOptions}
            </Link>
          ) : (
            <button
              type="button"
              onClick={addNow}
              className={cn(
                'relative inline-flex w-full items-center justify-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                justAdded
                  ? 'bg-success-600 text-white'
                  : 'bg-brand-700 text-brand-50 hover:bg-brand-600',
              )}
            >
              {justAdded ? (
                <Check aria-hidden="true" size={16} />
              ) : (
                <ShoppingCart aria-hidden="true" size={16} />
              )}
              {justAdded ? strings.product.added : strings.product.addToCart}
              {lineQuantity > 0 ? (
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-content-center rounded-full bg-ink-900 px-1 text-[0.625rem] leading-none font-semibold text-white"
                >
                  {lineQuantity > 99 ? '99+' : lineQuantity}
                </span>
              ) : null}
              <span className="sr-only">{strings.product.inCart(lineQuantity)}</span>
            </button>
          )}

          {/* The press is answered in words for somebody who cannot see the
              button turn green and read "Added". The label swap on the button
              itself is not reliably announced — a control that renames itself is
              read only when it is reached again — and the shopper is looking at
              the picture, not at the button. The region is empty until a press
              and holds one sentence, so nothing is said twice. */}
          <p role="status" className="sr-only">
            {justAdded ? `${strings.product.added} — ${strings.product.inCart(lineQuantity)}` : ''}
          </p>
        </div>
      </div>
    </article>
  );
}

/** The stand-in a grid shows while its products load. Same box, same height. */
export function ProductCardSkeleton({ layout = 'grid' }: { layout?: 'grid' | 'list' } = {}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'flex h-full overflow-hidden rounded-card border border-border bg-surface',
        layout === 'list' ? 'flex-row' : 'flex-col',
      )}
    >
      <Skeleton
        variant="image"
        className={cn(
          // The picture is square in a grid and a full-height strip in a list,
          // which is the one thing the two layouts do not share.
          'rounded-none',
          layout === 'list' && 'aspect-auto w-28 shrink-0 self-stretch sm:w-44',
        )}
      />
      <div className={cn('flex flex-1 flex-col gap-3 p-3', layout === 'list' && 'pr-12')}>
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="mt-auto h-9 rounded-control" />
      </div>
    </div>
  );
}
