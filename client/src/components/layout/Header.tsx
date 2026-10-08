/**
 * The desktop header.
 *
 * It is sticky at the top of the page and turns compact once the page has
 * scrolled past a short threshold: the padding tightens, a soft shadow appears,
 * and the background becomes translucent so the page reads through it. The
 * change is driven by `useScrolled`, which reports a boolean rather than a
 * position, so scrolling inside the top of the page re-renders nothing and the
 * header never fights the scroll for a frame.
 *
 * Two rows. The first carries the mark, the catalog trigger, the search field,
 * and the account controls. The second carries the category bar and, pushed to
 * the right, the shortcuts into the list filters. Only the padding of the first
 * row changes with the scroll state; the second row is fixed, so the header's
 * height is the same in both states and the page below cannot jump when the
 * state flips.
 *
 * Every control in the first row is the same height — the catalog trigger, the
 * search field with its scope selector and its submit button, the wishlist, the
 * account menu, and the cart all sit at `h-10` — because a row of controls that
 * each sized themselves from their own padding is a row that never quite lines
 * up, and the mismatch is most visible on the icon buttons, which have nothing
 * else to align to.
 *
 * The row that holds the category bar is the positioning context for the mega
 * menu, which is why it is the element that carries `relative`: the panels span
 * the content width rather than the width of the trigger that opened them.
 *
 * Below the large breakpoint this header is not rendered at all; `MobileHeader`
 * takes over, so the two layouts never compete for the same space.
 */

import { Link } from 'react-router-dom';

import { AccountMenu } from '@/components/layout/AccountMenu';
import { CartButton } from '@/components/layout/CartButton';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { HeaderCatalogButton } from '@/components/layout/HeaderCatalogButton';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { Logo } from '@/components/layout/Logo';
import { WishlistButton } from '@/components/layout/WishlistButton';
import { SearchBar } from '@/components/search/SearchBar';
import { getQuickLinks } from '@/config/navigation';
import { useScrolled } from '@/hooks/useScrolled';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

export function Header() {
  const scrolled = useScrolled();
  const quickLinks = getQuickLinks();

  return (
    <header
      data-scrolled={scrolled}
      className={cn(
        'sticky top-0 z-header hidden border-b transition-[background-color,box-shadow,border-color] duration-200 lg:block',
        scrolled
          ? 'border-border bg-surface/95 shadow-raised backdrop-blur'
          : 'border-transparent bg-surface',
      )}
    >
      <div
        className={cn(
          'mx-auto flex max-w-page items-center gap-3 px-page-x transition-[padding] duration-200',
          scrolled ? 'py-2' : 'py-3',
        )}
      >
        <Logo />

        <HeaderCatalogButton />

        <SearchBar className="max-w-xl min-w-0 flex-1" />

        <nav aria-label={strings.header.accountNav} className="ml-auto flex items-center gap-1">
          <LanguageSwitcher />
          <WishlistButton withLabel />
          <AccountMenu />
          <CartButton />
        </nav>
      </div>

      <div className="relative mx-auto flex max-w-page items-center gap-4 border-t border-border px-page-x">
        <CategoryNav />

        <nav
          aria-label={strings.nav.quickLinks}
          className="ml-auto flex shrink-0 items-center gap-1"
        >
          {quickLinks.map((link) => (
            <Link
              key={link.key}
              to={link.to}
              className="rounded-control px-2 py-2 text-sm text-ink-600 no-underline transition-colors hover:bg-ink-100 hover:text-ink-900 hover:no-underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
