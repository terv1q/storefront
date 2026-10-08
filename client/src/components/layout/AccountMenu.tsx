/**
 * The account entry in the header.
 *
 * The menu belongs to the session, which comes from the Stage 13 auth layer:
 * `useSession` answers with the account or `null`, and `useLogout` clears the
 * stored token and the query cache. The menu itself is presentational, so no
 * second copy of the session is kept here.
 *
 * The menu is a Radix dropdown, which brings arrow-key movement, Home and End,
 * type-ahead, Escape, the return of focus to the trigger, and a close on any
 * click or focus that lands outside it. What the primitive does not decide is
 * how it opens: the wrapper opens it when the pointer enters, but only where
 * `(hover: hover)` matches, and the trigger's own click — which is also the
 * click Enter and Space produce — always opens it, so hover is a shortcut and
 * never the only way in.
 *
 * The panel is in a portal, so it is not inside the wrapper that opened it, and
 * a pointer that travels from the trigger down into the panel leaves the wrapper
 * on the way. Closing on that leave shut the menu the pointer was on its way
 * into, which made every item in it unreachable by mouse. The panel therefore
 * carries the same enter and leave handlers as the trigger and sits close enough
 * that the delay covers the gap between them; the close is a timer either way,
 * so a pointer crossing the gap cancels it instead of racing it.
 *
 * Order counts are deliberately absent: the orders endpoint has no client query
 * layer yet, and a badge would have to come from a request this stage is not
 * allowed to invent.
 */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, LogOut, Package, Settings, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useLogout, useSession } from '@/features/auth/auth.queries';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import type { User as Account } from '@/types/user';

/** First letters of the name, for the avatar. Falls back to the address. */
function initialsOf(user: Account): string {
  const letters = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.trim();

  return (letters || user.email.charAt(0)).toUpperCase();
}

const itemClass =
  'flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm text-ink-700 no-underline outline-none select-none hover:bg-ink-100 hover:text-ink-900 hover:no-underline focus:bg-ink-100 focus:text-ink-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-60';

/**
 * How long a leave waits before it closes the menu. Long enough for a pointer to
 * cross the gap between the trigger and the panel, short enough not to feel
 * stuck.
 */
const CLOSE_DELAY_MS = 180;

export function AccountMenu({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const session = useSession();
  const logout = useLogout();
  const navigate = useNavigate();
  const account = session.data ?? null;

  const canHover = useMediaQuery('(hover: hover)');

  const openOnHover = () => {
    if (!canHover) {
      return;
    }

    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };

  // A short delay, so a pointer crossing the gap between the trigger and the
  // panel does not close the menu it was on its way to.
  const closeOnLeave = () => {
    if (!canHover) {
      return;
    }

    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    // `modal={false}` because this menu opens on hover. A modal dropdown makes
    // the rest of the page ignore the pointer while it is open, which takes the
    // hover off the trigger the moment the panel appears: the menu opens, the
    // pointer is no longer over anything, it closes, the pointer lands on the
    // trigger again, and it reopens. That flicker is the break this fixes. The
    // cart preview was never affected because a popover is not modal by default.
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <div
        className={cn('relative', className)}
        onMouseEnter={openOnHover}
        onMouseLeave={closeOnLeave}
      >
        <DropdownMenu.Trigger
          aria-label={strings.account.menuTitle}
          className="inline-flex h-10 items-center gap-2 rounded-control px-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 data-[state=open]:bg-ink-100 data-[state=open]:text-ink-900"
        >
          {account ? (
            <>
              <span
                aria-hidden="true"
                className="grid h-7 w-7 place-content-center rounded-full bg-brand-600 text-xs font-semibold text-white"
              >
                {initialsOf(account)}
              </span>
              <span className="hidden max-w-24 truncate lg:inline">{account.firstName}</span>
            </>
          ) : (
            <>
              <User aria-hidden="true" size={20} />
              <span className="hidden lg:inline">{strings.nav.account}</span>
            </>
          )}
          <ChevronDown aria-hidden="true" size={16} className="text-ink-500" />
        </DropdownMenu.Trigger>
      </div>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          // The panel is portalled, so these two handlers are what keep it open
          // while the pointer is inside it.
          onMouseEnter={openOnHover}
          onMouseLeave={closeOnLeave}
          className="overlay-panel z-header w-60 overflow-hidden rounded-panel border border-border bg-surface py-1 shadow-overlay"
        >
          {account ? (
            <>
              <DropdownMenu.Label className="truncate px-4 py-2 text-xs text-ink-500">
                {strings.account.greeting(account.firstName)}
              </DropdownMenu.Label>

              <DropdownMenu.Item asChild>
                <Link to={paths.account} className={itemClass}>
                  <Settings aria-hidden="true" size={16} className="text-ink-500" />
                  {strings.account.accountDetails}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link to={paths.orders} className={itemClass}>
                  <Package aria-hidden="true" size={16} className="text-ink-500" />
                  {strings.account.orders}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link to={paths.wishlist} className={itemClass}>
                  <User aria-hidden="true" size={16} className="text-ink-500" />
                  {strings.nav.wishlist}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-border" />

              <DropdownMenu.Item
                disabled={logout.isPending}
                onSelect={() => {
                  // Signing out while standing on the account page would leave
                  // the visitor on a page they may no longer see, so the store
                  // front is where the session ends.
                  logout.mutate(undefined, {
                    onSuccess: () => navigate(paths.home, { replace: true }),
                  });
                }}
                className={itemClass}
              >
                <LogOut aria-hidden="true" size={16} className="text-ink-500" />
                {logout.isPending ? strings.account.signingOut : strings.account.signOut}
              </DropdownMenu.Item>
            </>
          ) : (
            <>
              <DropdownMenu.Label className="px-4 py-2 text-xs text-ink-500">
                {strings.account.signInPrompt}
              </DropdownMenu.Label>

              <DropdownMenu.Item asChild>
                <Link to={paths.login} className={itemClass}>
                  {strings.account.signIn}
                </Link>
              </DropdownMenu.Item>

              <DropdownMenu.Item asChild>
                <Link to={paths.register} className={itemClass}>
                  {strings.account.register}
                </Link>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
