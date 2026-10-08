/**
 * A password field with a way to read what was typed.
 *
 * Typing a password blind is the most common way to fail a sign-in form, so the
 * field carries its own reveal button rather than leaving the visitor to guess
 * at a mistyped character. It is a `type="button"` inside the field's frame, so
 * it sits in the tab order just after the input and Escape or Tab out of it
 * behaves like any other control.
 *
 * The button's accessible name changes with its state — "Show password" against
 * "Hide password" — and `aria-pressed` carries the state itself, so a screen
 * reader announces which way the field is currently drawn. The reveal resets
 * when the form is submitted: a field that stays legible after a failed attempt
 * is a password left on the screen for whoever walks past next.
 *
 * With `showStrength`, the meter under the field reads the same string the
 * registration form is validating and never leaves the component. It is a
 * reading, not a rule: the form's own schema decides whether the password is
 * long enough, and the meter exists to make the useful choice the easy one.
 *
 * The line under the field is the form's to choose through `hint`, because a box
 * asking for a password the visitor already has should not be told what a new one
 * must contain.
 */

import { Eye, EyeOff } from 'lucide-react';
import { useId } from 'react';
import type { ChangeEvent } from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { passwordStrength } from '@/features/auth/auth.rules';
import type { PasswordHint, PasswordStrengthLevel } from '@/features/auth/auth.rules';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** The key or sentence the form put under the field, if any. */
  error?: string | undefined;
  autoComplete: string;
  disabled?: boolean;
  /** Draws the strength meter under the field. Registration only. */
  showStrength?: boolean;
  placeholder?: string;
  /**
   * The line under the field when no strength meter is asked for. Left out, it
   * is the registration hint about the minimum length; `null` draws no line at
   * all, which is what a box asking for the password somebody already has wants.
   */
  hint?: string | null;
  /** Cleared to `false` by the form after a submit, which hides the value again. */
  revealed: boolean;
  onRevealedChange: (revealed: boolean) => void;
};

/** How the meter and its sentence are coloured, per reading. */
const LEVEL_STYLES: Record<PasswordStrengthLevel, { bar: string; text: string }> = {
  weak: { bar: 'bg-danger-600', text: 'text-danger-600' },
  fair: { bar: 'bg-warning-600', text: 'text-warning-600' },
  good: { bar: 'bg-brand-600', text: 'text-brand-700' },
  strong: { bar: 'bg-success-600', text: 'text-success-600' },
};

/** Turns the first thing the password is missing into the sentence to show. */
function hintFor(hint: PasswordHint | undefined): string {
  const copy = strings.auth.password.hints;

  switch (hint) {
    case 'length':
      return copy.length;
    case 'longer':
      return copy.longer;
    case 'case':
      return copy.case;
    case 'number':
      return copy.number;
    case 'symbol':
      return copy.symbol;
    default:
      return copy.met;
  }
}

export function PasswordField({
  label,
  value,
  onChange,
  error,
  autoComplete,
  disabled = false,
  showStrength = false,
  placeholder,
  hint,
  revealed,
  onRevealedChange,
}: Props) {
  const hintText = hint === undefined ? strings.auth.password.hint : hint;
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const strengthId = `${inputId}-strength`;

  // Read once per change rather than per render: the meter is drawn from the
  // field's own value and nothing else.
  const strength = passwordStrength(value);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const describedBy = [
    error === undefined ? null : errorId,
    showStrength ? strengthId : hintText === null ? null : hintId,
  ]
    .filter((id): id is string => id !== null)
    .join(' ');

  const meter = LEVEL_STYLES[strength.level];
  const percent = Math.round((strength.score / 5) * 100);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={revealed ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          aria-invalid={error !== undefined}
          aria-describedby={describedBy}
          onChange={handleChange}
          className={cn(
            'w-full rounded-control border bg-surface py-2 pr-11 pl-3 text-sm text-ink-900 placeholder:text-ink-400',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error === undefined ? 'border-border' : 'border-danger-600',
          )}
        />

        <button
          type="button"
          aria-pressed={revealed}
          aria-label={revealed ? strings.auth.hidePassword : strings.auth.showPassword}
          disabled={disabled}
          onClick={() => onRevealedChange(!revealed)}
          className="absolute inset-y-0 right-0 grid w-11 place-content-center rounded-control text-ink-500 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {revealed ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>

      {error === undefined ? null : <ErrorMessage id={errorId}>{error}</ErrorMessage>}

      {showStrength ? (
        <div id={strengthId} className="mt-1 flex flex-col gap-1.5" aria-live="polite">
          <div className="flex items-center gap-2">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-label={strings.auth.password.strengthLabel}
              className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
            >
              <div
                className={cn('h-full rounded-full transition-[width] duration-300', meter.bar)}
                style={{ width: `${percent}%` }}
              />
            </div>

            <span className={cn('text-xs font-medium whitespace-nowrap', meter.text)}>
              {strings.auth.password.strength[strength.level]}
            </span>
          </div>

          <p className="text-xs text-ink-500">{hintFor(strength.hints[0])}</p>
        </div>
      ) : hintText === null ? null : (
        <p id={hintId} className="text-xs text-ink-500">
          {hintText}
        </p>
      )}
    </div>
  );
}
