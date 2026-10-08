/**
 * The product page's action, kept within reach of a thumb.
 *
 * A phone shows the gallery first and the buttons under it, which is a screen or
 * two of scrolling on exactly the page where the decision is being made. This
 * bar carries the same action at the bottom of the window, and it appears only
 * once the panel it copies has left the screen — so the shopper never sees two
 * buttons offering the same thing.
 *
 * The panel itself is what decides what "the same action" is: the chosen options,
 * the quantity, and the price all come from the page, and both controls press
 * one hook. Nothing is decided here.
 *
 * What it deliberately does not carry is the heart, the buy-now button, and the
 * confirmation line. Those belong to the panel, which is where a shopper who has
 * scrolled back up finds them, and a bar with four controls is a bar that has
 * stopped being a shortcut.
 *
 * A product that cannot be added is not a bar at all: the sold-out case already
 * has its own answer, in the panel.
 */

import { StickyActionBar } from '@/components/common/StickyActionBar';
import { useAddToCart } from '@/features/cart/useAddToCart';
import { strings } from '@/i18n/strings';
import type { ProductDetail } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  product: ProductDetail;
  /** The current choice's price in minor units, options included. */
  price: number;
  stock: number;
  variantIds: readonly string[];
  variantLabel: string | null;
  quantity: number;
  disabled: boolean;
  /** False while the panel it copies is still on screen. */
  visible: boolean;
};

export function StickyAddToCart({
  product,
  price,
  stock,
  variantIds,
  variantLabel,
  quantity,
  disabled,
  visible,
}: Props) {
  const { add } = useAddToCart({
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

  if (!visible || stock <= 0) {
    return null;
  }

  return (
    <StickyActionBar
      label={strings.actions.addToCart}
      secondary={formatPrice(price, { currency: product.currency })}
      disabled={disabled}
      onClick={add}
    />
  );
}
