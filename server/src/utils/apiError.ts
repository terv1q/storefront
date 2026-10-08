/**
 * Error type for everything the API rejects on purpose.
 *
 * The central error handler reads `status`, `code`, and `details` off whatever
 * it is given, so anything thrown as an `ApiError` reaches the client as
 * `{ error: { code, message, details } }` without a special case per route.
 *
 * `code` is the stable, machine-readable half of the pair: the client branches
 * on it, while `message` is copy that may be rewritten.
 */

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'bad_request', message, details);
  }

  static unauthorized(message = 'You need to sign in to continue.'): ApiError {
    return new ApiError(401, 'unauthorized', message);
  }

  static invalidCredentials(): ApiError {
    return new ApiError(401, 'invalid_credentials', 'The email or password is incorrect.');
  }

  static invalidToken(message = 'Your session has expired. Please sign in again.'): ApiError {
    return new ApiError(401, 'invalid_token', message);
  }

  static forbidden(message = 'You do not have access to this resource.'): ApiError {
    return new ApiError(403, 'forbidden', message);
  }

  static notFound(message = 'The requested resource does not exist.'): ApiError {
    return new ApiError(404, 'not_found', message);
  }

  static conflict(code: string, message: string, details?: unknown): ApiError {
    return new ApiError(409, code, message, details);
  }

  static validationFailed(
    details: unknown,
    message = 'The submitted values are not valid.',
  ): ApiError {
    return new ApiError(422, 'validation_failed', message, details);
  }
}
