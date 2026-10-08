/**
 * Button component.
 *
 * A reusable button with variants for different visual styles.
 *
 * While `isLoading`, the spinner replaces nothing and the label stays: the
 * button keeps its width, keeps saying what it is doing, and is disabled so a
 * second press cannot send the same request twice.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  isLoading?: boolean;
  children: ReactNode;
};

const variantStyles: Record<Variant, string> = {
  primary: 'bg-brand-700 text-brand-50 hover:bg-brand-600 focus-visible:outline-brand-600',
  secondary: 'bg-surface-muted text-ink-900 hover:bg-surface focus-visible:outline-brand-600',
  outline:
    'border border-border text-ink-900 hover:bg-surface-muted focus-visible:outline-brand-600',
  ghost: 'text-ink-600 hover:bg-surface-muted focus-visible:outline-brand-600',
};

export function Button({
  variant = 'primary',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={16} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
