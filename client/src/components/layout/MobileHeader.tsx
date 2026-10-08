/**
 * The compact header shown below the large breakpoint.
 *
 * One row: the drawer trigger, the mark, a search toggle, and the basket. Saved
 * items and the account menu are not repeated here — the drawer and the fixed
 * bottom bar both carry them, and a fourth control would leave the mark about
 * eighty pixels wide on the smallest phone the store supports.
 *
 * Search opens as a panel rather than as a field, because the row has no space
 * for one and a field that is always visible would shrink the mark to nothing at
 * 320 px. The panel holds the same `SearchBar` the desktop row uses, so the
 * scope selector, the suggestions, and the keyboard handling do not fork.
 *
 * The panel is a Radix popover, which is what supplies Escape, the press
 * outside, and the return of focus to the toggle. The popover's own focus move is
 * turned off so that the field takes the caret — the popover would otherwise
 * focus its container and leave the visitor one Tab away from typing. The field
 * places the caret itself; see the note in `SearchBar`.
 *
 * The row sticks to the top like the desktop header, and stops being rendered
 * once the desktop header takes over.
 */

import * as Popover from '@radix-ui/react-popover';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { CartButton } from '@/components/layout/CartButton';
import { Logo } from '@/components/layout/Logo';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchBar } from '@/components/search/SearchBar';
import { useScrolled } from '@/hooks/useScrolled';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

export function MobileHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  const scrolled = useScrolled();
  const { pathname } = useLocation();

  // Navigating away from the page the search was opened on closes the panel,
  // including when the move came from the browser rather than from the panel.
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'sticky top-0 z-header border-b transition-[background-color,box-shadow,border-color] duration-200 lg:hidden',
        scrolled
          ? 'border-border bg-surface/95 shadow-raised backdrop-blur'
          : 'border-transparent bg-surface',
      )}
    >
      <div className="mx-auto flex max-w-page items-center gap-1 px-page-x py-2">
        <MobileMenu />
        <Logo compact className="mx-auto" />

        <Popover.Root open={searchOpen} onOpenChange={setSearchOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label={searchOpen ? strings.header.closeSearch : strings.header.openSearch}
              className="rounded-control p-2 text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
            >
              {searchOpen ? (
                <X aria-hidden="true" size={20} />
              ) : (
                <Search aria-hidden="true" size={20} />
              )}
            </button>
          </Popover.Trigger>

          <Popover.Portal>
            <Popover.Content
              align="end"
              sideOffset={8}
              collisionPadding={8}
              // The field's own autofocus is what should take the caret.
              onOpenAutoFocus={(event) => event.preventDefault()}
              className="overlay-panel z-header w-[calc(100vw-2rem)] max-w-md rounded-panel border border-border bg-surface p-3 shadow-overlay"
            >
              <SearchBar focusOnMount onNavigate={() => setSearchOpen(false)} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>

        <CartButton preview={false} />
      </div>
    </header>
  );
}
