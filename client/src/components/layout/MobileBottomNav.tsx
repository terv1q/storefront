/**
 * The fixed bottom navigation shown below the large breakpoint.
 *
 * Five destinations in the order a phone shopper uses them: home, the catalog,
 * saved items, the basket, and the account. Active state comes from `NavLink`,
 * which also sets `aria-current`, so the current destination is announced
 * without the styles having to say so.
 *
 * Counts come from the same state as the header: the cart from the Zustand
 * store and the wishlist from `useWishlistState`, which answers for a signed-in
 * account from the server and for a visitor who has not registered from the list
 * in their browser. A count of zero renders no badge rather than a zero, because
 * "none" and "unknown" should not look the same.
 *
 * The bar is fixed, so it takes itself out of the flow; `Layout` adds the space
 * it occupies to the bottom of the page, which is what keeps the last row of a
 * page from hiding behind it. The safe-area inset keeps it clear of a phone's
 * home indicator.
 */

import { Heart, Home, ShoppingCart, User, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { HeaderCatalogButton } from '@/components/layout/HeaderCatalogButton';
import { useWishlistState } from '@/features/wishlist/wishlist.queries';
import { useCartCount } from '@/hooks/useCart';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

type BadgeProps = { count: number };

/** Nothing is drawn for zero: "none" and "unknown" must not look the same. */
function Badge({ count }: BadgeProps) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="absolute -top-0.5 left-1/2 ml-1 grid h-4 min-w-4 place-content-center rounded-full bg-brand-600 px-1 text-[0.625rem] leading-none font-semibold text-white"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

const itemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center justify-center gap-1 rounded-control px-1 py-1 text-xs no-underline hover:no-underline',
    isActive ? 'font-semibold text-brand-700' : 'text-ink-600 hover:text-ink-900',
  );

type TabProps = {
  to: string;
  icon: LucideIcon;
  label: string;
  count?: number;
  end?: boolean;
};

function Tab({ to, icon: Icon, label, count = 0, end = false }: TabProps) {
  return (
    <li className="flex flex-1">
      <NavLink
        to={to}
        end={end}
        className={itemClass}
        aria-label={count > 0 ? `${label} — ${strings.cart.itemCount(count)}` : label}
      >
        <span className="relative">
          <Icon aria-hidden="true" size={20} />
          <Badge count={count} />
        </span>
        {label}
      </NavLink>
    </li>
  );
}

export function MobileBottomNav() {
  const cartCount = useCartCount();
  const wishlist = useWishlistState();
  const wishlistCount = wishlist.count;

  return (
    <nav
      aria-label={strings.header.primaryNav}
      className="fixed inset-x-0 bottom-0 z-sticky border-t border-border bg-surface/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* A fixed height rather than one grown from its content: the sticky bars
          on the product and cart pages sit directly on top of this row, and their
          offset is this number. Every item is the same size, so the bar is the
          same size on every page. */}
      <ul className="mx-auto flex h-14 max-w-page items-stretch px-page-x">
        <Tab to={paths.home} icon={Home} label={strings.nav.home} end />

        <li className="flex flex-1">
          <HeaderCatalogButton variant="nav" />
        </li>

        <Tab to={paths.wishlist} icon={Heart} label={strings.nav.wishlist} count={wishlistCount} />
        <Tab to={paths.cart} icon={ShoppingCart} label={strings.nav.cart} count={cartCount} />
        <Tab to={paths.account} icon={User} label={strings.nav.account} />
      </ul>
    </nav>
  );
}
