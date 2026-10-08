/**
 * Where an order has got to.
 *
 * Five steps, in the order a parcel takes them, drawn as a list rather than as
 * a row of dots with a line between them: a list reflows on a narrow screen
 * without the line having to be redrawn, and each step can carry the sentence
 * that says what it means. The steps already passed are filled, the current one
 * is marked with `aria-current="step"`, and the ones still ahead are muted —
 * three states, not six colours, because the reader is asking "how far along"
 * and not "which of five things is this".
 *
 * A cancelled order is not a step in that sequence: it left the sequence. When
 * the order is cancelled the timeline says so in place of the steps, and says
 * what happened to the money if it had been paid.
 *
 * An order that is delivered has no current step; every step is simply done.
 */

import { Check, CircleX } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { Order } from '@/types/order';

import { ORDER_PROGRESS } from './OrderStatusBadge';

type Props = {
  order: Pick<Order, 'status' | 'paymentStatus'>;
  className?: string;
};

export function OrderTimeline({ order, className }: Props) {
  if (order.status === 'CANCELLED') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-card border border-border bg-surface-muted p-4',
          className,
        )}
      >
        <CircleX aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-ink-600" />

        <div>
          <p className="text-sm font-medium text-ink-900">{strings.orders.status.CANCELLED}</p>
          <p className="mt-0.5 text-sm text-ink-600">
            {order.paymentStatus === 'REFUNDED'
              ? strings.orders.timelineCancelledRefunded
              : strings.orders.timelineCancelled}
          </p>
        </div>
      </div>
    );
  }

  const current = ORDER_PROGRESS.indexOf(order.status);

  return (
    <ol className={cn('flex flex-col', className)}>
      {ORDER_PROGRESS.map((status, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <li key={status} className="flex gap-3">
            {/* The rail: a filled dot per step, and the line that joins them
                drawn by the step it belongs to so the last one has none. */}
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full border text-[11px]',
                  done && 'border-brand-700 bg-brand-700 text-brand-50',
                  active && 'border-brand-700 bg-surface text-brand-700',
                  !done && !active && 'border-border bg-surface text-ink-500',
                )}
              >
                {done ? <Check aria-hidden="true" size={13} /> : index + 1}
              </span>

              {index < ORDER_PROGRESS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn('w-px flex-1', done ? 'bg-brand-700' : 'bg-border')}
                />
              ) : null}
            </div>

            <div className={cn('pb-5', index === ORDER_PROGRESS.length - 1 && 'pb-0')}>
              <p
                aria-current={active ? 'step' : undefined}
                className={cn(
                  'text-sm font-medium',
                  done || active ? 'text-ink-900' : 'text-ink-500',
                )}
              >
                {strings.orders.status[status]}
              </p>
              <p className={cn('mt-0.5 text-sm', done || active ? 'text-ink-600' : 'text-ink-500')}>
                {strings.orders.timeline[status]}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
