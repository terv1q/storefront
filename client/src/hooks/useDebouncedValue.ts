/**
 * A debounced copy of a value.
 *
 * The copy follows the input after `delay` milliseconds without further change.
 * Pages use it for search fields, so a request is sent for what the shopper
 * stopped typing rather than for every keystroke.
 *
 * The pending timer is cleared whenever the value or the delay changes and on
 * unmount, so an effect that is torn down mid-delay cannot fire later and set
 * state on a component that is gone.
 */

import { useEffect, useState } from 'react';

/** Milliseconds a value has to sit still before the debounced copy follows. */
export const DEFAULT_DEBOUNCE_MS = 300;

export function useDebouncedValue<T>(value: T, delay: number = DEFAULT_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    // A delay of zero or less is not a debounce; the value passes through.
    if (delay <= 0) {
      setDebounced(value);
      return;
    }

    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debounced;
}
