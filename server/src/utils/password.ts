/**
 * Password hashing. bcrypt with a cost factor of 12, which is the value the
 * checklist fixes for the server.
 *
 * Hashing is CPU-bound and takes roughly a quarter of a second at this cost, so
 * every function here is asynchronous and the event loop keeps serving requests
 * while a hash is computed.
 */

import bcrypt from 'bcryptjs';

/** Work factor. Raising it makes every guess slower for an attacker and us. */
export const BCRYPT_COST = 12;

/** bcrypt only reads the first 72 bytes of a password and ignores the rest. */
export const MAX_PASSWORD_BYTES = 72;

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_COST);
}

/** True when the password matches the stored hash. Never throws on a bad hash. */
export async function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plainPassword, passwordHash);
  } catch {
    return false;
  }
}
