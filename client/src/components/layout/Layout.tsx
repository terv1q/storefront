import { Outlet, useLocation } from 'react-router-dom';

import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { ToastViewport } from '@/components/common/Toast';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { OfflineBanner } from '@/components/layout/OfflineBanner';
import { strings } from '@/i18n/strings';

export function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <ScrollToTop />

      {/*
        First in the tab order, and only visible once focused. It matters most on
        the catalog overlay and the account menu, which both put a stretch of
        navigation ahead of the page.
      */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-modal focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-ink-900 focus:shadow-overlay"
      >
        {strings.header.skipToContent}
      </a>

      <OfflineBanner />
      <AnnouncementBar />
      <Header />
      <MobileHeader />

      {/*
        `flex-1` keeps the footer at the bottom of a short page. The bottom
        padding clears the fixed mobile navigation, which is out of the flow and
        would otherwise cover the last rows of the page.
      */}
      <main id="main-content" className="flex-1 pb-16 lg:pb-0">
        {/* Keyed by path so navigating away from a failed route clears the error. */}
        <RouteErrorBoundary key={pathname}>
          <Outlet />
        </RouteErrorBoundary>
      </main>

      <Footer />
      <MobileBottomNav />

      {/* Outside `main`, so a notification survives the route change that caused
          it — the save that empties a wishlist row navigates nowhere, but the
          order that was placed does, and the confirmation belongs over the page
          that comes next. */}
      <ToastViewport />
    </div>
  );
}
