/**
 * The one query client, and the one rule it applies to every request.
 *
 * It used to be a bare `new QueryClient()` in `main.tsx`. It is a module now
 * because a client is where a policy that applies to *every* query and mutation
 * has to live, and the policy that needs one is notifications: a mutation that
 * failed because the request never reached the server is worth saying out loud.
 *
 * The rule is deliberately narrow. Only a failure with no status is announced — a
 * request that was never answered, which is the dropped connection, the timeout,
 * and the DNS failure. Everything else already has a place to be read: a `422`
 * belongs under the field the form drew, a `404` under the page that asked for
 * something that does not exist, and a `401` is the sign-in the guard is about to
 * show. Announcing those as well would put a second copy of the same sentence on
 * the screen, in a different place, to be dismissed separately.
 *
 * Queries are left alone entirely. A failed query is what the page's error state
 * is for, and it is drawn where the missing data would have been.
 */

import { MutationCache, QueryClient } from '@tanstack/react-query';

import { strings } from '@/i18n/strings';
import { notify } from '@/store/toast.store';
import { isApiError } from '@/types/api';

/** True when a request never got an answer from the server. */
function isNetworkFailure(error: unknown): boolean {
  return isApiError(error) && error.status === 0;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isNetworkFailure(error)) {
          notify(strings.errors.network, { tone: 'error' });
        }
      },
    }),
  });
}
