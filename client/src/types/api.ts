/**
 * Transport types shared by every API call. Domain shapes live in the feature
 * type files (`product.ts`, `user.ts`, `order.ts`); this file only describes how
 * the client and the server exchange them.
 */

/** Envelope for endpoints that return a single resource. */
export type ApiResponse<T> = {
  data: T;
  message?: string;
};

/** Envelope for every list endpoint. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/** Error body the API returns for a failed request. */
export type ApiErrorBody = {
  /** Stable machine-readable code, when the server provides one. */
  code?: string;
  message?: string;
  /** Field-level validation errors or other structured detail. */
  details?: unknown;
};

/** Accepted error envelope: `{ error: { code, message, details } }`. */
export type ApiErrorResponse = {
  error: ApiErrorBody;
};

/** Single value accepted in a query string. */
export type QueryValue = string | number | boolean | null | undefined;

/** Query string for a request. Arrays are repeated under the same key. */
export type QueryParams = Record<string, QueryValue | QueryValue[]>;

/** Query parameters every list endpoint understands. */
export type PaginationParams = {
  page?: number;
  limit?: number;
};

/** HTTP status used when the request never reached the server. */
export const NETWORK_ERROR_STATUS = 0;

/** Error code attached to network failures and aborted requests. */
export const NETWORK_ERROR_CODE = 'network_error';

export type ApiErrorOptions = {
  /** HTTP status, or `NETWORK_ERROR_STATUS` when there was no response. */
  status: number;
  code?: string;
  details?: unknown;
  cause?: unknown;
};

/**
 * Failure of an API request. Carries enough detail for the UI to branch on the
 * status, show the server message, and map validation `details` onto fields.
 * Internal request details are never exposed through it.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status;
    this.code = options.code;
    this.details = options.details;
  }
}

/** Narrows an unknown caught value to an `ApiError`. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
