/**
 * Where the shopper is in the checkout, and how to get back.
 *
 * The steps are drawn as a numbered track: what has been filled in, what is
 * being filled in, and what is still ahead. A step that has been completed is a
 * button, because changing the delivery address from the review step is the
 * commonest thing to want and hunting back through "Back" presses to find it is
 * not; a step that has not been reached is disabled rather than hidden, so the
 * shape of the whole form is visible from the first one.
 *
 * The state is not carried by colour alone — a completed step carries a tick,
 * and the current one is marked with `aria-current="step"` — because a track
 * that says "you are here" in a slightly different grey is a track that says
 * nothing to somebody who cannot see the difference.
 */

import { Check } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Step = {
  key: string;
  label: string;
};

type Props = {
  steps: readonly Step[];
  /** Index of the step being filled in. */
  current: number;
  /** Goes back to a step that has been completed. */
  onEdit: (index: number) => void;
  className?: string;
};

export function CheckoutSteps({ steps, current, onEdit, className }: Props) {
  return (
    <nav className={cn('w-full', className)} aria-label={strings.checkout.stepsHeading}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const done = index < current;
          const isCurrent = index === current;
          const reachable = index <= current;

          return (
            <li
              key={step.key}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}
            >
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onEdit(index)}
                aria-label={done ? strings.checkout.editStep(step.label) : step.label}
                className={cn(
                  'flex items-center gap-2 rounded-control px-1 py-1 text-sm transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  reachable ? 'cursor-pointer' : 'cursor-not-allowed',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                    done && 'border-success-600 bg-success-50 text-success-600',
                    isCurrent && 'border-brand-700 bg-brand-700 text-brand-50',
                    !done && !isCurrent && 'border-border text-ink-500',
                  )}
                >
                  {done ? <Check size={14} /> : index + 1}
                </span>

                <span
                  className={cn(
                    'whitespace-nowrap',
                    isCurrent ? 'font-medium text-ink-900' : 'text-ink-600',
                    // The label of a step that is still ahead adds nothing on a
                    // narrow screen, where the number is the whole message.
                    !reachable && 'hidden sm:inline',
                  )}
                >
                  {step.label}
                </span>
              </button>

              {index < steps.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('mx-2 h-px flex-1', done ? 'bg-success-600' : 'bg-border')}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <p className="mt-3 text-sm text-ink-500">
        {strings.checkout.stepOf(current + 1, steps.length)}
      </p>
    </nav>
  );
}
