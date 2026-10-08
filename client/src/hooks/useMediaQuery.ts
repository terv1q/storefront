/**
 * A media query as a boolean that re-renders when it changes.
 *
 * Components use this when a layout difference is structural rather than
 * cosmetic — rendering a drawer instead of a menu, or a scroll rail instead of a
 * grid — and CSS alone cannot express it.
 *
 * `useSyncExternalStore` is what subscribes, so the listener is attached once
 * per query and removed when the component unmounts or the query changes. The
 * third argument is the server snapshot: during any render without a `window`
 * or without `matchMedia` the answer is `false`, which keeps the hook usable
 * under test and under a server render without touching a global.
 */

import { useCallback, useSyncExternalStore } from 'react';

/** Tailwind's default breakpoints, as queries a component can subscribe to. */
export const MEDIA_QUERIES = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  /** Below the smallest breakpoint, where the mobile shell is used. */
  mobile: '(max-width: 639px)',
  /** The preference that turns autoplay and large motion off. */
  reducedMotion: '(prefers-reduced-motion: reduce)',
  dark: '(prefers-color-scheme: dark)',
} as const;

export type MediaQueryName = keyof typeof MEDIA_QUERIES;

/** The list for a query, or `null` when this environment has no `matchMedia`. */
function listFor(query: string): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return null;
  }

  return window.matchMedia(query);
}

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = listFor(query);

      if (list === null) {
        return () => {};
      }

      list.addEventListener('change', onStoreChange);

      return () => {
        list.removeEventListener('change', onStoreChange);
      };
    },
    [query],
  );

  const getSnapshot = useCallback(() => listFor(query)?.matches ?? false, [query]);

  // No `window`: nothing can match, so `false` is the honest answer.
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** The same hook for one of the named queries above. */
export function useBreakpoint(name: MediaQueryName): boolean {
  return useMediaQuery(MEDIA_QUERIES[name]);
}
