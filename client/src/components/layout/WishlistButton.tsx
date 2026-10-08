/**
 * The saved-items entry in the header.
 *
 * The count comes from `useWishlistState`, which answers for a signed-in account
 * from the server and for a visitor who has not registered from the list in
 * their browser. A guest therefore sees their own count before they sign in,
 * rather than a zero that would be a claim about something the header cannot
 * know. The count is part of the link's name, because the badge itself is
 * decorative and a screen reader would otherwise read only "Wishlist".
 */

import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useWishlistState } from '@/features/wishlist/wishlist.queries';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

type Props = {
  className?: string;
  /** Shows the word next to the icon, for the wider desktop header. */
  withLabel?: boolean;
};

export function WishlistButton({ className = '', withLabel = false }: Props) {
  const wishlist = useWishlistState();
  const count = wishlist.count;

  const label =
    count > 0 ? `${strings.nav.wishlist} — ${strings.cart.itemCount(count)}` : strings.nav.wishlist;

  return (
    <Link
      to={paths.wishlist}
      aria-label={label}
      className={cn(
        'relative inline-flex h-10 items-center gap-2 rounded-control px-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900 hover:no-underline',
        className,
      )}
    >
      <span className="relative">
        <Heart aria-hidden="true" size={20} />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-content-center rounded-full bg-ink-700 px-1 text-[0.625rem] leading-none font-semibold text-white"
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </span>
      {withLabel ? <span className="hidden lg:inline">{strings.nav.wishlist}</span> : null}
    </Link>
  );
}
