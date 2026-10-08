/**
 * The per-field messages behind a `422`.
 *
 * The API answers a rejected form as `{ error: { code, message, details } }`,
 * and `details.fields` is the shape every validating endpoint uses:
 * `{ "email": "Enter a valid email address." }`. Reading it belongs in one
 * place, because three forms now place those messages — checkout, sign-in, and
 * registration — and a fourth copy of the walk over `details` is a copy that
 * drifts the first time the envelope changes.
 *
 * A failure that is not a field-level one answers with an empty map rather than
 * throwing: the caller then falls back to the message the error carries, which
 * is what it should show for a 401 or a 409 anyway.
 */

import { isApiError } from '@/types/api';

export type FieldErrors = Record<string, string>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** The field messages behind a 422, or an empty object for any other failure. */
export function fieldErrorsOf(error: unknown): FieldErrors {
  if (!isApiError(error) || !isRecord(error.details)) {
    return {};
  }

  const { fields } = error.details;

  if (!isRecord(fields)) {
    return {};
  }

  const errors: FieldErrors = {};

  for (const [field, message] of Object.entries(fields)) {
    // `_root` is where the server puts an issue about the object itself — a
    // request carrying a field the endpoint does not take, for instance. It is
    // not a field name, so it is left out: a form looking up its own fields
    // would find nothing, and the caller's fallback to the error's own message
    // is what should be shown for it.
    if (field.startsWith('_')) {
      continue;
    }

    if (typeof message === 'string') {
      errors[field] = message;
    }
  }

  return errors;
}

/** One field's message from a 422, or `null` when the field was accepted. */
export function fieldErrorOf(error: unknown, field: string): string | null {
  return fieldErrorsOf(error)[field] ?? null;
}
