import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import { RedirectIfAuthed } from '@/components/auth/RedirectIfAuthed';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Layout } from '@/components/layout/Layout';
import { AccountPage } from '@/pages/AccountPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrderConfirmationPage } from '@/pages/OrderConfirmationPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { ProductPage } from '@/pages/ProductPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { SearchPage } from '@/pages/SearchPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { WishlistSync } from '@/features/wishlist/useWishlistSync';
import { useLanguage } from '@/i18n/strings';
import { paths } from '@/routes/paths';

/**
 * The routes, rebuilt when the language changes.
 *
 * Components read their copy from `strings` during render, and `strings` is
 * reassigned in place when the visitor switches language, so a render is what
 * puts the new sentences on the screen. The `key` is what produces that render:
 * it makes React throw the tree away and build it again, rather than asking
 * every component in the application to subscribe to the language itself.
 *
 * Nothing is lost by the remount. The routes hold no state worth keeping — the
 * cart, the wishlist, and the market are in stores outside the tree — and the
 * alternative, a `useSyncExternalStore` subscription in every component that
 * reads a sentence, is a hook call in fifty files to change one thing.
 *
 * The query cache, on the other hand, is exactly the kind of state the remount
 * does *not* clear, and it has to be: a cached response to `GET /api/products`
 * holds names in the language it was asked in, and nothing in the cache knows
 * that. Clearing it is one line here; putting the language into every query key
 * would be a change to every feature module and a trap for the next query that
 * someone adds without it.
 */
export function App() {
  const language = useLanguage();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
  }, [language, queryClient]);

  return (
    <>
      {/*
        The visitor's saved products are moved into the account the moment a
        session appears. It renders nothing: it is the one place that has to be
        mounted for that to happen, and it is outside the keyed routes so a
        language switch does not restart it.
      */}
      <WishlistSync />

      <Routes key={language}>
        <Route element={<Layout />}>
          <Route path={paths.home} element={<HomePage />} />
          <Route path={paths.categoryPattern} element={<ProductsPage />} />
          <Route path={paths.search} element={<SearchPage />} />
          <Route path={paths.productPattern} element={<ProductPage />} />
          <Route path={paths.cart} element={<CartPage />} />

          {/*
            The two guards are layout routes rather than wrappers repeated on
            each page, so a page that is added to one of these groups inherits
            the rule instead of having to remember it. Signing in and registering
            are the wrong pages for somebody who is already signed in; the
            account, the orders, and the checkout are the wrong pages for
            somebody who is not.
          */}
          <Route element={<RedirectIfAuthed />}>
            <Route path={paths.login} element={<LoginPage />} />
            <Route path={paths.register} element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path={paths.checkout} element={<CheckoutPage />} />
            <Route path={paths.orderConfirmationPattern} element={<OrderConfirmationPage />} />
            <Route path={paths.account} element={<AccountPage />} />
            <Route path={paths.orders} element={<OrdersPage />} />
            <Route path={paths.orderPattern} element={<OrderDetailPage />} />
          </Route>

          <Route path={paths.wishlist} element={<WishlistPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
