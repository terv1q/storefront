/**
 * How the order is paid.
 *
 * The options are the ones the API publishes as part of the delivery policy,
 * filtered to the two codes a checkout accepts, so the list on screen is the
 * list the server will accept — the payment step cannot offer a method the
 * order endpoint would refuse.
 *
 * Card payment is simulated in this version, and the panel says so in words
 * rather than implying otherwise with a row of card boxes. Nothing here reads,
 * formats, or sends a card number: there is no card number to read. When a real
 * gateway is added it is this component that grows the fields, and the note
 * under the options that stops being true.
 */

import { CreditCard, Wallet } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { PAYMENT_METHODS } from '@/features/checkout/checkout.rules';
import type { PaymentMethod } from '@/types/order';

type Props = {
  value: PaymentMethod;
  /** The codes the store publishes. Anything else the API sends is ignored. */
  published: readonly string[];
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
};

const METHOD_ICONS = { CARD: CreditCard, CASH: Wallet } as const;

/**
 * The published methods, in the store's order, with anything the checkout does
 * not accept left out — and a hard-coded answer when the policy has not arrived
 * yet or has stopped listing either of them.
 */
export function paymentOptions(published: readonly string[]): PaymentMethod[] {
  const known = PAYMENT_METHODS.filter((method) => published.includes(method));

  return known.length > 0 ? [...known] : [...PAYMENT_METHODS];
}

export function PaymentForm({ value, published, onChange, disabled = false, className }: Props) {
  const methods = paymentOptions(published);

  return (
    <fieldset className={cn('flex flex-col gap-4', className)} disabled={disabled}>
      <legend className="sr-only">{strings.checkout.payment.heading}</legend>

      <div>
        <h2 className="text-lg font-semibold text-ink-900">{strings.checkout.payment.heading}</h2>
        <p className="mt-1 text-sm text-ink-600">{strings.checkout.payment.body}</p>
      </div>

      <div className="flex flex-col gap-3">
        {methods.map((method) => {
          const Icon = METHOD_ICONS[method];
          const copy = strings.checkout.payment.methods[method];
          const selected = value === method;

          return (
            <label
              key={method}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-card border p-4 transition-colors',
                'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-600',
                selected
                  ? 'border-brand-700 bg-brand-50/40'
                  : 'border-border hover:bg-surface-muted',
              )}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={method}
                checked={selected}
                onChange={() => onChange(method)}
                className="mt-0.5 size-4 accent-brand-700"
              />

              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
                  <Icon aria-hidden="true" size={16} className="text-ink-600" />
                  {copy.name}
                </span>
                <span className="text-xs text-ink-600">{copy.body}</span>
              </span>
            </label>
          );
        })}
      </div>

      <p
        className={cn(
          'rounded-control border border-warning-600 bg-warning-50 px-4 py-3 text-sm text-ink-900',
        )}
      >
        <span className="font-medium">{strings.checkout.payment.testMode}</span>{' '}
        {strings.checkout.payment.testModeBody}
      </p>
    </fieldset>
  );
}
