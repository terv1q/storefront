/**
 * Who the order is for.
 *
 * Three fields, all of them things the shop needs to reach a person about a
 * parcel: a name for the courier, an email for the order confirmation, and a
 * phone number for the call before delivery. Nothing else is asked here, and
 * nothing here is remembered in the browser — the values live in the page's
 * state and leave it with the order.
 *
 * A signed-in shopper finds the boxes already filled in from their account,
 * which is offered rather than assumed: the sentence above says so, so a
 * delivery to somebody else is not a field that quietly holds the wrong name.
 *
 * The fields are a `<fieldset>` because they are one question, and the error
 * for each one is tied to its input by `Input`.
 */

import { Input } from '@/components/common/Input';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type {
  CheckoutFieldErrors,
  CheckoutFormValues,
  CheckoutTextField,
} from '@/features/checkout/checkout.rules';

import { checkoutFieldMessage } from './messages';

type ContactValues = Pick<CheckoutFormValues, 'customerName' | 'customerEmail' | 'customerPhone'>;

type Props = {
  values: ContactValues;
  errors: CheckoutFieldErrors;
  onChange: (field: CheckoutTextField, value: string) => void;
  /** The boxes were filled in from the account rather than typed. */
  prefilled?: boolean;
  disabled?: boolean;
  className?: string;
};

export function ContactForm({
  values,
  errors,
  onChange,
  prefilled = false,
  disabled = false,
  className,
}: Props) {
  /** The message under a field: the key from the schema, turned into copy. */
  const messageFor = (field: keyof ContactValues): string | undefined => {
    const key = errors[field];

    return key === undefined ? undefined : checkoutFieldMessage(key);
  };

  return (
    <fieldset className={cn('flex flex-col gap-4', className)} disabled={disabled}>
      <legend className="sr-only">{strings.checkout.contact.heading}</legend>

      <div>
        <h2 className="text-lg font-semibold text-ink-900">{strings.checkout.contact.heading}</h2>
        <p className="mt-1 text-sm text-ink-600">
          {prefilled ? strings.checkout.contact.prefilledNote : strings.checkout.contact.body}
        </p>
      </div>

      <Input
        label={strings.checkout.contact.nameLabel}
        name="customerName"
        autoComplete="name"
        value={values.customerName}
        onChange={(event) => onChange('customerName', event.target.value)}
        error={messageFor('customerName')}
      />

      <Input
        label={strings.checkout.contact.emailLabel}
        name="customerEmail"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={values.customerEmail}
        onChange={(event) => onChange('customerEmail', event.target.value)}
        error={messageFor('customerEmail')}
        helperText={strings.checkout.contact.emailHelper}
      />

      <Input
        label={strings.checkout.contact.phoneLabel}
        name="customerPhone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={strings.auth.phonePlaceholder}
        value={values.customerPhone}
        onChange={(event) => onChange('customerPhone', event.target.value)}
        error={messageFor('customerPhone')}
        helperText={strings.checkout.contact.phoneHelper}
      />
    </fieldset>
  );
}
