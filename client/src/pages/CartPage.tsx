/**
 * The cart page.
 *
 * Two columns on a wide screen — what is in the basket on the left, what it
 * comes to on the right — and one column on a narrow one, where the summary
 * follows the lines instead of sitting beside them. The layout is the whole of
 * the difference: the same components are rendered either way.
 *
 * The page opens by re-reading its products from the catalog, because a cart is
 * a copy of prices and stock taken when the lines were added. What that finds is
 * reported and offered a fix, never applied on its own: paying a new price or
 * accepting fewer items is the shopper's decision, and a basket that quietly
 * changed under them would be worse than one that is wrong out loud.
 *
 * The promo code lives in the cart store, so it survives a reload like the lines
 * do, and it is priced again by `calculateTotals` on every render. The amount it
 * saves here is a preview; the checkout reads the code and computes the discount
 * from the database before it writes the order.
 *
 * An empty cart is a different page, not an empty version of this one: see
 * `EmptyCart`.
 */

import { useNavigate } from 'react-router-dom';

import { CartIssues } from '@/components/cart/CartIssues';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { CartSummary } from '@/components/cart/CartSummary';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { FreeDeliveryProgress } from '@/components/cart/FreeDeliveryProgress';
import { PromoCodeForm } from '@/components/cart/PromoCodeForm';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { StickyActionBar } from '@/components/common/StickyActionBar';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { siteConfig } from '@/config/site';
import type { CartIssue } from '@/features/cart/cart.revalidate';
import { withCurrentPrices } from '@/features/cart/cart.revalidate';
import { useCartRevalidation } from '@/features/cart/cart.queries';
import { useCartStore } from '@/features/cart/cart.store';
import { cartItemKey } from '@/features/cart/cart.types';
import { useWishlistState } from '@/features/wishlist/wishlist.queries';
import { useCartTotals } from '@/hooks/useCart';
import { useDeliveryEstimate } from '@/hooks/useDelivery';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { formatPrice } from '@/utils/formatPrice';

/** How many placeholder rows the first load draws. */
const SKELETON_ROWS = 3;

export function CartPage() {
  useSeo({ title: strings.pages.cart.title, noIndex: true });

  const navigate = useNavigate();
  const wishlist = useWishlistState();

  const items = useCartStore((state) => state.items);
  const promo = useCartStore((state) => state.promo);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const setPromo = useCartStore((state) => state.setPromo);
  const clearPromo = useCartStore((state) => state.clearPromo);
  const replace = useCartStore((state) => state.replace);

  const revalidation = useCartRevalidation(items);

  // The policy is the store's, so the shipping line and the bar are drawn from
  // the number the API publishes; the constant is what the page has before the
  // answer arrives, and what it falls back to if the request fails. An empty
  // postal code is a real question here — it asks for the policy alone.
  const delivery = useDeliveryEstimate('');
  const freeDeliveryFrom = delivery.data?.policy.freeDeliveryFrom ?? siteConfig.freeDeliveryFrom;

  const { totals } = useCartTotals(freeDeliveryFrom);

  /**
   * The line is saved and only then removed. A save that fails leaves the basket
   * as it was, which is the honest outcome: the shopper asked for the item to be
   * kept somewhere, and it is still here.
   *
   * Saving for later is the wishlist, so the notification comes from the wishlist
   * hooks rather than from here — one press, one message, whichever of the two
   * buttons it was pressed on. The row is gone from the page either way, which is
   * why the message has to be said somewhere the page cannot take it away.
   */
  const saveForLater = (key: string) => {
    const line = items.find((item) => cartItemKey(item) === key);

    if (line === undefined) {
      return;
    }

    wishlist.toggle(line.productId);
    remove(line);
  };

  const updatePrices = () => {
    replace(withCurrentPrices(items, revalidation.products));
  };

  const reduceToStock = (issue: CartIssue) => {
    setQuantity(issue.line, issue.availableStock ?? 1);
  };

  const removeIssue = (issue: CartIssue) => {
    remove(issue.line);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-page px-page-x py-page-y">
        <h1 className="mb-6 text-2xl font-semibold text-ink-900">{strings.cart.title}</h1>
        <EmptyCart />
      </div>
    );
  }

  // Nothing in the basket is buyable while a line is switched off or gone, so the
  // checkout waits for the shopper to deal with it rather than failing later.
  const blocked = revalidation.issues.some(
    (issue) => issue.kind === 'inactive' || issue.kind === 'out_of_stock',
  );

  return (
    <div className="mx-auto w-full max-w-page px-page-x py-page-y">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{strings.cart.title}</h1>
        <p className="text-sm text-ink-600">{strings.cart.itemCount(totals.itemCount)}</p>
      </header>

      {/* What changed in the basket is announced, because the shopper may have
          pressed a button that is not on screen any more. */}
      <p aria-live="polite" className="sr-only">
        {strings.cart.itemCount(totals.itemCount)}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {revalidation.isError ? (
            <ErrorMessage>{strings.cart.revalidateFailed}</ErrorMessage>
          ) : null}

          <CartIssues
            issues={revalidation.issues}
            onUpdatePrices={updatePrices}
            onReduceQuantity={reduceToStock}
            onRemove={removeIssue}
          />

          {revalidation.isLoading ? (
            <ProductGridSkeleton count={SKELETON_ROWS} layout="list" />
          ) : (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <CartItemRow
                  key={cartItemKey(item)}
                  item={item}
                  availableStock={
                    revalidation.products.find((product) => product.id === item.productId)?.stock ??
                    null
                  }
                  onQuantityChange={(quantity) => setQuantity(item, quantity)}
                  onRemove={() => remove(item)}
                  onSaveForLater={() => saveForLater(cartItemKey(item))}
                />
              ))}
            </ul>
          )}

          <FreeDeliveryProgress subtotal={totals.subtotal} freeDeliveryFrom={freeDeliveryFrom} />
        </div>

        <CartSummary
          totals={totals}
          promo={promo}
          onCheckout={() => navigate(paths.checkout)}
          checkoutEnabled={!blocked}
          notices={
            blocked ? (
              <ErrorMessage className="mt-4">{strings.cart.blockedCheckout}</ErrorMessage>
            ) : null
          }
        >
          <PromoCodeForm
            subtotal={totals.subtotal}
            promo={promo}
            appliedDiscount={totals.promoDiscount}
            onApply={setPromo}
            onRemove={clearPromo}
          />
        </CartSummary>
      </div>

      {/* On a phone the summary sits under the basket, so its button can be a
          screen below the top. This is the same button, and the same enabled
          rule — a basket that cannot be checked out says so here too. */}
      <StickyActionBar
        label={strings.actions.checkout}
        secondary={formatPrice(totals.total)}
        disabled={blocked}
        onClick={() => navigate(paths.checkout)}
      />
    </div>
  );
}
