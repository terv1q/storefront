/**
 * Response shapes shared by the services.
 *
 * These mirror `client/src/types/api.ts`, so a handler wraps a service result
 * in `{ data }` and the client reads it without a translation layer.
 */

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

/** Every list endpoint returns this envelope, whatever the filters were. */
export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
