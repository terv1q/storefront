/**
 * Checkout mutation.
 *
 * Placing an order changes more than the order: stock has moved, so every
 * catalog list, every product detail, and every wishlist entry that shows a
 * stock hint is now out of date. All of them are invalidated together rather
 * than surgically, because a checkout line can touch a product that this client
 * never rendered, and a stale "in stock" label on a catalogue card is the kind
 * of error a shopper notices at the worst moment.
 *
 * The mutation rejects with the `ApiError` the api client produced. Callers read
 * the field messages with `readCheckoutErrors`; nothing is swallowed here.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { useCartStore } from '@/features/cart/cart.store';
import { queryKeys } from '@/services/queryKeys';
import type { CheckoutInput } from '@/types/order';

import { checkoutApi } from './checkout.api';
import type { PlacedOrder } from './checkout.types';

export function usePlaceOrder(): UseMutationResult<PlacedOrder, Error, CheckoutInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutInput) => checkoutApi.placeOrder(input),
    onSuccess: (order) => {
      // The basket has become an order, so it is emptied — and only here, once
      // the server has answered. A checkout that failed leaves the cart where it
      // was, which is what somebody whose payment was declined should find.
      useCartStore.getState().clear();

      // The response is the full order, so the detail entry is seeded with it
      // and the list is refetched to pick the new order up in its place.
      queryClient.setQueryData(queryKeys.orders.detail(order.id), order);

      void queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wishlist.all });
    },
  });
}
