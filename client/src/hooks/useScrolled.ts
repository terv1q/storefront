/**
 * Whether the page has scrolled past a threshold, for the header's compact
 * state.
 *
 * The listener is passive, and the read happens inside a `requestAnimationFrame`
 * so a fast scroll cannot queue a state update per event. The value only changes
 * when the threshold is crossed in either direction, so scrolling within the
 * top of the page re-renders nothing.
 *
 * `useSyncExternalStore` is what subscribes, so the current state is read during
 * the first render rather than after it — opening a page already scrolled down
 * does not flash the tall header first.
 */

import { useCallback, useSyncExternalStore } from 'react';

/** Pixels of scroll before the header switches to its compact state. */
export const SCROLL_THRESHOLD = 24;

export function useScrolled(threshold = SCROLL_THRESHOLD): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    let frame = 0;

    const handleScroll = (): void => {
      if (frame !== 0) {
        return;
      }

      frame = window.requestAnimationFrame(() => {
        frame = 0;
        onChange();
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.scrollY > threshold;
  }, [threshold]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
