/**
 * Account queries and mutations.
 *
 * The profile and the addresses are two resources with one owner, and both
 * change what the rest of the app shows: the header greets the account by name,
 * and an address saved here is what the checkout offers next time. So a
 * successful write puts the server's own answer into the cache rather than
 * leaving a page to refetch it — the profile response is a `User`, which is
 * exactly the shape the session entry holds.
 *
 * The addresses are idle until there is a session, for the same reason the
 * orders are: without one the request can only answer 401.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth.queries';
import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import type {
  Address,
  AddressInput,
  ChangePasswordInput,
  UpdateProfileInput,
  User,
} from '@/types/user';

import { accountApi } from './account.api';

/** The account's saved addresses. */
export function useAddresses(): UseQueryResult<Address[], unknown> {
  const session = useSession();

  return useQuery({
    queryKey: queryKeys.account.addresses(),
    queryFn: () => accountApi.listAddresses(),
    enabled: session.data != null,
    staleTime: STALE_TIME.session,
    retry: retryQuery,
  });
}

/** Changes the name and the phone number, and updates the session in place. */
export function useUpdateProfile(): UseMutationResult<User, Error, UpdateProfileInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => accountApi.updateProfile(input),
    onSuccess: (user) => {
      // The response is the account, so the header's greeting changes on the
      // same answer that saved the form.
      queryClient.setQueryData(queryKeys.auth.me(), user);
    },
  });
}

/**
 * Changes the password.
 *
 * Nothing is cached from the answer — it has no body — and nothing is
 * invalidated: the session is the same session, and the token it holds stays
 * valid because this version has no session table to revoke.
 */
export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordInput> {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => accountApi.changePassword(input),
  });
}

/** What saving an address takes: the fields, and the row it replaces if any. */
export type SaveAddressInput = AddressInput & { id?: string };

/**
 * Adds an address or changes one. Both paths answer with the address, so the
 * list is patched from the response and then invalidated: setting a default
 * clears the flag on the others, and only the server knows which ones those
 * were.
 */
export function useSaveAddress(): UseMutationResult<Address, Error, SaveAddressInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: SaveAddressInput) =>
      id === undefined ? accountApi.createAddress(input) : accountApi.updateAddress(id, input),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.addresses() });
    },
  });
}

/** Removes an address. The list is refetched, because a default may have gone. */
export function useRemoveAddress(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => accountApi.removeAddress(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.account.addresses() });
    },
  });
}
