/**
 * Turning a broken checkout rule into the sentence that explains it.
 *
 * The schemas in `features/checkout/checkout.rules.ts` carry keys rather than
 * copy, so the same rule reads correctly in every language. This is where a key
 * becomes a sentence, so a key added to a schema has one obvious place to be
 * given words — `components/auth/messages.ts` does the same for the sign-in
 * forms.
 */

import { strings } from '@/i18n/strings';

export function checkoutFieldMessage(key: string): string {
  const copy = strings.checkout.fields;

  switch (key) {
    case 'nameRequired':
      return copy.nameRequired;
    case 'nameTooLong':
      return copy.nameTooLong;
    case 'emailRequired':
      return copy.emailRequired;
    case 'emailInvalid':
      return copy.emailInvalid;
    case 'emailTooLong':
      return copy.emailTooLong;
    case 'phoneRequired':
      return copy.phoneRequired;
    case 'phoneInvalid':
      return copy.phoneInvalid;
    case 'phoneTooLong':
      return copy.phoneTooLong;
    case 'countryRequired':
      return copy.countryRequired;
    case 'countryTooLong':
      return copy.countryTooLong;
    case 'cityRequired':
      return copy.cityRequired;
    case 'cityTooLong':
      return copy.cityTooLong;
    case 'streetRequired':
      return copy.streetRequired;
    case 'streetTooLong':
      return copy.streetTooLong;
    case 'postalCodeTooLong':
      return copy.postalCodeTooLong;
    case 'notesTooLong':
      return copy.notesTooLong;
    default:
      return strings.errors.generic;
  }
}
