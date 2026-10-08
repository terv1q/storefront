/**
 * Turning a broken rule into the sentence that explains it.
 *
 * The schemas in `features/auth/auth.rules.ts` carry keys rather than copy, so
 * the same rule reads correctly in every language. This is where a key becomes
 * a sentence — the one place it happens for both auth forms, so a key added to
 * a schema has one obvious place to be given words.
 */

import { strings } from '@/i18n/strings';

export function authFieldMessage(key: string): string {
  const copy = strings.auth.fields;

  switch (key) {
    case 'emailRequired':
      return copy.emailRequired;
    case 'emailInvalid':
      return copy.emailInvalid;
    case 'emailTooLong':
      return copy.emailTooLong;
    case 'passwordRequired':
      return copy.passwordRequired;
    case 'passwordShort':
      return copy.passwordShort;
    case 'passwordLong':
      return copy.passwordLong;
    case 'confirmRequired':
      return copy.confirmRequired;
    case 'passwordMismatch':
      return copy.passwordMismatch;
    case 'firstNameRequired':
      return copy.firstNameRequired;
    case 'firstNameTooLong':
      return copy.firstNameTooLong;
    case 'lastNameRequired':
      return copy.lastNameRequired;
    case 'lastNameTooLong':
      return copy.lastNameTooLong;
    case 'phoneInvalid':
      return copy.phoneInvalid;
    case 'phoneTooLong':
      return copy.phoneTooLong;
    default:
      return strings.errors.generic;
  }
}
