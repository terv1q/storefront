/**
 * Not-found handling.
 *
 * Two mount points use it: the API router ends with it, so an unknown
 * `/api/…` path answers with the same JSON envelope as every other failure, and
 * the application ends with it, so a request for anything else does too. A
 * browser asking for `/api/nope` gets JSON, not Express's HTML page.
 */

import type { RequestHandler } from 'express';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: 'not_found',
      message: 'This endpoint does not exist.',
    },
  });
};
