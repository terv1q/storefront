/**
 * Account requests.
 *
 * Everything here acts on the account the stored token names, so no call takes
 * a user id and the server reads the owner from the session. An address is
 * addressed by the pair (owner, id) on the server, which means another
 * account's address id answers 404 rather than being editable.
 *
 * `PATCH /api/users/me/password` answers 422 with the message filed under
 * `fields.currentPassword` when the current password is wrong: the session is
 * fine, one box is not, and a 401 would make the api client drop a session that
 * is still valid.
 */

import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';
import type {
  Address,
  AddressInput,
  ChangePasswordInput,
  UpdateProfileInput,
  User,
} from '@/types/user';

export const accountApi = {
  /** Changes the name and the phone number. */
  async updateProfile(input: UpdateProfileInput): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/users/me', input);

    return response.data;
  },

  /** Changes the password, given the current one. Answers with no body. */
  async changePassword(input: ChangePasswordInput): Promise<void> {
    await api.patch<ApiResponse<null>>('/users/me/password', input);
  },

  /** The saved addresses, the default one first. */
  async listAddresses(): Promise<Address[]> {
    const response = await api.get<ApiResponse<Address[]>>('/users/me/addresses');

    return response.data;
  },

  async createAddress(input: AddressInput): Promise<Address> {
    const response = await api.post<ApiResponse<Address>>('/users/me/addresses', input);

    return response.data;
  },

  async updateAddress(id: string, input: Partial<AddressInput>): Promise<Address> {
    const response = await api.patch<ApiResponse<Address>>(
      `/users/me/addresses/${encodeURIComponent(id)}`,
      input,
    );

    return response.data;
  },

  /** Removes an address. Answers 204 with no body. */
  async removeAddress(id: string): Promise<void> {
    await api.delete<void>(`/users/me/addresses/${encodeURIComponent(id)}`);
  },
};
