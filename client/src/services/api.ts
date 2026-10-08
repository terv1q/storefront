/**
 * API client. One fetch wrapper that every future endpoint module calls:
 * it builds the URL, attaches the access token, attaches the language, parses
 * JSON, and turns a failed response into an `ApiError`.
 *
 * The language is attached here rather than by each feature module because the
 * answer to a catalog question depends on it: the same product has a different
 * name in each language, so a request without one is a request for the wrong
 * data. A caller that needs a different language from the interface's — nothing
 * does today — passes `lang` in its own query and wins, since the defaults are
 * applied under the caller's values.
 *
 * Expected server responses are described by `types/api.ts`; nothing here
 * unwraps envelopes, so a caller receives exactly what the server sent.
 *
 * No endpoint is defined in this stage. Feature modules call `api.get`,
 * `api.post`, `api.put`, `api.patch`, and `api.delete`, or `apiRequest` when
 * they need an option the shortcuts do not expose.
 */

import { getLanguage, strings } from '@/i18n/strings';
import {
  ApiError,
  NETWORK_ERROR_CODE,
  NETWORK_ERROR_STATUS,
  type ApiErrorBody,
  type QueryParams,
} from '@/types/api';
import { clearAuthStorage, getAccessToken } from '@/utils/storage';

const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

/** Base URL for every request. Falls back to the path the dev server proxies. */
const baseUrl = (configuredBaseUrl || '/api').replace(/\/+$/, '');

/**
 * Where the API's own origin is, for the files it serves itself.
 *
 * An uploaded photograph is answered as a path (`/uploads/reviews/<uuid>.jpg`)
 * rather than an address, so the same row works wherever the API is deployed.
 * With no `VITE_API_URL` the API is reached through this origin and the path is
 * already correct; with one, the path is completed with that origin.
 */
export function resolveApiAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = /^https?:\/\//i.test(baseUrl) ? new URL(baseUrl).origin : '';

  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  /**
   * Serialised as a JSON body when present. A `FormData` is sent as it is, so
   * the browser writes its own content type and boundary.
   */
  body?: unknown;
  query?: QueryParams;
  /** Extra headers, applied after the defaults so they can override them. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Attach the stored access token. Defaults to true. */
  auth?: boolean;
};

function buildUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Appends query parameters, skipping empty values and repeating arrays. */
function appendQuery(url: string, query?: QueryParams): string {
  if (!query) {
    return url;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    const values = Array.isArray(value) ? value : [value];

    for (const item of values) {
      if (item === undefined || item === null || item === '') {
        continue;
      }

      search.append(key, String(item));
    }
  }

  const queryString = search.toString();

  if (!queryString) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
}

/** Reads the body without ever throwing: a broken body is treated as absent. */
async function parseJson(response: Response): Promise<unknown> {
  let text: string;

  try {
    text = await response.text();
  } catch {
    return undefined;
  }

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Accepts both `{ error: { … } }` and a flat `{ code, message, details }`. */
function readErrorBody(payload: unknown): ApiErrorBody {
  if (!isRecord(payload)) {
    return {};
  }

  const source = isRecord(payload.error) ? payload.error : payload;

  return {
    code: typeof source.code === 'string' ? source.code : undefined,
    message: typeof source.message === 'string' ? source.message : undefined,
    details: source.details,
  };
}

function defaultErrorMessage(status: number): string {
  return status === 401 || status === 403 ? strings.errors.unauthorized : strings.errors.generic;
}

function createApiError(response: Response, payload: unknown): ApiError {
  const body = readErrorBody(payload);

  return new ApiError(body.message ?? defaultErrorMessage(response.status), {
    status: response.status,
    code: body.code,
    details: body.details,
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/**
 * Performs one request and resolves with the parsed body.
 * Rejects with `ApiError` for every failure: no response, an error status, or
 * a rejected fetch. An aborted request rethrows the original error so query
 * libraries can tell cancellation apart from failure.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, headers, signal, auth = true } = options;

  const requestQuery = { lang: getLanguage(), ...query };

  const requestHeaders = new Headers({ Accept: 'application/json' });

  // A `FormData` writes its own content type, and it is the only one that
  // carries the multipart boundary the server needs to read the parts.
  const isFormData = body instanceof FormData;

  if (body !== undefined && !isFormData) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const token = auth ? getAccessToken() : null;

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  for (const [key, value] of Object.entries(headers ?? {})) {
    requestHeaders.set(key, value);
  }

  let response: Response;

  try {
    response = await fetch(appendQuery(buildUrl(path), requestQuery), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    throw new ApiError(strings.errors.network, {
      status: NETWORK_ERROR_STATUS,
      code: NETWORK_ERROR_CODE,
      cause: error,
    });
  }

  const payload = await parseJson(response);

  if (!response.ok) {
    // The stored session is no longer accepted, so it is dropped before the
    // error reaches the caller.
    if (response.status === 401) {
      clearAuthStorage();
    }

    throw createApiError(response, payload);
  }

  // An empty body (204, or a response with no content) resolves as undefined.
  return payload as T;
}

type ShortcutOptions = Omit<RequestOptions, 'method' | 'body'>;

/** Request shortcuts. Every method returns the parsed body typed as `T`. */
export const api = {
  get<T>(path: string, options?: ShortcutOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'GET' });
  },

  post<T>(path: string, body?: unknown, options?: ShortcutOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'POST', body });
  },

  put<T>(path: string, body?: unknown, options?: ShortcutOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'PUT', body });
  },

  patch<T>(path: string, body?: unknown, options?: ShortcutOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'PATCH', body });
  },

  delete<T>(path: string, options?: ShortcutOptions): Promise<T> {
    return apiRequest<T>(path, { ...options, method: 'DELETE' });
  },
};
