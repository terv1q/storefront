/**
 * Delivery as the product page consumes it.
 *
 * The same `Resource` shape as the catalog hooks, so the panel branches on
 * `isLoading`, `isError`, and `errorMessage` exactly as the grid and the rails
 * do. The postal code is passed in rather than kept here: what the shopper typed
 * belongs to the field they typed it in, and this hook only answers for it.
 */

import { useDeliveryEstimate as useDeliveryEstimateQuery } from '@/features/products/delivery.queries';
import type { DeliveryEstimate } from '@/features/products/delivery.types';
import { errorMessageOf, type Resource } from '@/hooks/useProducts';

/** The estimate for one postal code, or the idle state while none is complete. */
export function useDeliveryEstimate(postalCode: string): Resource<DeliveryEstimate> {
  const result = useDeliveryEstimateQuery(postalCode);

  return {
    data: result.data,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    errorMessage: result.isError ? errorMessageOf(result.error) : null,
    refetch: () => {
      void result.refetch();
    },
  };
}
