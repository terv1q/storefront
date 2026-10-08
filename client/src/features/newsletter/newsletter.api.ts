/**
 * Newsletter signup.
 *
 * There is no subscription endpoint in this version: `server/src/routes` has no
 * newsletter router, and inventing one here would mean the form posts into a 404. The
 * address is therefore recorded on the device — under `ziyo:newsletterEmails`, newest
 * first, deduplicated — and `subscribeToNewsletter` is the single place a real
 * `POST /api/newsletter` replaces that write. It already returns a promise and already
 * distinguishes "saved now" from "already on the list", which is exactly the answer a
 * server would give, so the form around it does not change when the call becomes real.
 *
 * The address is validated before it is stored, and it is normalised first: a trailing
 * space or a capital letter does not make a second subscriber, so the comparison runs
 * on the lower-cased trimmed value.
 */

import { z } from 'zod';

import { STORAGE_KEYS, readJson, writeJson } from '@/utils/storage';

/** How many addresses one device remembers. Older ones fall off the end. */
const MAX_REMEMBERED = 20;

export const newsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: 'Enter your email address.' })
    .max(254, { message: 'That email address is too long.' })
    .refine((value) => z.email().safeParse(value).success, {
      message: 'Enter a valid email address.',
    }),
});

export type NewsletterResult = 'saved' | 'known';

function readEmails(): string[] {
  const stored = readJson<unknown>(STORAGE_KEYS.newsletterEmails, []);

  return Array.isArray(stored)
    ? stored.filter((item): item is string => typeof item === 'string')
    : [];
}

/**
 * Records an address. Resolves to `known` when this device has already stored it, so
 * the form can say so rather than claim a second signup.
 */
export async function subscribeToNewsletter(input: { email: string }): Promise<NewsletterResult> {
  const email = input.email.trim().toLowerCase();
  const existing = readEmails();

  if (existing.includes(email)) {
    return 'known';
  }

  writeJson(STORAGE_KEYS.newsletterEmails, [email, ...existing].slice(0, MAX_REMEMBERED));

  return 'saved';
}
