/**
 * Account requests.
 *
 * Signing in and registering both answer with a session, and both write the
 * access token to storage here — before the caller sees the result — so every
 * request made afterwards carries it. `me` reads the account the stored token
 * belongs to; the api client already drops the token and answers 401 when the
 * server no longer accepts it.
 *
 * Nothing here touches TanStack Query: the hooks in `auth.queries.ts` own keys,
 * caching, and the query cache the session belongs to.
 */

import { api } from '@/services/api';
import type { ApiResponse } from '@/types/api';
import type { AuthSession, LoginInput, RegisterInput } from '@/types/user';
import { setAccessToken } from '@/utils/storage';

import type { AuthResult, MeResult } from './auth.types';

/** Writes the token and reports whether storage accepted it. */
function persistSession(session: AuthSession): AuthResult {
  return { ...session, persisted: setAccessToken(session.tokens.accessToken) };
}

export const authApi = {
  /** Creates an account. Answers 409 when the address is already registered. */
  async register(input: RegisterInput): Promise<AuthResult> {
    const response = await api.post<ApiResponse<AuthSession>>('/auth/register', input, {
      auth: false,
    });

    return persistSession(response.data);
  },

  /** Signs in. Answers 401 when the address or the password is wrong. */
  async login(input: LoginInput): Promise<AuthResult> {
    const response = await api.post<ApiResponse<AuthSession>>('/auth/login', input, {
      auth: false,
    });

    return persistSession(response.data);
  },

  /** The signed-in account. Answers 401 when the stored token is gone or expired. */
  async me(): Promise<MeResult> {
    const response = await api.get<ApiResponse<MeResult>>('/auth/me');

    return response.data;
  },
};
