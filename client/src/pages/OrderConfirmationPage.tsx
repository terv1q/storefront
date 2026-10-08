/**
 * The page an order lands on.
 *
 * It is a receipt and a destination at once. The order number is the thing the
 * shopper may have to read out loud, so it is the largest line on the page; the
 * lines, the total that was charged, and where the parcel is going are there so
 * a mistake can be seen now rather than when the box arrives. The delivery
 * window is the API's own answer for the address that was ordered to, which is
 * the same promise the product page makes — when no zone covers it, the page
 * says the store will confirm the window instead of inventing one.
 *
 * The order is read back from `GET /api/orders/:id` rather than handed over in
 * memory: the placement seeds this cache entry, so a fresh checkout draws what
 * the server already sent, and a reload, a bookmark, or a link from the order
 * history is answered the same way. An order that belongs to somebody else is a
 * 404, and the page says the order could not be found rather than pretending to
 * know it exists.
 */

import { CheckCircle2, Package, ShoppingBag } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { OrderLines, OrderTotals } from '@/components/orders/OrderBreakdown';
import { useOrder } from '@/features/orders/orders.queries';
import { isCompletePostalCode, useDeliveryEstimate } from '@/features/products/delivery.queries';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { isApiError } from '@/types/api';

export function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const order = useOrder(id);

  useSeo({ title: strings.pages.orderConfirmation.title, noIndex: true });

  const postalCode = order.data?.shippingPostalCode ?? '';
  const estimate = useDeliveryEstimate(isCompletePostalCode(postalCode) ? postalCode.trim() : '');

  if (order.isLoading) {
    return (
      <div className="mx-auto w-full max-w-narrow px-page-x py-page-y">
        <span role="status" className="sr-only">
          {strings.loading.default}
        </span>

        <div className="flex flex-col gap-5 rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-11 rounded-control" />
        </div>
      </div>
    );
  }

  const placed = order.data;
  const missing = isApiError(order.error) && order.error.status === 404;

  if (placed === undefined) {
    return (
      <div className="mx-auto flex w-full max-w-narrow flex-col items-start gap-4 px-page-x py-page-y">
        {missing ? (
          <>
            <h1 className="text-2xl font-semibold text-ink-900">
              {strings.checkout.confirmation.notFoundTitle}
            </h1>
            <p className="text-sm text-ink-600">{strings.checkout.confirmation.notFoundBody}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                to={paths.orders}
                className="inline-flex items-center justify-center rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {strings.checkout.confirmation.viewOrders}
              </Link>

              <Link
                to={paths.home}
                className="inline-flex items-center justify-center rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                {strings.checkout.confirmation.browse}
              </Link>
            </div>
          </>
        ) : (
          // The order may well exist; the request is what failed, so the page
          // offers to ask again rather than telling the shopper it is gone.
          <ErrorState body={errorMessageOf(order.error)} onRetry={() => void order.refetch()} />
        )}
      </div>
    );
  }

  const courier = placed.deliveryMethod === 'COURIER';
  const zone = estimate.data?.quote?.zone ?? null;

  return (
    <div className="mx-auto w-full max-w-narrow px-page-x py-page-y">
      <div className="rounded-panel border border-border bg-surface p-6 shadow-card sm:p-8">
        <p className="flex items-center gap-2 text-sm font-medium text-success-600">
          <CheckCircle2 aria-hidden="true" size={18} />
          {strings.checkout.confirmation.status(placed.status)}
        </p>

        <h1 className="mt-3 text-2xl font-semibold text-ink-900">
          {strings.checkout.confirmation.heading}
        </h1>
        <p className="mt-2 text-sm text-ink-600">{strings.checkout.confirmation.body}</p>

        <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-card border border-border bg-surface-muted px-4 py-3">
          <span className="text-sm text-ink-600">{strings.checkout.confirmation.orderNumber}</span>
          <span className="text-base font-semibold tracking-wide text-ink-900">
            {placed.orderNumber}
          </span>
        </p>

        <h2 className="mt-8 text-lg font-semibold text-ink-900">
          {strings.checkout.confirmation.itemsHeading}
        </h2>

        <OrderLines items={placed.items ?? []} className="mt-3" />

        <OrderTotals
          order={placed}
          totalLabel={strings.checkout.confirmation.totalPaid}
          className="mt-5 border-t border-border pt-4"
        />

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-5 text-sm">
          <p className="flex items-center gap-2 text-ink-900">
            <Package aria-hidden="true" size={16} className="text-ink-500" />
            {strings.checkout.shipping.methods[placed.deliveryMethod].name}
          </p>

          <p className="text-ink-600">
            {[
              placed.shippingStreet,
              placed.shippingCity,
              placed.shippingPostalCode,
              placed.shippingCountry,
            ]
              .filter((part) => part !== null && part.trim() !== '')
              .join(', ')}
          </p>

          {/* The window comes from the same endpoint the product page asks; a
              code no zone covers is answered with the store's promise to
              confirm it rather than with a made-up number of days. */}
          <p className="text-ink-600">
            {courier
              ? zone === null
                ? strings.checkout.confirmation.estimateUnknown
                : strings.checkout.confirmation.estimate(
                    zone.name,
                    zone.deliveryDaysMin,
                    zone.deliveryDaysMax,
                  )
              : strings.checkout.confirmation.pickupNote}
          </p>

          <p className="text-ink-600">
            {strings.checkout.confirmation.payment(
              strings.checkout.payment.methods[placed.paymentMethod].name,
              strings.checkout.confirmation.paymentStatus(placed.paymentStatus),
            )}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={paths.order(placed.id)}
            className="inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <ShoppingBag aria-hidden="true" size={16} />
            {strings.checkout.confirmation.viewOrder}
          </Link>

          <Link
            to={paths.home}
            className="inline-flex items-center justify-center rounded-control border border-border px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {strings.checkout.confirmation.browse}
          </Link>
        </div>
      </div>
    </div>
  );
}
