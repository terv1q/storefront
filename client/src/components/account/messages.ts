/**
 * Turning a broken account rule into the sentence that explains it.
 *
 * Most of the keys the account schemas produce are the auth schemas' own — a
 * phone number typed into the account form is refused in the same words as one
 * typed at registration — so those are handed to `authFieldMessage` rather than
 * rewritten here. Only the keys this stage added have copy of their own, and it
 * lives under `strings.account.fields`.
 */

import { authFieldMessage } from '@/components/auth/messages';
import { strings } from '@/i18n/strings';

/** The keys the account schemas own, rather than borrowing from the auth ones. */
const OWN_KEYS = [
  'currentRequired',
  'phoneRequired',
  'labelTooLong',
  'fullNameRequired',
  'fullNameTooLong',
  'countryRequired',
  'countryTooLong',
  'cityRequired',
  'cityTooLong',
  'streetRequired',
  'streetTooLong',
  'postalCodeTooLong',
] as const;

type OwnKey = (typeof OWN_KEYS)[number];

function isOwnKey(key: string): key is OwnKey {
  return (OWN_KEYS as readonly string[]).includes(key);
}

export function accountFieldMessage(key: string): string {
  if (!isOwnKey(key)) {
    return authFieldMessage(key);
  }

  return strings.account.fields[key];
}
