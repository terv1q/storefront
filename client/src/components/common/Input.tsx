/**
 * Input component.
 *
 * A reusable input field with support for different types and error states.
 *
 * The error is tied to the field it belongs to: the message carries the id the
 * input points at through `aria-describedby`, and the input is marked
 * `aria-invalid` while it is there. A message that is merely near a field is a
 * message a screen reader may read before the field or after the next one.
 */

import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { cn } from '@/lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, className, id, ...props }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;

  const describedBy =
    error !== undefined ? errorId : helperText !== undefined ? helperId : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-900">
          {label}
        </label>
      )}

      <input
        id={inputId}
        aria-invalid={error !== undefined}
        aria-describedby={describedBy}
        className={cn(
          'rounded-control border px-3 py-2 text-sm',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-danger-600' : 'border-border',
          className,
        )}
        {...props}
      />

      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}

      {helperText && !error && (
        <p id={helperId} className="text-xs text-ink-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
