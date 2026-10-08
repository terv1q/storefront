/**
 * The order history.
 *
 * One row per order, newest first, and each row answers the four questions a
 * customer opens this page with: which order it is, when it was placed, where
 * it has got to, and what it cost. The rows are cards rather than a table
 * because a receipt read on a phone is a column of cards, and a table that
 * reflows into cards is a table written twice.
 *
 * The page number lives in the address bar, so the second page of a history is
 * a link a customer can keep, and stepping back from an order returns to the
 * page they were on.
 *
 * An account with no orders is a different page, not an empty list: it says so
 * and offers the catalogue, because "you have not ordered anything yet" is an
 * invitation and a blank panel is not.
 */

import { PackageSearch } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Pagination } from '@/components/common/Pagination';
import { Skeleton } from '@/components/common/Skeleton';
import { Thumbnail } from '@/components/common/Thumbnail';
import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge';
import { ORDERS_PAGE_SIZE, useOrders } from '@/features/orders/orders.queries';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { formatDate } from '@/utils/formatDate';
import { formatPrice } from '@/utils/formatPrice';

/** How many placeholder rows the first answer draws. */
const SKELETON_ROWS = 3;

/** How many thumbnails a row shows before it counts the rest. */
const MAX_THUMBNAILS = 4;

/** The page the address bar asks for, or the first one. */
function readPage(value: string | null): number {
  const page = Number.parseInt(value ?? '1', 10);

  return Number.isInteger(page) && page >= 1 ? page : 1;
}

export function OrdersPage() {
  useSeo({ title: strings.pages.orders.title, noIndex: true });

  const [searchParams, setSearchParams] = useSearchParams();
  const page = readPage(searchParams.get('page'));

  const orders = useOrders({ page, limit: ORDERS_PAGE_SIZE });

  const goToPage = (next: number) => {
    const nextParams = new URLSearchParams(searchParams);

    if (next <= 1) {
      nextParams.delete('page');
    } else {
      nextParams.set('page', String(next));
    }

    setSearchParams(nextParams);
  };

  const total = orders.data?.total ?? 0;

  return (
    <div className="mx-auto w-full max-w-page px-page-x py-page-y">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-ink-900">{strings.orders.title}</h1>
        <p className="mt-1 text-sm text-ink-600">{strings.orders.subtitle}</p>
      </header>

      {orders.isError ? (
        <ErrorState
          title={strings.orders.loadFailed}
          body={errorMessageOf(orders.error)}
          onRetry={() => void orders.refetch()}
        />
      ) : null}

      {orders.isLoading ? (
        <ul aria-hidden="true" className="flex flex-col gap-4">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <li key={index}>
              <Skeleton variant="card" className="h-40" />
            </li>
          ))}
        </ul>
      ) : null}

      {orders.data !== undefined && total === 0 ? (
        <EmptyState
          Icon={PackageSearch}
          title={strings.orders.emptyTitle}
          body={strings.orders.emptyBody}
        >
          <Link
            to={paths.home}
            className="inline-flex items-center justify-center rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            {strings.orders.browseCatalog}
          </Link>
        </EmptyState>
      ) : null}

      {orders.data !== undefined && total > 0 ? (
        <>
          <p className="mb-4 text-sm text-ink-600">{strings.orders.count(total)}</p>

          <ul className="flex flex-col gap-4">
            {orders.data.items.map((order) => (
              <li key={order.id}>
                <article className="flex flex-col gap-4 rounded-card border border-border bg-surface p-4 shadow-card sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-ink-500">{strings.orders.orderNumber}</p>
                      <p className="text-base font-semibold tracking-wide text-ink-900">
                        {order.orderNumber}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-600">
                        {strings.orders.placedOn(formatDate(order.createdAt))}
                      </p>
                    </div>

                    <OrderStatusBadge status={order.status} />
                  </div>

                  <div className="flex items-center gap-3">
                    <ul className="flex items-center gap-2">
                      {(order.items ?? []).slice(0, MAX_THUMBNAILS).map((line) => (
                        <li key={line.id}>
                          <Thumbnail
                            src={line.imageUrl ?? null}
                            alt={line.name}
                            className="size-12 rounded-control"
                            iconSize={14}
                          />
                        </li>
                      ))}
                    </ul>

                    <p className="text-sm text-ink-600">
                      {strings.orders.itemCount(
                        (order.items ?? []).reduce((count, line) => count + line.quantity, 0),
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-base font-semibold text-ink-900">
                      {formatPrice(order.total)}
                    </p>

                    <Link
                      to={paths.order(order.id)}
                      className="text-sm font-medium text-brand-700 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    >
                      {strings.orders.viewOrder(order.orderNumber)}
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            totalPages={orders.data.totalPages}
            hrefFor={(next) => (next <= 1 ? paths.orders : `${paths.orders}?page=${next}`)}
            onJumpTo={goToPage}
            className="mt-6"
          />
        </>
      ) : null}
    </div>
  );
}
