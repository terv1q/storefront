/**
 * The guard around the sign-in and registration pages.
 *
 * A visitor who is already signed in has nothing to do on these pages, so they
 * are sent on — to the address they were trying to reach, or to the storefront.
 *
 * It handles the same three states as `RequireAuth`, and for the same reason:
 * drawing the form while a stored session is being confirmed would show a
 * sign-in page to somebody who is already signed in, and that form would then
 * disappear under them. While the answer is in flight the route waits.
 *
 * The two guards cannot disagree about the wait, because both read it from the
 * same hook — and a session read that fails outright is not a wait in either of
 * them, so the form is drawn rather than a spinner that never ends.
 */

import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useReturnUrl } from '@/routes/returnUrl';

import { AuthPending } from './AuthPending';

export function RedirectIfAuthed() {
  const auth = useAuth();
  const returnUrl = useReturnUrl();

  if (auth.isAuthenticated) {
    return <Navigate to={returnUrl} replace />;
  }

  if (auth.isHydrating) {
    return <AuthPending />;
  }

  return <Outlet />;
}
