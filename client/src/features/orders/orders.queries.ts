/**
 * Order queries and mutations.
 *
 * The history and the detail read the same two endpoints the server has had
 * since Stage 12; what is new here is the cancellation, which is the first
 * thing this client does to an order after it has been placed.
 *
 * The history is read a page at a time and the page lives in the address bar,
 * so the second page of the history is a link a customer can keep. Both calls
 * are idle until there is a session, because without one they can only answer
 * 401.
 *
 * Cancelling writes the order the server returned straight into both cache
 * entries it belongs to: the detail the page is showing, and the row in the
 * history. That is not an optimistic patch — the response is the server's own
 * version of the order, and using it is what makes the status change and the
 * stock correction appear without a reload. The list is invalidated as well, so
 * a cancelled order that no longer matches a filter leaves on the next refetch.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { useSession } from '@/features/auth/auth.queries';
import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import type { Paginated, PaginationParams } from '@/types/api';
import type { Order } from '@/types/order';

import { ordersApi } from './orders.api';

/** How many orders a page of the history holds when the caller says nothing. */
export const ORDERS_PAGE_SIZE = 10;

/** One page of this customer's orders. Idle until somebody is signed in. */
export function useOrders(query: PaginationParams = {}): UseQueryResult<Paginated<Order>, unknown> {
  const session = useSession();

  return useQuery({
    queryKey: queryKeys.orders.list(query.page ?? 1, query.limit),
    queryFn: () => ordersApi.list(query),
    enabled: session.data != null,
    staleTime: STALE_TIME.orders,
    retry: retryQuery,
  });
}

/** One order, or the failure that says it is not this customer's. */
export function useOrder(id: string | undefined): UseQueryResult<Order, unknown> {
  const session = useSession();

  return useQuery({
    queryKey: queryKeys.orders.detail(id ?? ''),
    queryFn: () => ordersApi.detail(id ?? ''),
    enabled: id !== undefined && id !== '' && session.data != null,
    staleTime: STALE_TIME.orders,
    retry: retryQuery,
  });
}

/**
 * Cancels an order.
 *
 * The page that calls this reads `isPending` to keep the button from being
 * pressed twice: the second press would reach the server after the first has
 * already moved the order out of a cancellable status and be refused with a
 * 409, which is a correct answer a customer should not have to see.
 */
export function useCancelOrder(): UseMutationResult<Order, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ordersApi.cancel(id),

    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);

      // The row in the history is patched in place, so the badge changes under
      // the customer's eyes rather than after a refetch.
      queryClient.setQueriesData<Paginated<Order>>(
        { queryKey: queryKeys.orders.lists() },
        (page) =>
          page === undefined
            ? page
            : {
                ...page,
                items: page.items.map((entry) => (entry.id === order.id ? order : entry)),
              },
      );

      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}
