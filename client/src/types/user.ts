/**
 * Account shapes. Dates are ISO 8601 strings.
 *
 * There is no refresh token in the first version: a session is one access
 * token, and an expired token is handled by signing in again.
 */

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  tokenType: string;
  /** Lifetime of the access token in seconds. */
  expiresIn: number;
};

/** Response of a successful register or login call. */
export type AuthSession = {
  user: User;
  tokens: AuthTokens;
};

/** A saved delivery address. */
export type Address = {
  id: string;
  userId: string;
  /** User-chosen name such as `Home` or `Office`. */
  label: string | null;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string | null;
  isDefault: boolean;
};

/** What changing the profile sends. The email is the sign-in identity and is not sent. */
export type UpdateProfileInput = {
  firstName: string;
  lastName: string;
  phone?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

/** What saving an address sends. Absent fields keep their stored value on an update. */
export type AddressInput = {
  label?: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode?: string;
  isDefault?: boolean;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
};
