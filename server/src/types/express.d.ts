/**
 * Express request augmentation. `requireAuth` attaches the account it loaded to
 * `req.user`, and every handler behind that middleware reads it from here.
 *
 * The declaration lives in a `.d.ts` because the global augmentation is only
 * valid in a declaration file, and it must stay in step with `AuthUser` in
 * `middleware/auth.ts`.
 */

import type { AuthUser } from '../middleware/auth.js';

declare global {
  namespace Express {
    interface Request {
      /** Present only behind `requireAuth`. */
      user?: AuthUser;
    }
  }
}

export {};
