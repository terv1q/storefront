/**
 * Tilts an element towards the pointer, by writing its transform directly.
 *
 * The angle is small — a few degrees — and it exists to make a flat picture feel
 * like a physical card under the cursor. The pointer position is turned into a
 * rotation in both axes, so the corner nearest the pointer lifts and the tile
 * leans towards where the visitor is looking.
 *
 * The transform is written to the node rather than kept in state. A pointer
 * crossing a tile fires this many times a second, and a re-render per event
 * would re-render the picture, the overlay, and the link on every one of them
 * for a change the browser can apply on its own. Because the element carries the
 * transition, the browser also smooths the values between events, which is what
 * makes the tile glide instead of snapping to each new angle, and it lands back
 * flat on its own when the pointer leaves.
 *
 * The caller decides whether the effect is wanted at all — a visitor who asked
 * for reduced motion, or one on a device with no pointer to hover with, gets no
 * tilt — and the hook simply does nothing in that case.
 */

import { useEffect, useState } from 'react';

type Options = {
  /** The furthest the tile leans, in degrees, at its edges. */
  max?: number;
  /** Whether the effect should be applied at all. */
  enabled?: boolean;
};

/** Returns the ref for the element to tilt. */
export function useTilt<T extends HTMLElement>({ max = 8, enabled = true }: Options = {}) {
  const [node, setNode] = useState<T | null>(null);

  useEffect(() => {
    if (node === null || !enabled) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();

      // Where the pointer is across the tile, from -0.5 at one edge to 0.5 at
      // the other.
      const across = (event.clientX - rect.left) / rect.width - 0.5;
      const down = (event.clientY - rect.top) / rect.height - 0.5;

      // The horizontal position turns the tile about the vertical axis and the
      // vertical position about the horizontal one, and the vertical rotation is
      // inverted because a screen's Y axis points down while a rotation's does
      // not.
      node.style.transform = `perspective(900px) rotateX(${(-down * max).toFixed(2)}deg) rotateY(${(across * max).toFixed(2)}deg)`;
    };

    const onPointerLeave = () => {
      // An empty string rather than a string that says "no rotation", so the
      // element goes back to whatever transform its own styles give it.
      node.style.transform = '';
    };

    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerleave', onPointerLeave);

    return () => {
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerleave', onPointerLeave);
      node.style.transform = '';
    };
  }, [node, max, enabled]);

  return setNode;
}
