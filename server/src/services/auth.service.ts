/**
 * Account creation and sign-in.
 *
 * The service owns every rule about credentials; the controller only shapes a
 * response and the routes only validate input. Two habits are deliberate here:
 *
 *   - the email is stored and compared in lower case, so `Oybek@…` and
 *     `oybek@…` are the same account,
 *   - a sign-in for an address that does not exist still performs one bcrypt
 *     comparison against a throwaway hash, so the response time does not reveal
 *     whether the address is registered.
 */

import { prisma } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';
import { ACCESS_TOKEN_TTL_SECONDS, signAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/** Cost-12 hash of a password nobody knows, used only to burn comparison time. */
const DECOY_PASSWORD_HASH = '$2b$12$DPnfKHsXtmONnjj4FbNTfesP60JVaX4V8bbPKZ7X2DdRwX08BnRJG';

/** The account fields the API returns. Mirrors `User` in the client types. */
export type PublicUser = {
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
  tokenType: 'Bearer';
  /** Lifetime of the access token in seconds. */
  expiresIn: number;
};

export type AuthSession = {
  user: PublicUser;
  tokens: AuthTokens;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

type AccountRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Drops the password hash and turns the dates into ISO strings. */
export function toPublicUser(user: AccountRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function issueSession(user: AccountRecord): AuthSession {
  return {
    user: toPublicUser(user),
    tokens: {
      accessToken: signAccessToken(user),
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const email = normalizeEmail(input.email);

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });

  if (existing !== null) {
    throw ApiError.conflict('email_taken', 'An account with this email already exists.', {
      fields: { email: 'This email is already registered.' },
    });
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() ?? null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return issueSession(user);
  } catch (error) {
    // Two registrations for the same address can pass the check above at the
    // same moment; the unique index is what actually decides, so its failure is
    // reported as the same conflict rather than a 500.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      throw ApiError.conflict('email_taken', 'An account with this email already exists.', {
        fields: { email: 'This email is already registered.' },
      });
    }

    throw error;
  }
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const email = normalizeEmail(input.email);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      passwordHash: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // One comparison either way, so a wrong address and a wrong password take the
  // same time and return the same message.
  const passwordMatches = await verifyPassword(
    input.password,
    user?.passwordHash ?? DECOY_PASSWORD_HASH,
  );

  if (user === null || !passwordMatches) {
    throw ApiError.invalidCredentials();
  }

  return issueSession(user);
}

/** Reads the account behind a verified token. */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user === null) {
    throw ApiError.invalidToken('This account no longer exists.');
  }

  return toPublicUser(user);
}
