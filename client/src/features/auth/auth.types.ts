/**
 * Account types for the client data layer.
 *
 * `User`, `AuthSession`, `LoginInput`, and `RegisterInput` already exist in
 * `@/types/user` and match what the server sends, so they are re-exported rather
 * than restated. What this file adds is the shape of the calls themselves: what
 * the sign-in form has to send, and what a caller gets back once the access
 * token has been stored.
 */

import type { AuthSession, RegisterInput, User } from '@/types/user';

export type { AuthSession, AuthTokens, LoginInput, RegisterInput, User } from '@/types/user';

/** Body of `POST /api/auth/login`. */
export type LoginRequest = {
  email: string;
  password: string;
};

/** Body of `POST /api/auth/register`. */
export type RegisterRequest = RegisterInput;

/**
 * The result of signing in or registering: the account, plus the token that was
 * written to storage. The token is repeated here so a caller that has to chain
 * another request can use it without reading storage back.
 */
export type AuthResult = AuthSession & {
  /** Whether the access token was successfully written to `localStorage`. */
  persisted: boolean;
};

/** `GET /api/auth/me` answers with the account itself, not a session. */
export type MeResult = User;
