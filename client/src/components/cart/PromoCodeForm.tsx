/**
 * The promo code field.
 *
 * A code is checked against the API before it is applied, never after: the
 * alternative — accepting anything and letting the checkout refuse it — would
 * put the refusal at the end of a form the shopper has already filled in. What
 * the server answers is the rule and what it is worth for the basket on screen;
 * that rule is what the cart keeps, so the discount can be re-priced as the
 * shopper edits quantities without asking again.
 *
 * The refusal arrives as a 422 whose message belongs under the input, which is
 * where it is drawn — next to the field rather than in a banner, because the
 * field is the only thing the shopper can change about it.
 *
 * The form is not a submit-and-reload: it is a real `<form>` with an `onSubmit`,
 * so Enter applies the code, and the button is `type="submit"`.
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { AppliedPromo } from '@/features/cart/cart.types';
import { promoApi } from '@/features/cart/promo.api';
import { errorMessageOf } from '@/hooks/useProducts';
import { formatPrice } from '@/utils/formatPrice';

type Props = {
  /** The basket the code would apply to. */
  subtotal: number;
  /** The code already applied, when there is one. */
  promo: AppliedPromo | null;
  /** What the applied code is worth right now, for the confirmation line. */
  appliedDiscount: number;
  onApply: (promo: AppliedPromo) => void;
  onRemove: () => void;
  className?: string;
};

export function PromoCodeForm({
  subtotal,
  promo,
  appliedDiscount,
  onApply,
  onRemove,
  className,
}: Props) {
  const [code, setCode] = useState('');

  const apply = useMutation({
    mutationFn: (value: string) => promoApi.validate(value, subtotal),
    onSuccess: (result) => {
      // The amount the server worked out is dropped and the rule is kept; the
      // cart prices the discount itself from that rule, which is what keeps it
      // correct when the next quantity change moves the subtotal.
      const { code: applied, ...rule } = result;

      onApply({ code: applied, ...rule });
      setCode('');
    },
  });

  const failure = apply.isError ? errorMessageOf(apply.error) : null;
  const fieldId = 'cart-promo-code';

  if (promo !== null) {
    return (
      <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
        <p className="flex items-center gap-2 text-sm text-ink-900">
          <Check aria-hidden="true" size={16} className="text-success-600" />
          {strings.cart.promoApplied(promo.code)}
          {appliedDiscount > 0 ? (
            <span className="text-ink-600">· {formatPrice(appliedDiscount)}</span>
          ) : null}
        </p>

        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-control text-sm font-medium text-ink-600 underline-offset-4 hover:text-ink-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <X aria-hidden="true" size={14} />
          {strings.cart.promoRemove}
        </button>
      </div>
    );
  }

  return (
    <form
      className={cn('flex flex-col gap-2', className)}
      onSubmit={(event) => {
        event.preventDefault();

        const value = code.trim();

        if (value !== '' && !apply.isPending) {
          apply.mutate(value);
        }
      }}
    >
      <label htmlFor={fieldId} className="text-sm font-medium text-ink-900">
        {strings.cart.promoLabel}
      </label>

      <div className="flex items-stretch gap-2">
        <input
          id={fieldId}
          name="promoCode"
          type="text"
          autoComplete="off"
          // Codes are written in capitals and typed as they appear on a leaflet.
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(event) => setCode(event.target.value)}
          aria-invalid={failure !== null}
          aria-describedby={failure === null ? `${fieldId}-hint` : `${fieldId}-error`}
          placeholder={strings.cart.promoPlaceholder}
          className={cn(
            'h-10 min-w-0 flex-1 rounded-control border bg-surface px-3 text-sm uppercase text-ink-900 placeholder:normal-case placeholder:text-ink-400',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            failure === null ? 'border-border' : 'border-danger-600',
          )}
        />

        <Button
          type="submit"
          variant="outline"
          isLoading={apply.isPending}
          disabled={code.trim() === ''}
        >
          {strings.actions.apply}
        </Button>
      </div>

      {failure === null ? (
        <p id={`${fieldId}-hint`} className="text-xs text-ink-500">
          {strings.cart.promoHint}
        </p>
      ) : (
        <ErrorMessage id={`${fieldId}-error`} className="text-xs">
          {failure}
        </ErrorMessage>
      )}
    </form>
  );
}
