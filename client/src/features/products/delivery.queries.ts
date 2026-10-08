/**
 * The delivery estimate query.
 *
 * It answers for one postal code, so the code is the cache key: checking a
 * second address and coming back to the first shows the first answer again
 * without asking for it. An empty code is a real query and not an idle one — it
 * asks for the store's policy, which is what the panel shows before an address is
 * typed — so this query always runs.
 *
 * The policy travels with the estimate, so one request draws the whole panel.
 */

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';

import { deliveryApi } from './delivery.api';
import type { DeliveryEstimate } from './delivery.types';

/** The shape of a postal code the endpoint accepts, and the only one worth asking about. */
export const POSTAL_CODE_PATTERN = /^\d{6}$/;

/** Whether a postal code is complete enough to ask the server about. */
export function isCompletePostalCode(postalCode: string): boolean {
  return POSTAL_CODE_PATTERN.test(postalCode.trim());
}

/**
 * The estimate for one postal code, or the policy alone for an empty one.
 *
 * A partly typed code is not asked about: it can only be refused, and a refusal
 * per keystroke is not an answer anybody wanted. The panel holds what was typed
 * and submits it, so this hook is only ever called with nothing or with six
 * digits.
 */
export function useDeliveryEstimate(postalCode: string): UseQueryResult<DeliveryEstimate, unknown> {
  const zip = postalCode.trim();

  return useQuery({
    queryKey: queryKeys.delivery.estimate(zip),
    queryFn: () => deliveryApi.estimate(zip),
    staleTime: STALE_TIME.delivery,
    retry: retryQuery,
    // The previous answer stays while the next code is checked, so the panel
    // does not collapse to a spinner every time the shopper edits one digit.
    placeholderData: keepPreviousData,
  });
}
