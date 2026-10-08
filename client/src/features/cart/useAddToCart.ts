/**
 * Adding the product the shopper is looking at, and the beat of confirmation
 * that follows.
 *
 * Two controls press this. The panel under the choices, and the bar that follows
 * the thumb down a phone screen once that panel has scrolled away. They are two
 * arrangements of one action, so the action itself — what goes into the cart and
 * how long it says so — lives here rather than being written twice with a chance
 * of drifting.
 *
 * The line is read from a ref at press time rather than captured from the
 * argument. A shopper can choose a size or change the quantity between renders,
 * and the press has to record what was on screen when it happened, not what the
 * hook was last constructed with. The ref is refreshed on every render, which is
 * what keeps it current without the caller having to memoise anything.
 *
 * The confirmation is a flag here and a sentence at the call site. What was added
 * is a different sentence in each control, and this hook has no opinion about it.
 */

import { useEffect, useRef, useState } from 'react';

import { useCart } from '@/hooks/useCart';
import type { AddToCartInput } from '@/features/cart/cart.store';

/** How long a control shows its confirmation before it goes quiet again. */
export const ADDED_FEEDBACK_MS = 2500;

export function useAddToCart(input: AddToCartInput): {
  /** Puts the current line in the cart and starts the confirmation. */
  add: () => void;
  /** True for a moment after a press, so the control can say what happened. */
  justAdded: boolean;
} {
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const latest = useRef(input);

  const timer = useRef<number | undefined>(undefined);

  // Refreshed during render rather than in an effect: an effect runs after the
  // paint, and a press that lands between the two would otherwise record the
  // previous line.
  latest.current = input;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const add = () => {
    cart.add(latest.current);

    setJustAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setJustAdded(false), ADDED_FEEDBACK_MS);
  };

  return { add, justAdded };
}
