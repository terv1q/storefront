/**
 * Search terms shared by the search box and the search page.
 *
 * The server answers a term shorter than two characters with an empty page
 * without querying, so the client does not send one at all. The same constant
 * decides whether the suggestion dropdown opens.
 */

/** Shortest term that is worth a request. */
export const MIN_SEARCH_LENGTH = 2;
