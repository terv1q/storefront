/**
 * The cart store. One Zustand store is the only place cart state lives, so the
 * header badge, the mini-cart, the bottom navigation, and the cart page all read
 * the same array.
 *
 * What is stored is the lines and the applied promo code, and nothing else. The
 * subtotal, the discount, the shipping, and the total are computed from the
 * lines every time they are read — see `cart.totals.ts` — so no figure can be
 * left behind at a value that was true before the last quantity change.
 *
 * Persistence goes through Zustand's `persist` middleware, with `utils/storage`
 * as its backing store rather than `window.localStorage` directly: that module
 * is the client's only door to browser storage, and it already swallows the
 * failures — private mode, a full quota — that would otherwise throw inside a
 * reducer. A cart that cannot be written still works for the session.
 *
 * Quantities are clamped to the stock known when the item was added, and to the
 * same per-line ceiling the checkout API enforces, so the cart can never hold a
 * line the server will certainly refuse. A line that has become unavailable
 * since — the product switched off, or its stock gone — is not silently dropped
 * here; the cart page reports it and offers to fix it, which is a decision the
 * shopper should make rather than one this store should make for them.
 *
 * `clear` runs on a confirmed order and on nothing else. It is deliberately not
 * called when a checkout fails: the shopper who has just been told their card
 * was declined should still find their basket where they left it.
 */

import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';

import { siteConfig } from '@/config/site';
import { STORAGE_KEYS, readJson, removeItem, writeJson } from '@/utils/storage';

import { sameCartLine, type AppliedPromo, type CartItem, type CartLineRef } from './cart.types';

/** Everything needed to add a line; the quantity is optional and defaults to one. */
export type AddToCartInput = Omit<CartItem, 'quantity'> & { quantity?: number };

type CartState = {
  items: CartItem[];
  /** The promo code accepted for this basket, or `null`. */
  promo: AppliedPromo | null;
  /** Adds a line, or raises the quantity of the line already there. */
  add: (input: AddToCartInput) => void;
  /** Removes one line entirely. */
  remove: (line: CartLineRef) => void;
  /** Sets an exact quantity; zero or less removes the line. */
  setQuantity: (line: CartLineRef, quantity: number) => void;
  /** Applies an accepted promo code, replacing any code already applied. */
  setPromo: (promo: AppliedPromo) => void;
  /** Removes the applied code. */
  clearPromo: () => void;
  /** Empties the cart, for a completed checkout. */
  clear: () => void;
  /** Replaces every line at once, for reconciling after a re-validation. */
  replace: (items: CartItem[]) => void;
};

/** The largest quantity one line may hold: stock when known, the API ceiling otherwise. */
export function quantityCeiling(item: Pick<CartItem, 'stock'>): number {
  return Math.min(siteConfig.maxCartLineQuantity, item.stock ?? siteConfig.maxCartLineQuantity);
}

function clampQuantity(quantity: number, ceiling: number): number {
  if (!Number.isFinite(quantity)) {
    return 1;
  }

  return Math.max(1, Math.min(Math.trunc(quantity), Math.max(1, ceiling)));
}

/**
 * The shape an item was stored in before a line could carry more than one
 * chosen option. It is read rather than thrown away: a cart that predates this
 * change holds real lines, and the single option it recorded is still the option
 * the shopper picked.
 */
type StoredCartItem = CartItem & { variantId?: string | null };

/** Reads what was stored, ignoring anything that no longer matches the shape. */
function sanitiseItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return (value as StoredCartItem[])
    .filter(
      (item) =>
        typeof item?.productId === 'string' &&
        typeof item.slug === 'string' &&
        typeof item.unitPrice === 'number' &&
        typeof item.quantity === 'number' &&
        item.quantity > 0,
    )
    .map(({ variantId, ...item }) => ({
      ...item,
      variantIds: Array.isArray(item.variantIds)
        ? item.variantIds
        : variantId == null
          ? []
          : [variantId],
    }));
}

/** The persisted shape: what the cart keeps between visits. */
type PersistedCart = {
  items: CartItem[];
  promo: AppliedPromo | null;
};

/**
 * `utils/storage` as the middleware's storage.
 *
 * The key is the one this store was created with — `STORAGE_KEYS.cart` — so the
 * `name` argument the middleware passes is the same string and is not read
 * again. The middleware stores JSON of its own making, so the three methods map
 * onto the module's JSON helpers and an absent value is `null` rather than
 * `undefined`. A failed write is not reported: a cart that could not be stored
 * is still a cart for this session.
 */
const cartStorage: PersistStorage<PersistedCart> = {
  getItem: () => {
    const value = readJson<unknown>(STORAGE_KEYS.cart, null);

    return value === null ? null : { state: value as PersistedCart, version: 1 };
  },
  setItem: (_name, value) => {
    writeJson(STORAGE_KEYS.cart, value.state);
  },
  removeItem: () => {
    removeItem(STORAGE_KEYS.cart);
  },
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      promo: null,

      add: (input) =>
        set((state) => {
          const { quantity = 1, ...rest } = input;
          const existing = state.items.find((item) => sameCartLine(item, rest));

          if (existing) {
            const nextQuantity = clampQuantity(
              existing.quantity + quantity,
              quantityCeiling(existing),
            );

            return {
              items: state.items.map((item) =>
                sameCartLine(item, rest) ? { ...item, quantity: nextQuantity } : item,
              ),
            };
          }

          const item: CartItem = {
            ...rest,
            quantity: clampQuantity(quantity, quantityCeiling(rest)),
          };

          return { items: [item, ...state.items] };
        }),

      remove: (line) =>
        set((state) => ({ items: state.items.filter((item) => !sameCartLine(item, line)) })),

      setQuantity: (line, quantity) =>
        set((state) => {
          const target = state.items.find((item) => sameCartLine(item, line));

          if (target === undefined) {
            return {};
          }

          if (quantity <= 0) {
            return { items: state.items.filter((item) => !sameCartLine(item, line)) };
          }

          const nextQuantity = clampQuantity(quantity, quantityCeiling(target));

          return {
            items: state.items.map((item) =>
              sameCartLine(item, line) ? { ...item, quantity: nextQuantity } : item,
            ),
          };
        }),

      setPromo: (promo) => set({ promo }),

      clearPromo: () => set({ promo: null }),

      clear: () => set({ items: [], promo: null }),

      replace: (items) => set({ items }),
    }),
    {
      name: STORAGE_KEYS.cart,
      storage: cartStorage,
      /**
       * What is written is exactly what is read back: the middleware's own
       * envelope carries the version, and the two fields below are the state.
       * `sanitiseItems` runs on the way in rather than on the way out, so a
       * stored cart written by an older version is corrected as it is loaded
       * instead of being written back in a shape the current code does not use.
       */
      partialize: (state): PersistedCart => ({ items: state.items, promo: state.promo }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<PersistedCart> | undefined;

        return {
          ...current,
          items: sanitiseItems(stored?.items),
          promo: stored?.promo ?? null,
        };
      },
    },
  ),
);
