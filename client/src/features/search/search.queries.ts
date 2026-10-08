/**
 * Search queries.
 *
 * The suggestion query is the one the search box drives on every keystroke, so
 * it is keyed by the debounced term: typing "kettle" after "kett" is a different
 * entry, and coming back to a term already fetched is served from the cache
 * instead of from the network. Terms below the minimum length never leave the
 * client, which is why the query is disabled rather than sent.
 *
 * Rapid typing is handled twice over, and the two are not the same safeguard.
 * The key is what makes a late answer harmless: a response is stored under the
 * term it belongs to, so it cannot appear under the term that replaced it. The
 * abort signal is what stops the work: the query for the term that was just
 * replaced is cancelled, which aborts its request rather than leaving it to
 * finish and be discarded. The cache entry survives the cancellation.
 */

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';

import { MIN_SEARCH_LENGTH } from '@/features/search/search.constants';
import { toFacetsQuery } from '@/features/products/products.api';
import type { ProductFacets } from '@/features/products/products.types';
import { queryKeys } from '@/services/queryKeys';
import { STALE_TIME, retryQuery } from '@/services/queryOptions';
import type { ProductListQuery } from '@/types/product';

import { searchApi } from './search.api';
import type { SearchPage, SuggestionResult } from './search.types';

/** Ranked results for a term, with the same filters as the product list. */
export function useSearchResults(query: ProductListQuery): UseQueryResult<SearchPage, unknown> {
  const term = query.q?.trim() ?? '';

  return useQuery({
    queryKey: queryKeys.search.results({ ...query, q: term }),
    queryFn: () => searchApi.search({ ...query, q: term }),
    // A one-character term is answered with an empty page, so it is not sent.
    enabled: term.length >= MIN_SEARCH_LENGTH,
    staleTime: STALE_TIME.products,
    retry: retryQuery,
    placeholderData: keepPreviousData,
  });
}

/**
 * What the filter panel can offer for a term.
 *
 * The previous facets stay on screen while the next ones load, so narrowing a
 * search does not blank the panel the shopper is working in — the same behaviour
 * the catalog's panel has. The query is narrowed to the filters the endpoint
 * answers before it becomes a cache key, so paging or re-sorting a search does not
 * refetch counts that cannot have changed.
 */
export function useSearchFacets(query: ProductListQuery): UseQueryResult<ProductFacets, unknown> {
  const term = query.q?.trim() ?? '';
  const facetsQuery = toFacetsQuery({ ...query, q: term });

  return useQuery({
    queryKey: queryKeys.search.facets(facetsQuery),
    queryFn: () => searchApi.facets({ ...query, q: term }),
    enabled: term.length >= MIN_SEARCH_LENGTH,
    staleTime: STALE_TIME.facets,
    retry: retryQuery,
    placeholderData: keepPreviousData,
  });
}

/** The dropdown behind the search box. Idle until the term is long enough. */
export function useSearchSuggestions(term: string): UseQueryResult<SuggestionResult, unknown> {
  const trimmed = term.trim();
  const queryClient = useQueryClient();
  const previousTerm = useRef<string | null>(null);

  // The term that was just replaced is no longer wanted: cancelling its query
  // aborts the request it started, so a superseded answer is never in flight
  // under the term now on screen. Unmounting is not a replacement, so it does
  // not cancel anything.
  useEffect(() => {
    const current = trimmed.toLowerCase();
    const previous = previousTerm.current;

    previousTerm.current = current;

    if (previous !== null && previous !== current) {
      void queryClient.cancelQueries({ queryKey: queryKeys.search.suggestions(previous) });
    }
  }, [queryClient, trimmed]);

  return useQuery({
    queryKey: queryKeys.search.suggestions(trimmed.toLowerCase()),
    // A term that is replaced while its own request is still in flight is
    // cancelled rather than raced, so the list can never settle on an answer
    // that belongs to a term the shopper has already moved past.
    queryFn: ({ signal }) => searchApi.suggestions(trimmed, signal),
    enabled: trimmed.length >= MIN_SEARCH_LENGTH,
    staleTime: STALE_TIME.suggestions,
    retry: retryQuery,
  });
}
