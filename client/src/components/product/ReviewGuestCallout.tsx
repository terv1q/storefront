/**
 * The note a visitor who is not signed in reads where the form would be.
 *
 * A review belongs to an account: it carries the reviewer's name, it is the
 * account that may edit it, and it is the order history attached to that account
 * that decides whether the verified badge is shown. So a guest has nothing to
 * submit to, and the honest thing to show is why, with the way to sign in beside
 * it.
 *
 * It is a note and not a disabled form: a form that refuses on submit, after the
 * words have been typed, is a worse answer than a sentence before them.
 */

import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { loginPathWithReturn, useCurrentReturnUrl } from '@/routes/returnUrl';

type Props = {
  className?: string;
};

export function ReviewGuestCallout({ className }: Props) {
  // Signing in from a product page should come back to that product, not to the
  // storefront: the review the visitor was about to write is here.
  const returnUrl = useCurrentReturnUrl();

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-card border border-border bg-surface-muted px-6 py-6 text-center',
        className,
      )}
    >
      <span className="grid h-10 w-10 place-content-center rounded-full bg-surface text-ink-400">
        <LogIn aria-hidden="true" size={20} />
      </span>

      <h3 className="text-sm font-semibold text-ink-900">
        {strings.productPage.reviews.guestHeading}
      </h3>

      <p className="max-w-md text-sm text-ink-600">{strings.productPage.reviews.guestCallout}</p>

      <Link
        to={loginPathWithReturn(returnUrl)}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {strings.productPage.reviews.guestAction}
      </Link>
    </div>
  );
}
