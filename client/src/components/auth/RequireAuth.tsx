/**
 * The guard around the pages that need an account.
 *
 * Wrapped around a route element, it renders that element for a signed-in
 * visitor and sends everybody else to sign in — carrying the address they asked
 * for, so the form returns them to it rather than to the storefront.
 *
 * Three states, and each one has to be handled differently or the guard is a
 * source of flicker:
 *
 * * **`hydrating`** — a token exists and the server has not confirmed it. The
 *   route waits. Redirecting here would sign out a visitor who is merely being
 *   confirmed, which is what a reload of an account page looks like.
 * * **`authenticated`** — the page renders.
 * * **`anonymous`** — the redirect. With no token this is known on the first
 *   render, so a signed-out visitor is sent to the form without waiting for a
 *   request that would only confirm it.
 *
 * The interrupted address travels two ways on purpose. Router state is exact but
 * dies with the history entry; the `returnUrl` query parameter survives a reload
 * of the sign-in page. The sign-in page reads the state first and the parameter
 * second, and validates whichever it finds.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { loginPathWithReturn, safeReturnUrl } from '@/routes/returnUrl';

import { AuthPending } from './AuthPending';

export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isAuthenticated) {
    return <Outlet />;
  }

  if (auth.isHydrating) {
    return <AuthPending />;
  }

  const from = safeReturnUrl(`${location.pathname}${location.search}`);

  return <Navigate to={loginPathWithReturn(from)} state={{ from }} replace />;
}
