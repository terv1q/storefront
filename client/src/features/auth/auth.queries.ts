/**
 * Account queries and mutations.
 *
 * The session lives in one cache entry under `queryKeys.auth.me()`. Signing in
 * and registering write it there directly from their response — the server has
 * just told the client who it is, so a second request for the same account would
 * be wasted. Signing out removes the token and drops the whole cache, because
 * everything in it belonged to the account that just left.
 *
 * A 401 on `me` is not an error worth showing: it means nobody is signed in, and
 * that is a normal state. The query reports `null` and the pages that need an
 * account redirect.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import { isApiError } from '@/types/api';
import type { LoginInput, RegisterInput } from '@/types/user';
import { clearAuthStorage } from '@/utils/storage';

import { authApi } from './auth.api';
import type { AuthResult, MeResult } from './auth.types';

/**
 * The signed-in account, or `null`.
 *
 * This runs with or without a stored token. Carrying a token is not something a
 * component can watch, so gating the request on one would leave the session
 * unknown after a sign-in elsewhere in the app. Asking and treating 401 as
 * "nobody is signed in" is both simpler and always current.
 */
export function useSession(): UseQueryResult<MeResult | null, unknown> {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async () => {
      try {
        return await authApi.me();
      } catch (error) {
        // Not signed in is an answer, not a failure.
        if (isApiError(error) && error.status === 401) {
          return null;
        }

        throw error;
      }
    },
    staleTime: STALE_TIME.session,
    retry: retryQuery,
  });
}

export function useLogin(): UseMutationResult<AuthResult, Error, LoginInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (result) => {
      // The response carries the account, so it seeds the session entry instead
      // of being fetched back. Anything that was cached for the previous session
      // is dropped: orders and the wishlist belong to an account.
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me(), result.user);
    },
  });
}

export function useRegister(): UseMutationResult<AuthResult, Error, RegisterInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => authApi.register(input),
    onSuccess: (result) => {
      queryClient.clear();
      queryClient.setQueryData(queryKeys.auth.me(), result.user);
    },
  });
}

/**
 * Signing out. There is no server call to make — the token is the whole session
 * — so this clears storage and the cache. It is a mutation rather than a plain
 * function so a caller can hook `onSuccess` and navigate away.
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      clearAuthStorage();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
