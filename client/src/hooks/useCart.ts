/**
 * The cart as components use it.
 *
 * Components read counts, totals, and the applied promo code through these hooks
 * rather than from the store directly, so the arithmetic — how many items, what
 * the subtotal is, what delivery costs — lives in one place and is computed
 * rather than stored. `calculateTotals` is the whole of it; the hooks here only
 * decide which slice of the store each caller needs to subscribe to, which is
 * what keeps a quantity change from re-rendering the header.
 */

import { useMemo } from 'react';

import { siteConfig } from '@/config/site';
import { calculateTotals } from '@/features/cart/cart.totals';
import { useCartStore } from '@/features/cart/cart.store';
import type { AddToCartInput } from '@/features/cart/cart.store';
import type { AppliedPromo, CartItem, CartLineRef, CartTotals } from '@/features/cart/cart.types';

export type CartSummary = CartTotals & {
  items: CartItem[];
  isEmpty: boolean;
  promo: AppliedPromo | null;
  add: (input: AddToCartInput) => void;
  remove: (line: CartLineRef) => void;
  setQuantity: (line: CartLineRef, quantity: number) => void;
  setPromo: (promo: AppliedPromo) => void;
  clearPromo: () => void;
  clear: () => void;
};

/**
 * The whole cart: what is in it, what it comes to, and what acts on it.
 *
 * The totals are recomputed whenever the lines or the code change, and are not
 * kept anywhere else, so a line removed in one tab and a quantity raised in
 * another cannot leave a stale sum on the screen.
 *
 * `freeDeliveryFrom` is the store's own constant here. The cart page, which has
 * the delivery policy from the API, passes the published threshold through
 * `useCartTotals` instead — this hook is for the header, the mini-cart, and
 * anything else that shows a subtotal without a shipping line.
 */
export function useCart(): CartSummary {
  // The array identity changes only when the cart changes, so this selector is
  // stable between renders.
  const items = useCartStore((state) => state.items);
  const promo = useCartStore((state) => state.promo);
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const setPromo = useCartStore((state) => state.setPromo);
  const clearPromo = useCartStore((state) => state.clearPromo);
  const clear = useCartStore((state) => state.clear);

  const totals = useMemo(() => calculateTotals(items, promo), [items, promo]);

  return {
    ...totals,
    items,
    promo,
    isEmpty: items.length === 0,
    add,
    remove,
    setQuantity,
    setPromo,
    clearPromo,
    clear,
  };
}

/** The line items alone, for a component that renders the basket. */
export function useCartItems(): CartItem[] {
  return useCartStore((state) => state.items);
}

/**
 * The figures the summary card shows, priced against a threshold the caller
 * already has. The cart page reads the store's published delivery policy and
 * passes `policy.freeDeliveryFrom` here, so the shipping line and the
 * free-delivery bar agree with what the server will charge.
 */
export function useCartTotals(freeDeliveryFrom: number | null = siteConfig.freeDeliveryFrom): {
  items: CartItem[];
  promo: AppliedPromo | null;
  totals: CartTotals;
} {
  const items = useCartStore((state) => state.items);
  const promo = useCartStore((state) => state.promo);

  const totals = useMemo(
    () => calculateTotals(items, promo, freeDeliveryFrom),
    [items, promo, freeDeliveryFrom],
  );

  return { items, promo, totals };
}

/** The badge count on its own, for a component that shows nothing else. */
export function useCartCount(): number {
  return useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
}
