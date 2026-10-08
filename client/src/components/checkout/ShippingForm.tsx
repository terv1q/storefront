/**
 * Where the order goes, and how it gets there.
 *
 * The address and the delivery method are one question rather than two: a
 * pickup order still records an address, because the shop keeps it with the
 * order, and a courier order is the one that needs a street. The method is
 * chosen first for that reason — what the address is for changes with it — and
 * the fields under it are the same either way.
 *
 * The estimate line under the address is the API's own answer for the postal
 * code that was typed: the zone, the window it promises, and what delivery
 * costs. It is drawn only when the code is complete, because a half-typed code
 * has no answer, and a "no delivery to this address" verdict for four digits
 * would be a verdict about something else.
 */

import { Truck, Store } from 'lucide-react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Input } from '@/components/common/Input';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type {
  CheckoutFieldErrors,
  CheckoutFormValues,
  CheckoutTextField,
} from '@/features/checkout/checkout.rules';
import { DELIVERY_METHODS } from '@/features/checkout/checkout.rules';
import type { DeliveryEstimate } from '@/features/products/delivery.types';
import type { DeliveryMethod } from '@/types/order';
import { formatPrice } from '@/utils/formatPrice';

import { checkoutFieldMessage } from './messages';

type ShippingValues = Pick<
  CheckoutFormValues,
  'country' | 'city' | 'street' | 'postalCode' | 'deliveryMethod' | 'notes'
>;

type Props = {
  values: ShippingValues;
  errors: CheckoutFieldErrors;
  onChange: (field: CheckoutTextField, value: string) => void;
  onMethodChange: (method: DeliveryMethod) => void;
  /** The store's answer for the postal code, when one has been checked. */
  estimate: DeliveryEstimate | null;
  isEstimating: boolean;
  disabled?: boolean;
  className?: string;
};

const METHOD_ICONS = { COURIER: Truck, PICKUP: Store } as const;

export function ShippingForm({
  values,
  errors,
  onChange,
  onMethodChange,
  estimate,
  isEstimating,
  disabled = false,
  className,
}: Props) {
  const messageFor = (field: keyof ShippingValues): string | undefined => {
    const key = errors[field];

    return key === undefined ? undefined : checkoutFieldMessage(key);
  };

  /** The estimate paragraph, announced when its text changes. */
  const messageId = 'checkout-delivery-estimate';

  return (
    <fieldset className={cn('flex flex-col gap-4', className)} disabled={disabled}>
      <legend className="sr-only">{strings.checkout.shipping.heading}</legend>

      <div>
        <h2 className="text-lg font-semibold text-ink-900">{strings.checkout.shipping.heading}</h2>
        <p className="mt-1 text-sm text-ink-600">{strings.checkout.shipping.body}</p>
      </div>

      {/* The method first: what the address is for changes with it. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {DELIVERY_METHODS.map((method) => {
          const Icon = METHOD_ICONS[method];
          const copy = strings.checkout.shipping.methods[method];
          const selected = values.deliveryMethod === method;

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
                name="deliveryMethod"
                value={method}
                checked={selected}
                onChange={() => onMethodChange(method)}
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={strings.checkout.shipping.countryLabel}
          name="country"
          autoComplete="country-name"
          value={values.country}
          onChange={(event) => onChange('country', event.target.value)}
          error={messageFor('country')}
        />

        <Input
          label={strings.checkout.shipping.cityLabel}
          name="city"
          autoComplete="address-level2"
          value={values.city}
          onChange={(event) => onChange('city', event.target.value)}
          error={messageFor('city')}
        />
      </div>

      <Input
        label={strings.checkout.shipping.streetLabel}
        name="street"
        autoComplete="street-address"
        value={values.street}
        onChange={(event) => onChange('street', event.target.value)}
        error={messageFor('street')}
      />

      <Input
        label={strings.checkout.shipping.postalCodeLabel}
        name="postalCode"
        inputMode="numeric"
        autoComplete="postal-code"
        value={values.postalCode}
        onChange={(event) => onChange('postalCode', event.target.value)}
        error={messageFor('postalCode')}
        helperText={strings.checkout.shipping.postalCodeHelper}
      />

      {/* The estimate is a status rather than an alert: it changes as the code
          is typed, and announcing every keystroke would be noise. */}
      <p id={messageId} aria-live="polite" className="text-sm text-ink-600">
        {isEstimating ? strings.checkout.shipping.estimating : describeEstimate(estimate, values)}
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="checkout-notes" className="text-sm font-medium text-ink-900">
          {strings.checkout.shipping.notesLabel}
        </label>

        <textarea
          id="checkout-notes"
          name="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => onChange('notes', event.target.value)}
          placeholder={strings.checkout.shipping.notesPlaceholder}
          aria-invalid={errors.notes !== undefined}
          aria-describedby={
            errors.notes === undefined ? 'checkout-notes-helper' : 'checkout-notes-error'
          }
          className={cn(
            'rounded-control border bg-surface px-3 py-2 text-sm text-ink-900',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            errors.notes === undefined ? 'border-border' : 'border-danger-600',
          )}
        />

        {errors.notes === undefined ? (
          <p id="checkout-notes-helper" className="text-xs text-ink-500">
            {strings.checkout.shipping.notesHelper}
          </p>
        ) : (
          <ErrorMessage id="checkout-notes-error">
            {checkoutFieldMessage(errors.notes)}
          </ErrorMessage>
        )}
      </div>
    </fieldset>
  );
}

/**
 * What the delivery panel says about the code that has been typed.
 *
 * A pickup order is told it is collected in the store whatever the code says: a
 * postal code with no courier zone is not a problem for somebody who is coming
 * to fetch their parcel.
 */
function describeEstimate(estimate: DeliveryEstimate | null, values: ShippingValues): string {
  if (values.deliveryMethod === 'PICKUP') {
    return strings.checkout.shipping.methods.PICKUP.body;
  }

  if (estimate === null || estimate.quote === null) {
    return strings.checkout.shipping.estimateUnavailable;
  }

  const { zone } = estimate.quote;

  return strings.checkout.shipping.estimate(
    zone.name,
    zone.deliveryDaysMin,
    zone.deliveryDaysMax,
    formatPrice(zone.fee),
  );
}
