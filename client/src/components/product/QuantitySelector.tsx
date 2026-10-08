/**
 * How many to add.
 *
 * A minus, a number, and a plus, bounded by what is actually left. The ceiling is
 * a real bound rather than a hint: the buttons stop at it, the field clamps to it
 * on the way in, and the line under it says what it is, because a control that
 * silently refuses the fourth press is a control that looks broken.
 *
 * The ceiling moves with the chosen options, which is why it arrives as a prop
 * from the page rather than being read from the product here — the same shopper
 * can change it by picking a different size.
 *
 * The field is a text input with a numeric input mode rather than `type="number"`.
 * A number input's spinner is a second, worse version of the two buttons beside
 * it, and its scroll-wheel behaviour changes the quantity of somebody who was
 * only scrolling the page.
 */

import { Minus, Plus } from 'lucide-react';
import { useId } from 'react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

const stepClass =
  'grid h-11 w-11 shrink-0 place-content-center rounded-control border border-border text-ink-700 transition-colors hover:border-ink-300 disabled:cursor-not-allowed disabled:opacity-45';

type Props = {
  value: number;
  onChange: (quantity: number) => void;
  /** The most that can be added: what is left of the chosen options. */
  max: number;
  className?: string;
};

export function QuantitySelector({ value, onChange, max, className }: Props) {
  const fieldId = useId();
  const ceiling = Math.max(0, max);
  const disabled = ceiling === 0;

  const set = (next: number) => {
    if (!Number.isFinite(next)) {
      return;
    }

    // Clamped rather than rejected: a typed 999 becomes the ceiling, which is
    // what the shopper meant, and tells them what it is on the way.
    onChange(Math.max(1, Math.min(Math.trunc(next), ceiling)));
  };

  return (
    <div className={cn('min-w-0', className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink-900">
        {strings.productPage.quantity.label}
      </label>

      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => set(value - 1)}
          disabled={disabled || value <= 1}
          aria-label={strings.actions.decreaseQuantity}
          className={stepClass}
        >
          <Minus aria-hidden="true" size={16} />
        </button>

        <input
          id={fieldId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={disabled ? 0 : value}
          disabled={disabled}
          aria-describedby={`${fieldId}-limit`}
          onChange={(event) => set(Number.parseInt(event.target.value.replace(/\D/g, ''), 10))}
          className={cn(
            'h-11 w-14 rounded-control border border-border bg-surface text-center text-sm font-medium text-ink-900',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-45',
          )}
        />

        <button
          type="button"
          onClick={() => set(value + 1)}
          disabled={disabled || value >= ceiling}
          aria-label={strings.actions.increaseQuantity}
          className={stepClass}
        >
          <Plus aria-hidden="true" size={16} />
        </button>

        <p id={`${fieldId}-limit`} className="text-xs text-ink-500">
          {strings.productPage.quantity.limit(ceiling)}
        </p>
      </div>
    </div>
  );
}
