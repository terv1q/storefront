/**
 * Whether the browser believes it has a connection.
 *
 * `navigator.onLine` is not a promise that a request will succeed — it is false
 * only when the operating system knows there is no link, and a captive portal or
 * a server that is down leaves it true. So this answers exactly one question, and
 * the answer is used for exactly one thing: saying "you are offline" before a
 * request has to fail to prove it. The error states remain what they were, because
 * they are the ones that are right.
 *
 * It is read through `useSyncExternalStore` rather than `useState` and an effect:
 * the browser's events are an external source, and the first render has to agree
 * with what the browser already thinks rather than with a guess of `true`. The
 * server snapshot is not a real case in a client-rendered application and the
 * optimistic `true` is the only honest default for it.
 */

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function isOnline(): boolean {
  return navigator.onLine;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, isOnline, () => true);
}
