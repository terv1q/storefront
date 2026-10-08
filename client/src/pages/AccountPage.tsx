/**
 * The account portal: who the account is, where its orders go, and how it is
 * signed in with.
 *
 * The three sections are one page with a tab bar rather than three routes. They
 * share the same heading, the same session, and the same question — "what does
 * the store know about me" — and none of them is worth a bookmark of its own.
 * The tab is still in the address bar (`?tab=address`), so a reload comes back to
 * the section that was open and a support reply can point at one.
 *
 * The tab bar is a set of links rather than buttons imitating tabs. Each section
 * already has a URL, so a link is what the control honestly is, `aria-current`
 * marks the open one, and the back button behaves the way it does everywhere else
 * on the site.
 *
 * The two things the account owns elsewhere — the orders and the saved products —
 * are linked from the top of the page rather than given a tab, because they are
 * pages, not panels.
 */

import { Heart, Package } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { AddressForm } from '@/components/account/AddressForm';
import { PasswordForm } from '@/components/account/PasswordForm';
import { ProfileForm } from '@/components/account/ProfileForm';
import { useSession } from '@/features/auth/auth.queries';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';

const TABS = ['profile', 'address', 'security'] as const;

type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return value !== null && (TABS as readonly string[]).includes(value);
}

export function AccountPage() {
  useSeo({ title: strings.pages.account.title, noIndex: true });

  const [params] = useSearchParams();
  const session = useSession();

  const requested = params.get('tab');
  const tab: Tab = isTab(requested) ? requested : 'profile';
  const user = session.data ?? null;

  return (
    <div className="mx-auto flex max-w-narrow flex-col gap-6 px-page-x py-page-y">
      <header>
        <h1 className="text-2xl font-semibold text-ink-900">{strings.pages.account.title}</h1>
        <p className="mt-1 text-sm text-ink-600">
          {user === null ? '' : strings.account.greeting(user.firstName)}
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <AccountLink
          to={paths.orders}
          icon={<Package aria-hidden="true" size={18} />}
          title={strings.account.orders}
          body={strings.account.links.ordersBody}
        />
        <AccountLink
          to={paths.wishlist}
          icon={<Heart aria-hidden="true" size={18} />}
          title={strings.account.links.wishlist}
          body={strings.account.links.wishlistBody}
        />
      </div>

      <nav aria-label={strings.account.tabsLabel} className="flex gap-1 border-b border-border">
        {TABS.map((name) => (
          <Link
            key={name}
            to={name === 'profile' ? paths.account : `${paths.account}?tab=${name}`}
            aria-current={tab === name ? 'page' : undefined}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              tab === name
                ? 'border-brand-700 text-brand-700'
                : 'border-transparent text-ink-600 hover:text-ink-900',
            )}
          >
            {strings.account.tabs[name]}
          </Link>
        ))}
      </nav>

      {user === null ? (
        // `RequireAuth` keeps an anonymous visitor off this page, and the session
        // is still being read on the way here.
        <p className="text-sm text-ink-600">{strings.auth.checkingSession}</p>
      ) : (
        <div className="rounded-card border border-border bg-surface p-6">
          {/* Keyed on the account, so a different sign-in does not inherit the
              previous one's typed values. */}
          {tab === 'profile' ? <ProfileForm key={user.id} user={user} /> : null}
          {tab === 'address' ? <AddressForm /> : null}
          {tab === 'security' ? <PasswordForm /> : null}
        </div>
      )}
    </div>
  );
}

type AccountLinkProps = {
  to: string;
  icon: ReactNode;
  title: string;
  body: string;
};

function AccountLink({ to, icon, title, body }: AccountLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-start gap-3 rounded-card border border-border p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <span className="mt-0.5 text-ink-600">{icon}</span>
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-ink-900">{title}</span>
        <span className="text-xs text-ink-600">{body}</span>
      </span>
    </Link>
  );
}
