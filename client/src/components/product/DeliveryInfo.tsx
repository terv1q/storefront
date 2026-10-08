/**
 * Delivery, returns, and payment.
 *
 * The half of the panel that does not depend on an address is drawn from the
 * first paint: how long a shopper may change their mind, what delivery costs at
 * least, and how orders may be paid. None of those is a fact about the shopper,
 * and making somebody type a postal code to read the returns policy would hide
 * the policy from the people who most need it.
 *
 * The postal code is a form, not a field that queries as it is typed. A code has
 * six digits and no meaning until it has all of them, so asking on every keystroke
 * would be five refusals per address. The field holds what was typed; the button
 * asks.
 *
 * A code outside every service area is an answer, not an error: the server says
 * so with no quote, and the panel repeats it in words and says what is still
 * possible — collecting from the store. That is the case the whole endpoint exists
 * to be able to state.
 */

import { LoaderCircle, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

import { isCompletePostalCode } from '@/features/products/delivery.queries';
import { useDeliveryEstimate } from '@/hooks/useDelivery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  className?: string;
};

export function DeliveryInfo({ className }: Props) {
  const fieldId = useId();
  const messageId = `${fieldId}-message`;

  const [input, setInput] = useState('');
  /** The code that was submitted, which is what the panel answers for. */
  const [asked, setAsked] = useState('');
  const [error, setError] = useState<string | null>(null);

  const estimate = useDeliveryEstimate(asked);
  const policy = estimate.data?.policy;
  const quote = estimate.data?.quote;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isCompletePostalCode(input)) {
      setError(strings.productPage.delivery.invalidZip);
      return;
    }

    setError(null);
    setAsked(input.trim());
  };

  return (
    <section
      aria-labelledby={`${fieldId}-heading`}
      className={cn('rounded-card border border-border bg-surface p-4', className)}
    >
      <h2
        id={`${fieldId}-heading`}
        className="text-sm font-semibold tracking-wide text-ink-900 uppercase"
      >
        {strings.productPage.delivery.heading}
      </h2>

      <form onSubmit={submit} noValidate className="mt-3">
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink-900">
          {strings.productPage.delivery.zipLabel}
        </label>

        <div className="mt-2 flex gap-2">
          <input
            id={fieldId}
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={input}
            placeholder={strings.productPage.delivery.zipPlaceholder}
            aria-invalid={error !== null}
            aria-describedby={messageId}
            onChange={(event) => {
              setInput(event.target.value.replace(/\D/g, '').slice(0, 6));
              setError(null);
            }}
            className={cn(
              'h-10 w-32 rounded-control border border-border bg-surface px-3 text-sm text-ink-900 placeholder:text-ink-400',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              error !== null && 'border-danger-600',
            )}
          />

          <button
            type="submit"
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-control border border-ink-900 px-4 text-sm font-medium text-ink-900',
              'transition-colors hover:bg-ink-900 hover:text-white',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            )}
          >
            {estimate.isFetching ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            {estimate.isFetching
              ? strings.productPage.delivery.checking
              : strings.productPage.delivery.check}
          </button>
        </div>

        {/* Held open whether or not it has something to say, so the panel does not
            jump when an answer arrives. */}
        <p
          id={messageId}
          role={error !== null ? 'alert' : undefined}
          className={cn(
            'mt-2 min-h-5 text-xs',
            error !== null ? 'text-danger-600' : 'text-ink-500',
          )}
        >
          {error ?? (asked === '' ? strings.productPage.delivery.zipHint : '')}
        </p>
      </form>

      {estimate.isError ? (
        <p role="alert" className="text-sm text-danger-600">
          {estimate.errorMessage ?? strings.productPage.delivery.failed}
        </p>
      ) : null}

      {/* `undefined` is "not answered yet", which is what keeps the panel still
          while a new code is on its way; `null` is the server saying it does not
          deliver there, which is an answer and is written out below. */}
      {asked !== '' && !estimate.isError && !estimate.isFetching && quote !== undefined ? (
        quote === null ? (
          <p className="text-sm text-ink-700">{strings.productPage.delivery.outside}</p>
        ) : (
          <div className="flex gap-2 rounded-control bg-surface-muted p-3">
            <MapPin aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-ink-500" />

            <div className="min-w-0 text-sm text-ink-700">
              <p className="font-medium text-ink-900">
                {strings.productPage.delivery.toZone(quote.zone.name)}
              </p>
              <p className="mt-1">
                {strings.productPage.delivery.days(
                  quote.zone.deliveryDaysMin,
                  quote.zone.deliveryDaysMax,
                )}{' '}
                <span aria-hidden="true">·</span>{' '}
                {quote.zone.fee === 0
                  ? strings.productPage.delivery.free
                  : strings.productPage.delivery.fee(formatPrice(quote.zone.fee))}
              </p>

              {quote.zone.pickupAvailable ? (
                <p className="mt-1">{strings.productPage.delivery.pickup}</p>
              ) : null}
            </div>
          </div>
        )
      ) : null}

      {policy !== undefined ? (
        <ul className="mt-3 flex flex-col gap-2 p-0 text-sm text-ink-700">
          <li className="flex gap-2">
            <ShieldCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-ink-500" />
            <span>
              <span className="font-medium text-ink-900">
                {strings.productPage.delivery.returns(policy.returnWindowDays)}
              </span>
              <br />
              {strings.productPage.delivery.returnsBody}
            </span>
          </li>

          {policy.freeDeliveryFrom !== null ? (
            <li className="flex gap-2">
              <PackageCheck aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-ink-500" />
              <span>
                {strings.productPage.delivery.freeFrom(formatPrice(policy.freeDeliveryFrom))}
              </span>
            </li>
          ) : null}
        </ul>
      ) : null}

      {policy !== undefined && policy.paymentMethods.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-semibold tracking-wide text-ink-600 uppercase">
            {strings.productPage.delivery.paymentsHeading}
          </p>

          <ul className="mt-2 flex flex-wrap gap-2 p-0">
            {policy.paymentMethods.map((method) => (
              <li
                key={method}
                className="rounded-control border border-border bg-surface-muted px-2 py-1 text-xs text-ink-700"
              >
                {/* A code the interface has no words for is shown as the code. It
                    is a payment method the server accepts and this build cannot
                    name, and hiding it would be worse than spelling it oddly. */}
                {strings.productPage.delivery.payments[method] ?? method}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
