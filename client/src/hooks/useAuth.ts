/**
 * The session as a component uses it.
 *
 * One hook answers everything about who is signed in — the account, whether the
 * answer is still on its way, and the three things that change it — so no
 * component has to know that the account is a TanStack Query entry, that the
 * token lives in storage, or that a store mirrors both.
 *
 * The pieces it joins:
 *
 * * `useSession` is the fetch. It asks `GET /api/auth/me` and treats 401 as
 *   "nobody is signed in" rather than as a failure, which is what makes an
 *   expired token an ordinary state instead of an error to report.
 * * `useAuthStore` holds what a query cannot: whether a token existed at boot,
 *   and the `hydrating` state between a stored token and a confirmed account.
 *   It is written from here, in one effect, and nowhere else — so there is one
 *   writer and no second copy to keep in step.
 * * The mutations do the signing in, signing up, and signing out. They are the
 *   existing ones from `auth.queries.ts`; this hook only adds the store writes
 *   and the `await`-able wrappers a form wants.
 *
 * A rejected token is handled without a redirect loop. The API client drops the
 * stored token as soon as a request comes back 401, the session read answers
 * `null`, and the store settles on `anonymous`. A guard that sees `anonymous`
 * renders the sign-in page, and the sign-in page asks nothing about the session
 * — so the loop has nowhere to form.
 */

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth.store';
import type { AuthStatus } from '@/store/auth.store';
import type { LoginInput, RegisterInput, User } from '@/types/user';
import { errorMessageOf } from '@/hooks/useProducts';

import { useLogin, useLogout, useRegister, useSession } from '@/features/auth/auth.queries';
import type { AuthResult } from '@/features/auth/auth.types';

export type Auth = {
  /** The signed-in account, or `null`. */
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  /**
   * The session is not yet known: a stored token exists and the server has not
   * answered. A guard waits while this is true rather than redirecting.
   */
  isHydrating: boolean;
  /** The session request is in flight, whether or not a token exists. */
  isLoading: boolean;
  /** The session request failed for a reason other than "not signed in". */
  errorMessage: string | null;
  /** Signs in. Rejects with an `ApiError` the form turns into a message. */
  login: (input: LoginInput) => Promise<AuthResult>;
  /** Creates an account. Rejects with an `ApiError` on a duplicate address. */
  register: (input: RegisterInput) => Promise<AuthResult>;
  /** Signs out. Resolves once storage and the cache hold nothing. */
  logout: () => Promise<void>;
  /** Asks the server who is signed in again, without a reload. */
  refresh: () => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
  isLoggingOut: boolean;
  /** Any of the three is in flight, for a control that must not be pressed twice. */
  isPending: boolean;
};

export function useAuth(): Auth {
  const session = useSession();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);

  const account = session.data ?? null;

  /**
   * A session read that failed for a reason other than "nobody is signed in" —
   * the network, a server that is briefly unwell. The token stays where it is,
   * but a guard must not wait for an answer that is not coming, and the sign-in
   * page must not refuse to draw its form because of it: that pair is what a
   * wait-with-no-end would look like.
   */
  const unconfirmed = status === 'hydrating' && session.isError && account === null;

  /**
   * The one place the store is written from the session read. `session.data` is
   * a stable object from the query cache, so this runs when the answer changes
   * and not on every render.
   */
  useEffect(() => {
    if (!session.isSuccess) {
      return;
    }

    if (account === null) {
      useAuthStore.getState().settleAnonymous();
      return;
    }

    useAuthStore.getState().setSession(account);
  }, [session.isSuccess, account]);

  const login = async (input: LoginInput): Promise<AuthResult> => {
    // The token is written to storage by the request itself, before this
    // resolves, so the session is complete by the time a caller navigates.
    const result = await loginMutation.mutateAsync(input);

    useAuthStore.getState().setSession(result.user, result.tokens.accessToken);

    return result;
  };

  const register = async (input: RegisterInput): Promise<AuthResult> => {
    const result = await registerMutation.mutateAsync(input);

    useAuthStore.getState().setSession(result.user, result.tokens.accessToken);

    return result;
  };

  const logout = async (): Promise<void> => {
    await logoutMutation.mutateAsync();
    useAuthStore.getState().clear();
  };

  return {
    user: account ?? user,
    status,
    isAuthenticated: account !== null || status === 'authenticated',
    isHydrating: status === 'hydrating' && !unconfirmed,
    isLoading: session.isLoading,
    errorMessage: session.isError ? errorMessageOf(session.error) : null,
    login,
    register,
    logout,
    refresh: () => {
      void session.refetch();
    },
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isPending: loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
  };
}
