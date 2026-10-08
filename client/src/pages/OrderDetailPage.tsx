/**
 * One order, from the customer's side.
 *
 * It is the confirmation page with time in it: the same lines and the same
 * money, plus where the parcel has got to and the one action still available —
 * stopping it. The order is read from `GET /api/orders/:id`, which answers 404
 * for an order belonging to another account, and that answer is drawn as "we
 * could not find that order" rather than as a failure, because a stranger
 * guessing ids is exactly what the rule is for.
 *
 * Cancelling is offered only from the statuses the server accepts, and it is
 * confirmed first: it cannot be undone, and it is the only destructive thing a
 * customer can do to an order. The response is the server's own version of the
 * order, so the badge, the timeline, and the button all move together when it
 * arrives — and the stock the order had taken goes back in the same request.
 */

import { ArrowLeft, MapPin, PackageX, Receipt, StickyNote, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ErrorState } from '@/components/common/ErrorState';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { OrderLines, OrderTotals } from '@/components/orders/OrderBreakdown';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { useCancelOrder, useOrder } from '@/features/orders/orders.queries';
import { canCancelOrder } from '@/features/orders/orders.rules';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { isApiError } from '@/types/api';
import { formatDateTime } from '@/utils/formatDate';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  useSeo({ title: strings.pages.order.title, noIndex: true });

  const order = useOrder(id);
  const cancel = useCancelOrder();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const placed = order.data;

  if (order.isLoading) {
    return (
      <div className="mx-auto w-full max-w-page px-page-x py-page-y">
        <span role="status" className="sr-only">
          {strings.loading.default}
        </span>

        <div className="flex flex-col gap-6">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 rounded-panel" />
          <Skeleton className="h-64 rounded-panel" />
          <Skeleton className="h-40 rounded-panel" />
        </div>
      </div>
    );
  }

  // A 404 is the server saying this order is not this customer's, which is the
  // same answer for a link that is old and for an id that was guessed. Anything
  // else is the page failing to load, and says so.
  const missing = isApiError(order.error) && order.error.status === 404;

  if (placed === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-narrow flex-col items-start gap-4 px-page-x py-page-y">
        {missing ? (
          <EmptyState
            Icon={PackageX}
            title={strings.orders.detail.notFoundTitle}
            body={strings.orders.detail.notFoundBody}
          >
            <Link
              to={paths.orders}
              className="inline-flex items-center justify-center rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {strings.orders.title}
            </Link>
          </EmptyState>
        ) : (
          <ErrorState
            title={strings.orders.detail.loadFailed}
            body={errorMessageOf(order.error)}
            onRetry={() => void order.refetch()}
          >
            <Link
              to={paths.orders}
              className="inline-flex items-center justify-center rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-surface-muted"
            >
              {strings.orders.title}
            </Link>
          </ErrorState>
        )}
      </div>
    );
  }

  const cancellable = canCancelOrder(placed.status);
  const courier = placed.deliveryMethod === 'COURIER';
  const address = [
    placed.shippingStreet,
    placed.shippingCity,
    placed.shippingPostalCode,
    placed.shippingCountry,
  ]
    .filter((part) => part !== null && part.trim() !== '')
    .join(', ');

  return (
    <div className="mx-auto w-full max-w-page px-page-x py-page-y">
      <Link
        to={paths.orders}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        {strings.orders.title}
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-ink-500">{strings.orders.orderNumber}</p>
          <h1 className="text-2xl font-semibold tracking-wide text-ink-900">
            {placed.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {strings.orders.placedOn(formatDateTime(placed.createdAt))}
          </p>
        </div>

        <OrderStatusBadge status={placed.status} size="md" />
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-6">
          <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Truck aria-hidden="true" size={16} className="text-ink-500" />
              {strings.orders.detail.progressHeading}
            </h2>

            <OrderTimeline order={placed} className="mt-4" />
          </section>

          <section className="rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <Receipt aria-hidden="true" size={16} className="text-ink-500" />
              {strings.orders.detail.itemsHeading}
            </h2>

            <OrderLines items={placed.items ?? []} className="mt-4" />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="rounded-panel border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-ink-900">{strings.cart.summaryHeading}</h2>

            <OrderTotals
              order={placed}
              totalLabel={strings.orders.detail.totalLabel}
              className="mt-3 border-t border-border pt-4"
            />
          </section>

          <section className="rounded-panel border border-border bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink-900">
              <MapPin aria-hidden="true" size={16} className="text-ink-500" />
              {strings.orders.detail.deliveryHeading}
            </h2>

            <dl className="mt-3 flex flex-col gap-3 text-sm">
              <div>
                <dt className="text-ink-600">
                  {strings.checkout.shipping.methods[placed.deliveryMethod].name}
                </dt>
                <dd className="mt-0.5 text-ink-900">
                  {courier
                    ? strings.checkout.shipping.methods.COURIER.body
                    : strings.checkout.shipping.methods.PICKUP.body}
                </dd>
              </div>

              <div>
                <dt className="text-ink-600">{strings.orders.detail.addressLabel}</dt>
                <dd className="mt-0.5 text-ink-900">{address}</dd>
              </div>

              {placed.notes === null || placed.notes.trim() === '' ? null : (
                <div>
                  <dt className="flex items-center gap-1.5 text-ink-600">
                    <StickyNote aria-hidden="true" size={13} />
                    {strings.orders.detail.notesLabel}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-line text-ink-900">{placed.notes}</dd>
                </div>
              )}
            </dl>
          </section>

          <section className="rounded-panel border border-border bg-surface p-5 shadow-card">
            <h2 className="text-sm font-semibold text-ink-900">
              {strings.orders.detail.paymentHeading}
            </h2>

            <p className="mt-3 text-sm text-ink-900">
              {strings.orders.detail.payment(
                strings.checkout.payment.methods[placed.paymentMethod].name,
                strings.checkout.confirmation.paymentStatus(placed.paymentStatus),
              )}
            </p>
          </section>

          {cancellable ? (
            <section className="rounded-panel border border-border bg-surface p-5 shadow-card">
              <Button
                variant="outline"
                isLoading={cancel.isPending}
                onClick={() => setConfirmOpen(true)}
                className="w-full border-danger-600 text-danger-600 hover:bg-danger-50"
              >
                {cancel.isPending ? strings.orders.detail.cancelling : strings.orders.detail.cancel}
              </Button>

              {cancel.isError ? (
                <ErrorMessage className="mt-3">{strings.orders.detail.cancelFailed}</ErrorMessage>
              ) : null}
            </section>
          ) : null}

          {/* The store stopped offering the button for a reason; saying which
              saves the customer from looking for it. */}
          {!cancellable && placed.status !== 'CANCELLED' && placed.status !== 'DELIVERED' ? (
            <p className="rounded-panel border border-border bg-surface-muted p-5 text-sm text-ink-600">
              {strings.orders.detail.cancelClosed}
            </p>
          ) : null}
        </div>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={strings.orders.detail.cancelConfirmTitle}
      >
        <p className="text-sm text-ink-600">{strings.orders.detail.cancelConfirmBody}</p>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {strings.orders.detail.cancelKeep}
          </Button>

          <Button
            isLoading={cancel.isPending}
            onClick={() => {
              if (id === undefined) {
                return;
              }

              cancel.mutate(id, { onSuccess: () => setConfirmOpen(false) });
            }}
            className="bg-danger-600 text-white hover:brightness-110 focus-visible:outline-danger-600"
          >
            {strings.orders.detail.cancelConfirm}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
