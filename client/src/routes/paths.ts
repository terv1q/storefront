/**
 * Route paths. Patterns are registered in the router; the builder functions keep
 * links and navigation out of string literals.
 */
export const paths = {
  home: '/',

  categoryPattern: '/c/:categorySlug',
  category: (categorySlug: string) => `/c/${encodeURIComponent(categorySlug)}`,

  search: '/search',

  productPattern: '/product/:slug',
  product: (slug: string) => `/product/${encodeURIComponent(slug)}`,

  cart: '/cart',
  checkout: '/checkout',
  /**
   * The page an order lands on. It carries the order id rather than keeping the
   * placed order in memory, so a reload, a bookmark, or an opened link all show
   * the same confirmation — the order is the server's, not the tab's.
   */
  orderConfirmationPattern: '/checkout/confirmation/:id',
  orderConfirmation: (id: string) => `/checkout/confirmation/${encodeURIComponent(id)}`,
  login: '/login',
  register: '/register',

  account: '/account',
  orders: '/account/orders',
  orderPattern: '/account/orders/:id',
  order: (id: string) => `/account/orders/${encodeURIComponent(id)}`,

  wishlist: '/wishlist',
} as const;
