/**
 * Auth endpoints. Handlers stay thin: they read what `validate` has already
 * parsed, call the service, and wrap the result in the `{ data }` envelope the
 * client expects. Every rule about accounts lives in the service.
 */

import type { RequestHandler } from 'express';

import {
  login,
  register,
  toPublicUser,
  type LoginInput,
  type RegisterInput,
} from '../services/auth.service.js';
import { ApiError } from '../utils/apiError.js';

export const registerHandler: RequestHandler = async (request, response, next) => {
  try {
    const session = await register(request.body as RegisterInput);

    response.status(201).json({ data: session, message: 'Account created.' });
  } catch (error) {
    next(error);
  }
};

export const loginHandler: RequestHandler = async (request, response, next) => {
  try {
    const session = await login(request.body as LoginInput);

    response.status(200).json({ data: session });
  } catch (error) {
    next(error);
  }
};

/**
 * The account is already loaded by `requireAuth`, so it is serialised from
 * there rather than read a second time.
 */
export const meHandler: RequestHandler = (request, response, next) => {
  try {
    const user = request.user;

    if (user === undefined) {
      // Unreachable behind `requireAuth`; it exists so the handler cannot read
      // an undefined account if the middleware is ever reordered.
      throw ApiError.unauthorized();
    }

    response.status(200).json({ data: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};
