/**
 * The notifications the application shows over its own pages.
 *
 * A toast is for something that has already happened and is not visible where the
 * visitor is looking: a product saved from a grid of twelve, a connection that
 * dropped, a list emptied by a bulk action. Anything a page can say in place — a
 * field message, a panel that repaints, a button that changes its own label —
 * stays in place, because a notification that repeats what is on the screen is
 * noise a shopper has to dismiss.
 *
 * The message is a sentence, resolved by the caller when the event happens and
 * not by this store when it is drawn. A notification lives a few seconds and
 * describes a moment that has passed; re-resolving it on a language switch would
 * describe the past in the new language, and the sentences that carry a product
 * name or a count would have to be stored as keys and arguments to do it. The
 * store holds what is on the screen.
 *
 * At most three are kept. A fourth dismisses the oldest, so a burst — a bulk
 * removal is one request per product — cannot cover the page it is reporting on.
 * Each one leaves on its own timer, and a caller can take one away early.
 */

import { create } from 'zustand';

export type ToastTone = 'success' | 'info' | 'error';

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  /**
   * Shows a sentence. Returns the id, so a caller that wants to replace its own
   * notification can take it away again.
   */
  notify: (message: string, options?: { tone?: ToastTone; durationMs?: number }) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

/** How many are on screen at once before the oldest is dropped. */
const MAX_TOASTS = 3;

/** Long enough to read a short sentence, short enough not to be in the way. */
const DEFAULT_DURATION_MS = 4000;

/** An error is worth reading twice, so it stays longer than a confirmation. */
const ERROR_DURATION_MS = 6000;

let sequence = 0;

/**
 * The id a notification is addressed by. A counter rather than a timestamp or a
 * random value: two notifications created in the same millisecond are ordinary
 * here, and a repeated id would make one of them undismissable.
 */
function nextId(): string {
  sequence += 1;

  return `toast-${sequence}`;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  notify: (message, options = {}) => {
    const { tone = 'info', durationMs } = options;
    const id = nextId();

    set((state) => ({
      toasts: [...state.toasts, { id, tone, message }].slice(-MAX_TOASTS),
    }));

    window.setTimeout(
      () => {
        get().dismiss(id);
      },
      durationMs ?? (tone === 'error' ? ERROR_DURATION_MS : DEFAULT_DURATION_MS),
    );

    return id;
  },

  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),

  clear: () => set({ toasts: [] }),
}));

/**
 * Shows a notification from anywhere, including outside a component — the
 * mutation that failed, the effect that noticed the connection. Components read
 * `useToastStore` directly when they need the list.
 */
export function notify(
  message: string,
  options?: { tone?: ToastTone; durationMs?: number },
): string {
  return useToastStore.getState().notify(message, options);
}
