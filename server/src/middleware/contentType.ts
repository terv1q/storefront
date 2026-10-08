/**
 * Content-type guard.
 *
 * The API reads JSON and only JSON. A request that carries a body in any other
 * format is rejected before the parser sees it, so a form post or an upload
 * cannot arrive as a silently empty `req.body` and fail later as a confusing
 * validation error.
 *
 * A request with no body passes through untouched, which is what keeps `GET`
 * and `DELETE` working: neither carries a body, and neither declares a content
 * type.
 *
 * One route takes a body that is not JSON — a review's photographs, which are
 * multipart. It is listed by the application when the guard is built, so the
 * exception is one named path rather than a general willingness to parse
 * whatever arrives.
 */

import type { Request, RequestHandler } from 'express';

import { ApiError } from '../utils/apiError.js';

/** Methods whose body the API is willing to read. */
const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function hasBody(request: Request): boolean {
  const length = request.headers['content-length'];

  if (length !== undefined && length !== '' && Number(length) > 0) {
    return true;
  }

  // A chunked request has no length to read, so the header itself is the signal.
  return request.headers['transfer-encoding'] !== undefined;
}

function isJson(header: string | undefined): boolean {
  if (header === undefined) {
    return false;
  }

  // Parameters such as `; charset=utf-8` do not change the media type.
  const mediaType = header.split(';')[0]?.trim().toLowerCase() ?? '';

  // `application/json` plus the structured suffixes, such as `application/merge-patch+json`.
  return mediaType === 'application/json' || mediaType.endsWith('+json');
}

/** Media types that are not JSON but are read by a parser of their own. */
function isMultipart(header: string | undefined): boolean {
  if (header === undefined) {
    return false;
  }

  return (header.split(';')[0]?.trim().toLowerCase() ?? '') === 'multipart/form-data';
}

export type ContentTypeOptions = {
  /**
   * Paths that read a multipart body instead of JSON, as patterns matched
   * against the request path. There is one such route — a review's photographs —
   * and it is named by whoever mounts it rather than guessed at here.
   */
  multipartPaths?: readonly RegExp[];
};

/**
 * The guard. `multipartPaths` widens it for the routes that declared an upload,
 * and only for a request that actually announces `multipart/form-data`: a JSON
 * body sent to an upload route is still read as JSON.
 */
export function requireJsonContentType(options: ContentTypeOptions = {}): RequestHandler {
  const { multipartPaths = [] } = options;

  return (request, _response, next) => {
    if (!BODY_METHODS.has(request.method) || !hasBody(request)) {
      next();
      return;
    }

    const header = request.headers['content-type'];

    if (isJson(header)) {
      next();
      return;
    }

    if (isMultipart(header) && multipartPaths.some((pattern) => pattern.test(request.path))) {
      next();
      return;
    }

    next(new ApiError(415, 'unsupported_media_type', 'Send the request body as application/json.'));
  };
}
