/**
 * What a guarded route draws while the session is still unknown.
 *
 * A stored token is confirmed by a request, and between the first render and the
 * answer there is no honest way to say whether the visitor is signed in. Drawing
 * the page would show an account that may not be theirs; drawing the sign-in
 * form would ask somebody who is already signed in to sign in; redirecting would
 * bounce a signed-in visitor off their own page. So the route waits, and this is
 * the wait.
 *
 * It is a real occupying element rather than nothing at all, so the page does
 * not jump when the answer arrives, and the sentence is announced, because a
 * spinner with no text tells a screen reader nothing about why the page is
 * empty.
 */

import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

export function AuthPending({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'mx-auto flex w-full max-w-narrow items-center gap-2 px-page-x py-16',
        className,
      )}
    >
      <LoadingSpinner size={18} className="text-ink-500" />
      <span className="text-sm text-ink-600">{strings.auth.checkingSession}</span>
    </div>
  );
}
