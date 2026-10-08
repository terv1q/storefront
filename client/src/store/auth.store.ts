/**
 * The session as the rest of the application reads it.
 *
 * The account itself is fetched and cached by `features/auth/auth.queries.ts`,
 * and that stays the one place a session is asked for: this store does not make
 * a request, does not hold a second copy of an account that a sign-out would
 * have to clear twice, and does not decide who is signed in. What it holds is
 * the part a query cannot answer.
 *
 * * **Whether there was a token at boot.** Storage is synchronous, so the stored
 *   token is read while this module is being imported, before the first render.
 *   That is what a route guard needs: "nobody has ever signed in here" is known
 *   immediately and can be answered with a redirect, while "a session might
 *   exist, the server has not confirmed it yet" is a state that must not flash a
 *   sign-in form or bounce a signed-in visitor to the storefront.
 * * **A session for code that is not a render.** An imperative caller — a
 *   request that wants the current account, an event handler — can read
 *   `useAuthStore.getState()` instead of being passed one through props.
 * * **A third state, `hydrating`.** Neither "signed in" nor "signed out": a
 *   token exists and the answer is still in flight. Guards treat it as "wait",
 *   which is what makes the handover from a stored token to a confirmed account
 *   free of flicker.
 *
 * The account is written here once it is known — `auth.queries.ts` is the only
 * writer — and the token is never written here at all. It lives in storage, the
 * API client reads it from there, and the copy below exists so a value that has
 * changed, or disappeared, can be noticed.
 */

import { create } from 'zustand';

import type { User } from '@/types/user';
import { STORAGE_KEYS, getAccessToken } from '@/utils/storage';

export type AuthStatus = 'hydrating' | 'anonymous' | 'authenticated';

export type AuthState = {
  /** The confirmed account, or `null` while it is unknown or absent. */
  user: User | null;
  /** The token that was in storage when this was last read. */
  token: string | null;
  status: AuthStatus;
  /** True once the stored session has been read. Always true after the first render. */
  hydrated: boolean;
  /** Records a confirmed session, which is what a sign-in or a `me` response is. */
  setSession: (user: User, token?: string | null) => void;
  /** Forgets the session. Called on sign-out, and when the server refuses the token. */
  clear: () => void;
  /** Records that the session read finished with nobody signed in. */
  settleAnonymous: () => void;
  /** Re-reads storage, for a change made by another tab. */
  syncFromStorage: () => void;
};

const initialToken = getAccessToken();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: initialToken,
  status: initialToken === null ? 'anonymous' : 'hydrating',
  hydrated: true,

  setSession: (user, token) => {
    set({
      user,
      token: token ?? getAccessToken() ?? null,
      status: 'authenticated',
      hydrated: true,
    });
  },

  clear: () => {
    set({ user: null, token: null, status: 'anonymous', hydrated: true });
  },

  settleAnonymous: () => {
    set({
      user: null,
      token: getAccessToken() ?? null,
      status: 'anonymous',
      hydrated: true,
    });
  },

  syncFromStorage: () => {
    const token = getAccessToken();

    if (token === null) {
      get().clear();
      return;
    }

    // A token arriving from another tab means the session may exist but this tab
    // has not confirmed it, which is exactly what `hydrating` means.
    set({ token, status: get().status === 'authenticated' ? 'authenticated' : 'hydrating' });
  },
}));

/**
 * Another tab signing in or out writes the token, and `storage` events are how
 * this tab hears about it — they are not delivered to the tab that made the
 * change, so this can only ever fire for somebody else's write.
 *
 * The listener is registered once, when the module is first imported, and never
 * removed: it belongs to the store rather than to a component, and a component
 * that unmounted would take the subscription with it while the store lives on.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === null || event.key === STORAGE_KEYS.accessToken) {
      useAuthStore.getState().syncFromStorage();
    }
  });
}
