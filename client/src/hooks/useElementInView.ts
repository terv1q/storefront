/**
 * Whether an element is on screen.
 *
 * Written for the sticky bars, which repeat a control that is already on the
 * page and appear only once that control has scrolled away. The browser answers
 * that question itself through `IntersectionObserver`, so nothing here measures
 * anything: no scroll listener, no `getBoundingClientRect` in a frame callback,
 * no arithmetic to get wrong at a zoom level.
 *
 * A callback ref rather than a `RefObject`, because it is attached to an element
 * that exists only after the page has data to draw. A `RefObject` read from an
 * effect would have to be re-read on every render that could have attached it;
 * a callback ref is called with the node at exactly the moment there is one, and
 * with `null` at the moment there is not.
 *
 * The answer while there is no element is `false`, which means "not on screen"
 * and therefore "the bar is shown". That is the safe default: a bar that appears
 * a moment early is a bar in the wrong place, and one that never appears is a
 * control the shopper cannot reach.
 */

import { useEffect, useState } from 'react';

/** The root margin is none: an element counts as on screen when any of it is. */
const OBSERVER_OPTIONS: IntersectionObserverInit = { threshold: 0 };

export function useElementInView<T extends Element>(): {
  /** Attach to the element to watch. */
  ref: (node: T | null) => void;
  /** True while any part of that element is inside the viewport. */
  inView: boolean;
} {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (node === null) {
      setInView(false);
      return;
    }

    // `IntersectionObserver` is not optional here: every browser this storefront
    // targets has it, and a page whose only failure mode is a bar in the wrong
    // place does not need a fallback for one that does not.
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;

      setInView(entry?.isIntersecting ?? false);
    }, OBSERVER_OPTIONS);

    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return {
    ref: (next: T | null) => setNode(next),
    inView,
  };
}
