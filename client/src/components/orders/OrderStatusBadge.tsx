/**
 * The status of an order, as a word and a colour.
 *
 * An order passes through six states and the customer only ever has to
 * recognise one of them at a glance: whether the parcel is still coming, has
 * arrived, or has stopped. The colour carries that, and the text carries the
 * state itself, so the badge is readable without the colour — a customer who
 * cannot tell the greens and ambers apart still reads "On its way".
 *
 * `aria-label` is not added: the badge's text is already its accessible name,
 * and a label would only repeat it.
 */

import { CircleX, Clock, Package, PackageCheck, Truck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { OrderStatus } from '@/types/order';

/** The icon a status is drawn with. */
const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  PENDING: Clock,
  CONFIRMED: Package,
  PROCESSING: Package,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: CircleX,
};

/**
 * Colours per status. Amber while the order waits on the store, the brand tone
 * while it is moving, green when it is done, and grey for the one state that is
 * neither a delay nor a delivery.
 */
const STATUS_TONES: Record<OrderStatus, string> = {
  PENDING: 'bg-warning-50 text-warning-700',
  CONFIRMED: 'bg-brand-50 text-brand-700',
  PROCESSING: 'bg-brand-50 text-brand-700',
  SHIPPED: 'bg-brand-50 text-brand-700',
  DELIVERED: 'bg-success-50 text-success-600',
  CANCELLED: 'bg-surface-muted text-ink-600',
};

type Props = {
  status: OrderStatus;
  size?: 'sm' | 'md';
  className?: string;
};

export function OrderStatusBadge({ status, size = 'sm', className }: Props) {
  const Icon = STATUS_ICONS[status];
  const label = strings.orders.status[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        STATUS_TONES[status],
        className,
      )}
    >
      <Icon aria-hidden="true" size={size === 'sm' ? 13 : 15} />
      {label}
    </span>
  );
}

/**
 * The states an order passes through, in order, without the one that interrupts
 * them. The timeline reads its steps from here, so the two cannot disagree
 * about what "progress" means.
 */
export const ORDER_PROGRESS: readonly Exclude<OrderStatus, 'CANCELLED'>[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];
