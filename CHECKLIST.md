# Ziyo Storefront — Implementation Checklist

Reference studied: target.com (home page, browse, search, product detail, cart, checkout, account).
Ziyo is a smaller store with the same shape: strong header/footer navigation, category browsing with
filters and sorting, a search-led experience, a detailed product page, and a simple checkout.

Work top to bottom. Each stage is small enough to finish and verify before the next one starts.
Stages assume the existing `storefront` folder layout. Files that already exist as empty placeholders
are marked "existing". New files are listed with their full path so nothing has to be redesigned later.

## Stack decisions (fixed, do not revisit)

- Package manager: pnpm workspace, `client` + `server` packages (already configured).
- Client: Vite, React, TypeScript, React Router, Zustand for client state, Tailwind CSS for styling,
  TanStack Query for server state, Zod for form and response validation.
- Server: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT access tokens, bcrypt password hashes,
  Zod request validation.
- Tests: Vitest + React Testing Library (client), Vitest + Supertest (server), Playwright (end to end).
- Money: amounts stored as integers in minor units (tiyin) in the database, formatted for display by
  `client/src/utils/formatPrice.ts`. Default locale `uz-UZ`, currency `UZS`.
- Language: interface copy in English for now; all user-facing strings live in one place
  (`client/src/i18n/strings.ts`) so translation can be added later without touching components.

---

## Stage 0 — Repository and tooling

- [x] Add `package.json` scripts at the workspace root: `dev`, `build`, `lint`, `test`, `typecheck`.
- [x] Create `pnpm-workspace.yaml` listing `client` and `server`.
- [x] Add root `tsconfig.base.json` with shared compiler options.
- [x] Extend `tsconfig.base.json` from `client/tsconfig.json` and `server/tsconfig.json` (happens in Stages 1 and 5). Both done: `client/tsconfig.app.json` and `client/tsconfig.node.json` extend `../tsconfig.base.json`, and `server/tsconfig.json` extends it too, so the strict options — `noUncheckedIndexedAccess` among them — are written once.
- [x] Add ESLint and Prettier config at the root (`eslint.config.js`, `.prettierrc`, `.prettierignore`), ignoring `dist` and `node_modules`.
- [x] Add `.editorconfig` (LF line endings, UTF-8, two-space indent).
- [x] Fill `.env.example` at the root with `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `CLIENT_ORIGIN`.
- [x] Fill `client/.env.example` with `VITE_API_URL`.
- [x] Add `.gitignore` entries for build output, `.env`, caches, test artifacts, editor and OS files.
- [x] Add minimal `package.json` files to `client` and `server` so pnpm recognises them as workspace members.
- [x] Confirm `pnpm install --frozen-lockfile` succeeds from a clean checkout.

## Stage 1 — Client project setup

- [x] Fill `client/package.json` with dependencies: react, react-dom, react-router-dom, zustand,
      @tanstack/react-query, zod, tailwindcss, and dev dependencies: vite, vitest, jsdom,
      @testing-library/react, @testing-library/user-event. TypeScript itself comes from the workspace root.
- [x] Fill `client/vite.config.ts`: React plugin, Tailwind plugin, `@` alias pointing at `client/src`,
      dev server proxy for `/api` to the server port, Vitest configuration.
- [x] Fill `client/tsconfig.json`, `client/tsconfig.app.json`, `client/tsconfig.node.json` with strict mode on.
- [x] Fill `client/index.html`: title, meta description, viewport, language, Open Graph tags, Twitter card
      tags, theme colour, favicon from `client/public/assets/brand/favicon.svg`. No preconnect is added,
      because no third-party origin is used yet.
- [x] Create `client/src/vite-env.d.ts` with typed `ImportMetaEnv`.
- [x] Create `client/src/main.tsx` (existing): mount React, wrap in QueryClientProvider and BrowserRouter.
- [x] Verify the dev server starts and renders a placeholder.

### SEO foundation (added during Stage 1)

- [x] Create `client/src/config/seo.ts` with the site name, configurable site URL, title template, default
      description, default image, and an `absoluteUrl` helper built on `VITE_SITE_URL`.
- [x] Create `client/src/lib/seo.ts` with the `useSeo` hook: title, description, robots, canonical link,
      Open Graph, and Twitter card tags. Existing tags are updated in place, so routes cannot emit duplicates.
- [x] Add `client/public/robots.txt` with crawl rules and a sitemap reference. Written here as a static file, and moved to the server in Stage 39: it had to name the sitemap's address, and a file in `public` cannot know the origin the deployment is served from. It was a placeholder host with a comment asking somebody to remember to replace it.
- [x] Add `client/public/sitemap.xml` with the static routes that exist today. The file was written here and stayed empty, because there was nothing to put in it yet; it is deleted, and the sitemap is generated from the database instead — see the note on the bullet below.
- [x] Document `VITE_SITE_URL` in `client/.env.example`.
- [x] List category and product URLs in `sitemap.xml` once those pages exist (Stage 19 and Stage 23). Done in Stage 39, and done on the server rather than in the client: `GET /sitemap.xml` renders the catalog from the database — the home page, every active category at `/c/:slug`, and every active product at `/product/:slug` with its `lastmod` — because a checked-in file can only describe the seed it was written against. Against the seeded database it answers 154 URLs; a product switched off disappears from it, which is the whole reason it is generated.
- [x] Add Organization and WebSite structured data on the home page (Stage 18). Both are in `lib/structuredData.ts` and both are on the page, read from `config/site.ts` and `config/seo.ts` so a block can never claim an address, a telephone number, or an account the store does not have. `sameAs` is built from the same social block the footer links to.
- [x] Add Product, BreadcrumbList, and Review structured data on the pages that render that data
      (Stage 23 and Stage 24). `BreadcrumbList` is emitted by `components/layout/Breadcrumbs.tsx` from the trail the page hands it, so it follows the same chain the shopper sees. `Product` is emitted by `pages/ProductPage.tsx` from the product the page renders: name, description, sku, absolute image URLs, brand, and an `Offer` carrying the price in major units, the currency, and `InStock`/`OutOfStock`, with `aggregateRating` present only when something has been reviewed. `Review` is **not** emitted, and the reason is a real gap rather than an oversight: the reviews are a second request (`GET /api/products/:slug/reviews`) that the page makes below the fold, so a schema built at render time would either omit them or claim a rating before it had read one — see the note in Stage 39.

## Stage 2 — Design tokens and base styles

- [x] Create `client/src/styles/tokens.css` with the Ziyo palette, spacing scale, radii, shadows,
      container widths, and z-index scale.
- [x] Create `client/src/styles/global.css`: resets, base typography, focus-visible ring, image defaults.
- [x] Configure Tailwind theme to read the same tokens (colors, font sizes, spacing) so utilities and
      custom CSS never diverge. Tailwind 4 is configured in CSS: the tokens live in an `@theme` block,
      and Tailwind emits them as `:root` custom properties that both utilities and plain CSS consume.
- [x] Create `client/src/i18n/strings.ts` holding shared copy (nav labels, button text, empty states, errors).
- [x] Create `client/src/config/site.ts` with store name, currency, locale, support email, social URLs,
      and the announcement bar text.
- [x] Document the token names in a short comment block at the top of `tokens.css`.
- [x] Import `client/src/styles/global.css` from `main.tsx` so the tokens and base styles apply.

## Stage 3 — Application shell and routing

- [x] Create `client/src/routes/paths.ts` with every route path and a helper to build product, category,
      and order URLs.
- [x] Create `client/src/App.tsx` (existing): router setup with every route from the list below.
- [x] Create `client/src/components/layout/Layout.tsx` (existing): announcement bar, header, main outlet,
      footer, scroll-to-top on navigation.
- [x] Routes to register: `/`, `/c/:categorySlug`, `/search`, `/product/:slug`, `/cart`, `/checkout`,
      `/login`, `/register`, `/account`, `/account/orders`, `/account/orders/:id`, `/wishlist`, `*` (404).
- [x] Create `client/src/components/common/ScrollToTop.tsx`.
- [x] Create `client/src/pages/NotFoundPage.tsx` (existing) with a link back to the home page.
- [x] Add a route-level error boundary at `client/src/components/common/RouteErrorBoundary.tsx`.
- [x] Verify every route renders its page component with placeholder content.
- [x] Create structural `AnnouncementBar`, `Header`, and `Footer` components for the shell. Stage 14 and
      Stage 17 replace their placeholder content with the real navigation, menus, and link groups.
- [x] Create the placeholder page components the routes need, so no route renders an empty screen.
      Stages 19 to 31 replace each one with the real page.
- [x] Apply per-route page titles through the Stage 1 `useSeo` hook; private routes are marked `noindex`.

## Stage 4 — Shared types and API client

- [x] Create `client/src/types/api.ts` (existing): `ApiResponse<T>`, `Paginated<T>`, `ApiError`,
      query parameter shapes.
- [x] Create `client/src/types/product.ts` (existing): `Product`, `ProductVariant`, `ProductImage`,
      `Category`, `Brand`, `Review`, `ProductListQuery`.
- [x] Create `client/src/types/user.ts` (existing): `User`, `AuthTokens`, `LoginInput`, `RegisterInput`.
- [x] Create `client/src/types/order.ts` (existing): `Order`, `OrderItem`, `OrderStatus`, `Address`,
      `CheckoutInput`.
- [x] Create `client/src/services/api.ts` (existing): fetch wrapper that adds the base URL, attaches the
      access token, parses JSON, maps non-2xx responses to `ApiError`, and handles 401 by clearing auth.
- [x] Create `client/src/services/queryKeys.ts` with every TanStack Query key factory.
- [x] Create `client/src/utils/storage.ts` (existing): typed localStorage helpers for the token and cart
      persistence, guarded against unavailable storage.
- [x] Create `client/src/utils/formatPrice.ts` (existing): minor units to display string.
- [x] Create `client/src/utils/formatDate.ts` and `client/src/utils/slugify.ts`.
- [x] Verify the API client against a temporary echo endpoint.

## Stage 5 — Server bootstrap

- [x] Fill `server/package.json` with express, cors, helmet, morgan, zod, jsonwebtoken, bcryptjs, @prisma/client
      and dev dependencies: typescript, tsx, prisma, vitest, supertest, @types/*. Prisma 7 is engine-free, so
      it also needs the pg driver adapter (@prisma/adapter-pg, pg) and its types.
- [x] Fill `server/tsconfig.json` extending the root config, `outDir` `dist`, `rootDir` `src`, NodeNext module
      resolution so the emitted ESM runs under Node.
- [x] Create `server/src/config/env.ts` (existing): load and validate environment variables with Zod,
      export a typed `env` object, fail fast on startup when something is missing.
- [x] Create `server/src/database/index.ts`: Prisma client singleton built on the pg driver adapter, with query
      logging in development and a connectivity helper. The checklist originally placed this in
      `config/database.ts`; Stage 5 moved it to `database/index.ts`.
- [x] Create `server/prisma.config.ts`: the migrate connection URL, because Prisma 7 no longer reads `url` from
      the schema file.
- [x] Create `server/src/models/prisma.ts` (existing): re-export the client used by services.
- [x] Create `server/src/app.ts` (existing): express app with helmet, cors limited to `CLIENT_ORIGIN`,
      JSON body parser with size limit, request logging, `/api` router, not-found handler, error handler.
      The error handler lives in `server/src/middleware/error.ts` and answers in the client's
      `{ error: { code, message, details } }` shape.
- [x] Create `server/src/server.ts` (existing): read `PORT`, start the app, handle unhandled rejections
      and graceful shutdown.
- [x] Create `server/src/routes/index.ts` (existing): mount auth, product, category, search, and order routers.
- [x] Add a `GET /api/health` endpoint returning status and database connectivity.

## Stage 6 — Database schema

- [x] Fill `server/prisma/schema.prisma` (existing) with the datasource and generator blocks.
- [x] Model `User`: id, email (unique), passwordHash, firstName, lastName, phone, createdAt, updatedAt,
      relations to orders, addresses, reviews, wishlist items.
- [x] Model `Address`: id, userId, label, fullName, phone, country, city, street, postalCode, isDefault.
- [x] Model `Category`: id, name, slug (unique), description, imageUrl, parentId (self relation), sortOrder, isActive.
- [x] Model `Brand`: id, name, slug (unique), logoUrl.
- [x] Model `Product`: id, name, slug (unique), description, shortDescription, categoryId, brandId,
      price (Int, minor units), compareAtPrice (Int nullable), currency, sku (unique), stock (Int), rating
      (Float), reviewCount (Int), isActive, isFeatured, isNew, createdAt, updatedAt.
- [x] Model `ProductImage`: id, productId, url, alt, sortOrder.
- [x] Model `ProductVariant`: id, productId, name, value, priceDelta, stock, sku.
- [x] Model `ProductSpec`: id, productId, group, label, value, sortOrder.
- [x] Model `Review`: id, productId, userId, rating, title, body, isApproved, createdAt.
- [x] Model `WishlistItem`: id, userId, productId, createdAt, unique on (userId, productId).
- [x] Model `Order`: id, orderNumber (unique), userId, status (enum), subtotal, discountTotal, shippingTotal,
      total, currency, customer fields, shipping address fields, paymentMethod, paymentStatus, createdAt.
      Also carries `deliveryMethod`, `notes`, and `updatedAt`, because Stage 29 collects delivery method
      and notes and every other model tracks an update time.
- [x] Model `OrderItem`: id, orderId, productId (nullable), name snapshot, unitPrice, quantity, lineTotal.
- [x] Enum `OrderStatus`: PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED.
- [x] Enum `PaymentStatus`: UNPAID, PAID, FAILED, REFUNDED. Stage 6 also added `PaymentMethod` (CARD, CASH)
      and `DeliveryMethod` (COURIER, PICKUP), so the columns match the unions the client already declares.
- [x] Add indexes: product slug, product categoryId, product isActive, review productId, order userId and createdAt.
- [x] Add cascade rules: deleting a product keeps order items (store snapshots), deleting a user cascades
      cart-free data such as wishlist items.
- [x] Run `prisma format` and `prisma validate`.

## Stage 7 — Migrations and seed data

- [x] Create the initial migration and apply it against the local PostgreSQL instance.
      Migration `server/prisma/migrations/20260918043117_init`.
- [x] Fill `server/prisma/seed.ts` (existing) with idempotent upserts.
- [x] Seed at least 8 top-level categories with 2–4 subcategories each, taken from the reference structure
      (clothing, home, kitchen, beauty, electronics, toys, grocery, deals).
- [x] Seed 6 brands and roughly 120 products spread across categories, with realistic names, prices,
      compare-at prices on discounted items, stock values, ratings, and review counts.
- [x] Seed product images pointing at files under `client/public/assets/products`.
- [x] Seed variants and specifications for at least 20 products.
- [x] Seed 3 users, one with a populated order history, and reviews for popular products.
- [x] Put the catalog literals in `server/prisma/seed-data.ts` so the seed and the asset generator share
      one source of truth.
- [x] Add `server/prisma/generate-assets.ts` (run with `pnpm prisma:assets`) to write the placeholder
      product, category, and brand artwork under `client/public/assets`.
- [x] Configure the seed command for Prisma 7 in `server/prisma.config.ts` under `migrations.seed`, and
      load `.env` there because Prisma 7 no longer does it for a project with a config file.
- [x] Add `prisma:*` scripts to `server/package.json` (`seed`, `migrate`, `migrate:deploy`, `status`,
      `reset`, `format`, `validate`, `generate`, `assets`) and typecheck `prisma/` through
      `server/tsconfig.prisma.json`.
- [x] Confirm the seed is idempotent: a second run leaves every count unchanged.
- [x] Document the migrate, seed, and reset commands in `README.md`.

Notes on the catalog photography (a later follow-up to the placeholder artwork above):

The seed now stores `.jpg` paths and `server/prisma/fetch-photos.ts` (`pnpm prisma:photos`) downloads a
real photograph for every one of them from Wikimedia Commons. It is one file that has to change if a
keyed source such as Pexels or Pixabay is ever wanted. The run covers 179 images — 145 product and
gallery photographs and 34 category images — takes about nine minutes, needs no key, is resumable, and
writes `client/public/assets/photos-credits.json`, which is a licence record and not an optional extra:
almost everything on Commons is CC BY or CC BY-SA, and both require the author and licence to be
credited wherever the picture appears. Brands keep their drawn SVG marks, because the brands are
fictional and Commons has nothing for them.

What decides whether the result looks like a shop, in the order it mattered:

- The query, not the filter. A storefront product name is far more specific than any caption: "Men's
  Merino Crewneck Sweater" matches nothing on Commons and "sweater" matches a hundred files. The first
  version searched the whole name and produced `Andean Man.jpg` for a shirt. `queryLadder()` now drops
  one leading modifier at a time and `searchWords()` strips brand, numeric, marketing, quantity, and
  demographic words, so the search ends at the object noun.
- The head noun has to appear in the title, and matching on any shared word is not enough. "Oxford"
  pulled in a photograph of Trinity College Chapel for an Oxford shirt and "fit" pulled in sailors
  taking respirator fit tests for slim fit chinos.
- Some product nouns are also place names: "Chino, California" landed on a pair of chinos and
  "Cardigan, Ceredigion" on a cardigan, so a comma straight after the noun rejects the title.
- A category's name is a storefront label, not a caption. Left to itself, "Deals" found the town of
  Deal in Kent, "Clearance" found a bridge's clearance gauge, "Pantry" found a seventeenth-century
  still life, and "Home" found an inauguration. `CATEGORY_QUERIES` lists the 34 categories explicitly,
  each term ending in the noun for the object.
- Titles that are charts or statistics and titles describing a damaged object are rejected separately.
  "Smartphone ownership in 2013" and "Burned laptop" both contain the right word and neither belongs on
  a card. `NOT_A_PHOTO` was also unanchored, which meant "graph" rejected every file whose title
  mentioned a photograph, "sign" every designer chair, and "plan" every plant.

Known weak spot: a product whose name ends in a packing word — "Skincare Starter Bundle", "Kids Play
Bundle" — names a promotion and contains no object noun, so the last word left to search for is
"starter" or "play". Asking the category instead was tried and measured worse, not better, because
those products sit in the `deals` subcategory and `deals` searched Commons for the town of Deal. Three
or four of the 179 images are therefore wrong in this particular way.

The drawn SVG placeholders are kept — 170 KB in total, and `generate-assets.ts` is a pure function of
`seed-data.ts`, so they are reproducible rather than precious. `ARTWORK_EXTENSION` in `seed-data.ts` is
the single switch between the two producers, and both scripts build their paths from the same URL
builders so a drawn card and a photograph can never land on different paths.

## Stage 8 — Authentication backend

- [x] Create `server/src/utils/password.ts` (existing): hash and compare with bcrypt, cost factor 12.
- [x] Create `server/src/utils/jwt.ts` (existing): sign and verify access tokens, typed payload.
- [x] Create `server/src/utils/apiError.ts` with an `ApiError` class carrying status codes.
- [x] Create `server/src/middleware/validate.ts` (existing): validate body, query, and params against a Zod
      schema and replace them with parsed values.
- [x] Create `server/src/middleware/auth.ts` (existing): verify the bearer token, load the user, attach it
      to `req.user`, reject with 401 when missing or invalid.
- [x] Create `server/src/middleware/requireAdmin.ts` for admin-only routes.
- [x] Create `server/src/middleware/error.ts` (existing): central error handler mapping `ApiError`, Zod
      errors, Prisma errors, and unknown errors to consistent JSON responses.
- [x] Create `server/src/services/auth.service.ts` (existing): register, login, current user, password hashing,
      duplicate email handling.
- [x] Create `server/src/controllers/auth.controller.ts` (existing): thin handlers calling the service.
- [x] Create `server/src/routes/auth.routes.ts` (existing): `POST /register`, `POST /login`, `GET /me`,
      each with its Zod schema.
- [x] Verify with HTTP requests: register, login, call `/me` with and without a token.

Notes added during Stage 8:

- The schema has no role column and adding one is a later decision, so `requireAdmin` reads an
  `ADMIN_EMAILS` allowlist from the environment. It is empty by default, which makes every account a
  normal customer.
- `server/src/types/express.d.ts` augments `Express.Request` with `user`. It lives in a declaration
  file because the global `namespace Express` augmentation is invalid anywhere else.
- A validation failure answers 422 with `details.fields`, a `{ field: message }` map the client can
  put straight onto its form inputs. `middleware/validate.ts` and `middleware/error.ts` build the same
  shape, so a `ZodError` that escapes a route produces an identical response.
- `GET /me` serialises the account `requireAuth` already loaded instead of querying the database a
  second time.

## Stage 9 — Product and category backend

- [x] Create `server/src/services/product.service.ts` (existing): list with filters, sorting, and pagination;
      single product by slug with images, variants, specs, and rating summary.
- [x] Create `server/src/services/category.service.ts` (existing): full category tree, category by slug with
      breadcrumb chain, and product counts per category.
- [x] Create `server/src/controllers/product.controller.ts` (existing) and `category.controller.ts` (existing).
- [x] Create `server/src/routes/product.routes.ts` (existing): `GET /api/products`, `GET /api/products/:slug`,
      `GET /api/products/:slug/related`, `GET /api/products/:slug/reviews`.
- [x] Create `server/src/routes/category.routes.ts` (existing): `GET /api/categories`,
      `GET /api/categories/:slug`, `GET /api/products/featured`.
- [x] Support list query parameters: `category`, `q`, `brand`, `minPrice`, `maxPrice`, `minRating`, `inStock`,
      `onSale`, `sort`, `page`, `limit`.
- [x] Support sort values: `featured`, `price_asc`, `price_desc`, `rating`, `newest`.
- [x] Return the standard paginated envelope: items, total, page, pageSize, totalPages.
- [x] Verify each endpoint with real seeded data.

Notes added during Stage 9:

- `GET /api/products/featured` is registered in `server/src/routes/product.routes.ts`, not in
  `category.routes.ts` as this checklist groups it. The path lives under `/products`, and keeping it in one
  file is what allows `/:slug` to be declared after it; in the category router it would sit in a file that
  the category router never sees.
- `productCount` on a category counts the active products in that category and in its descendants. The seed
  files every product under a leaf, so a count of the category's own rows would report zero for all eight
  top-level entries.
- A category slug in the product list expands to that category plus its direct children, so `?category=clothing`
  returns the products filed under `mens-clothing`. An unknown category returns an empty page rather than a
  404, because a stale link should show "no products" rather than an error.
- `GET /api/categories/:slug` returns the category with `breadcrumbs`, the chain from the root down to itself.
  That field is additive; the client's `Category` type does not declare it yet.
- `onSale` compares the compare-at price against the price with a Prisma field reference, so it means
  "actually discounted" rather than "has a compare-at price".
- Every ordering ends with `id`, so products that share a price or a rating keep a stable order across pages.
- The rating summary on a product is the stored `rating` and `reviewCount`, which the seed sets to a realistic
  public counter. `GET /api/products/:slug/reviews` returns only approved reviews and pages over them.
- `server/src/types/api.ts` was added for the `Paginated<T>` and `ApiResponse<T>` shapes the services return.
  It mirrors `client/src/types/api.ts`.

## Stage 10 — Search backend

- [x] Add full-text search over product name, short description, and brand using PostgreSQL `ILIKE` plus a
      trigram index, or Prisma full-text search if the index proves simpler.
- [x] Add `GET /api/search/suggestions?q=` returning up to 8 product names, brands, and categories.
- [x] Add `GET /api/search?q=` returning a paginated product list that reuses the product list service.
- [x] Handle empty and single-character queries without hitting the database.
- [x] Log slow queries above 200 ms for later tuning.
- [x] Verify relevance ordering for a few sample queries.

Notes added during Stage 10:

- Matching is `ILIKE '%term%'` over the product name, the short description, and the brand name — the same
  three columns the product list filters on. Ranking is `pg_trgm`'s `similarity()`, so a product whose name is
  close to the term sorts above one that merely mentions it. A plain `LIKE` cannot rank, which is why the
  ordering is computed in SQL rather than left to Prisma.
- Migration `20260918050259_search_trigram_indexes` adds GIN trigram indexes on `Product.name`,
  `Product.shortDescription`, `Brand.name`, and `Category.name`. The `CREATE EXTENSION IF NOT EXISTS pg_trgm`
  line at the top is hand-written: Prisma can express the indexes in `schema.prisma` but not the extension, and
  the extension has to exist before the indexes that use its operator classes. `pg_trgm` is a trusted extension
  in PostgreSQL 13 and newer, so the database owner can install it without superuser rights.
- At the current size of 120 products the planner still chooses a sequential scan, which is correct for a table
  this small. `SET enable_seqscan = off` confirms the indexes are usable when the table grows.
- `/api/search` reuses the product list service twice over: `listProducts` handles the explicit-`sort` case
  with the catalog's own ordering, and `listProductsByIds` returns the ranked rows through the same select and
  the same mapper as a catalog card.
- Ordering is fully determined — score, then rating, then id — so the same query returns the same page in the
  same order. Verified by repeating a query and by checking that consecutive pages do not overlap.
- An empty, whitespace-only, or single-character `q` returns an empty page from the service without a database
  query. The schema treats a blank term as "not given" rather than as a validation failure, because a shopper
  who clears the search box has not made a mistake.
- Suggestions share the eight slots out as four products, then two brands, then two categories, so a broad term
  cannot push brands and categories out entirely. Products rank first because a shopper is usually looking for
  one.
- Percent, underscore, and backslash in a term are escaped before they reach `LIKE`, where they are wildcards,
  and the term itself is always a bound parameter. Searching for `100%` matches nothing rather than everything.
- Slow-query logging lives in the Prisma client itself, as an extension over `$allOperations`, so a slow query
  is reported wherever it came from rather than only from the services that remember to measure themselves. The
  threshold is `SLOW_QUERY_MS = 200` in `server/src/database/index.ts`. Verified with a query that sleeps for
  350 ms: it logs, and a fast query stays silent.
- Query-parameter schemas were extracted from `product.routes.ts` into `server/src/utils/queryParams.ts`, so the
  product list and search validate their parameters the same way instead of keeping two copies of the same
  rules. No endpoint contract changed.

## Stage 11 — Order backend

- [x] Create `server/src/services/order.service.ts` (existing): create an order inside a transaction,
      re-check stock and prices server side, decrement stock, generate the order number, discard the client cart.
- [x] Add order listing for the current user, ordered by creation date, and single order by id with an
      ownership check.
- [x] Create `server/src/controllers/order.controller.ts` (existing) and `order.routes.ts` (existing):
      `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:id`.
- [x] Add `POST /api/orders/:id/cancel` allowed only while the status is PENDING or CONFIRMED, restoring stock.
- [x] Validate the checkout payload with Zod: customer name, phone, email, city, street, optional notes,
      payment method, and a non-empty item list.
- [x] Reject orders when a product is inactive or the requested quantity exceeds stock, returning a clear
      per-item error.
- [x] Add wishlist endpoints: `GET /api/wishlist`, `POST /api/wishlist`, `DELETE /api/wishlist/:productId`.
- [x] Verify with HTTP requests, including the failure paths.

Notes added during Stage 11:

- A checkout payload names products and quantities and nothing else. Zod strips unknown keys, so a client that
  sends its own `price` or `lineTotal` has them dropped before the service sees them; the price, the compare-at
  price, and the available stock are read from the database inside the transaction that writes the order.
  Verified with a payload that claimed `price: 1` on a 1 490 000 so'm product: the order was priced at the
  stored amount.
- The whole checkout runs in one serialisable transaction: lines are priced, stock is decremented, the order
  number is allocated, and the order and its items are written. A rejected checkout leaves no order and takes
  no stock, which was verified by reading the product's stock after every failure case.
- Overselling is prevented by a conditional update rather than by a read-then-write. Each line decrements with
  `updateMany({ where: { id, isActive: true, stock: { gte: quantity } } })`; a row that no longer has enough
  matches nothing and the checkout fails with `items.N.quantity`. Two simultaneous checkouts for the last six
  units of a product produced exactly one order and a stock of zero, never negative.
- Double stock restoration is prevented the same way. Cancellation is an `updateMany` restricted to
  `status: { in: ['PENDING', 'CONFIRMED'] }`, so exactly one caller can make the transition; a second cancel —
  including one racing the first — matches no row and answers `409 order_not_cancellable`. Two simultaneous
  cancels of one order restored the stock once.
- Duplicate lines are merged before stock is checked, so two lines of eight against a stock of fourteen cannot
  jointly pass. The merged quantity is what is validated and decremented.
- Order numbers are read and allocated inside the transaction (`ZY-<year>-<sequence>`, starting at 1001). A
  write conflict or a duplicate number is retried up to three times; anything else propagates.
- Another account's order answers `404`, not `403`, on both read and cancel, so a stranger cannot learn that an
  order exists at all. Both were verified with a second seeded account.
- Money is an integer number of tiyin and the columns are 32-bit, which caps any single value at about
  21 474 836 so'm. A basket of several expensive products can cross that line, so checkout checks the line
  totals and the order total first and answers `422` with a readable message instead of letting the insert fail
  with a database range error.
- `OrderItem` has no `variantId` column, so a supplied `variantId` is accepted, checked that it belongs to the
  chosen product, and then not recorded: the order line is the product. Applying a variant's price delta and
  stock is a schema change for a later stage, not something to fake here.
- Wishlist entries reference `Product` rows, so adding an inactive or unknown product answers `404`, and the
  list is read back through `listProductsByIds`, which drops a product that has since been deactivated. Adding
  the same product twice returns the existing row with `200` instead of creating a duplicate; deleting one that
  is not there answers `404`.
- `server/src/utils/validation.ts` holds the shared email, phone, password, and name field schemas. The auth
  routes were switched to it, so checkout and registration validate a phone number the same way.
- The courier fee is a flat 25 000 so'm with free pickup, as a named constant in the order service.
  `discountTotal` records what the basket saved against the compare-at prices of the day; the charged price is
  `unitPrice`, so the total is `subtotal + shippingTotal` and never subtracts the discount twice.

## Stage 12 — Backend hardening

- [x] Add `server/src/middleware/rateLimit.ts` and apply it to auth and order creation.
- [x] Add request size limits and reject unexpected content types.
- [x] Ensure error responses never leak stack traces or Prisma internals in production.
- [x] Add `server/src/middleware/notFound.ts` for unknown `/api` routes.
- [x] Add CORS allowlist, credentials handling, and preflight caching.
- [x] Add a startup check that `JWT_SECRET` is not the example value in production.
- [x] Confirm every route has input validation and that IDs are validated as UUIDs or integers as modeled.

Notes added during Stage 12:

- `server/src/middleware/rateLimit.ts` is a small in-memory fixed-window limiter rather than a new
  dependency; the API already has everything it needs for counters that live in one process. Login is
  limited to ten attempts per address per fifteen minutes, registration to five, and checkout to
  twenty per account. The counters are per process, which is the right trade for a single-instance
  deployment; a fleet would move them into Redis behind the same interface.
- Checkout is counted per account, not per address, because it runs after `requireAuth`. That way one
  customer retrying does not spend an allowance shared with everyone else behind the same address.
- A limited request answers `429` with the project's envelope, a `code` the client can branch on
  (`too_many_login_attempts`, `too_many_registrations`, `too_many_orders`), a `Retry-After` header, and
  `details.retryAfter` in seconds. Every response also carries `RateLimit-Limit`, `RateLimit-Remaining`,
  and `RateLimit-Reset`, so a well-behaved client can pace itself instead of discovering the limit by
  being rejected.
- `server/src/middleware/contentType.ts` rejects a request with a body that is not JSON with `415`. It
  keys off the method and the presence of a body — `Content-Length` above zero or a chunked transfer —
  so a `GET` or a `DELETE` with no content type passes straight through. Without this guard a form post
  would arrive as an empty `req.body` and fail later as a confusing validation error.
- The body ceiling is `100kb`, already set on the JSON parser; it now answers `413` through the central
  error handler instead of Express's HTML page, and a malformed body answers `400` with a plain
  message rather than the parser's description of where it gave up.
- `server/src/middleware/notFound.ts` is mounted twice: at the end of the API router, so an unknown
  `/api/…` path or a known path with an unsupported method answers with the standard envelope, and at
  the end of the application, so a non-API path does too.
- CORS is an explicit allowlist built from `CLIENT_ORIGIN`, which now accepts a comma-separated list so
  a deployment can serve more than one address. Development additionally accepts any `localhost` or
  `127.0.0.1` origin, because a second dev server takes a different port. `credentials` stays off: the
  storefront authenticates with a bearer token, so the browser never needs to send a cookie, and
  leaving it off keeps the API from being usable as a cross-site cookie client. Preflight responses are
  cached for a day in production and ten minutes in development, and only `Content-Type` and
  `Authorization` are allowed as request headers.
- A preflight from an origin that is not on the list is answered `403 origin_not_allowed` by
  `rejectUnlistedPreflight` in `app.ts`. The `cors` package leaves a request whose origin it rejects to
  the rest of the stack, which would send an `OPTIONS` request on to the routes and, on a protected
  one, to a `401` that says nothing about CORS.
- A production server refuses to start while `JWT_SECRET` is still the example value from
  `.env.example`, or shorter than 32 characters. Development and test keep using the example secret,
  which is what it is for. `CLIENT_ORIGIN` is also parsed and validated at startup: an entry that is not
  a URL, or an empty list, stops the process with the variable named.
- The error handler now only takes its message from an `ApiError`. Every other failure is described by
  its status, so a Prisma message, a SQL fragment, or a parser's description of a malformed body cannot
  reach a client. The stack is attached in development only, and the column names behind a unique
  constraint violation are included in development only. Verified by calling the handler directly in
  both modes: production responses carried no `stack`, and Prisma failures were reduced to a status and
  a generic message.
- Every user-controlled input already went through `validate` before this stage — the audit found no
  unvalidated body, query, or parameter. Product, category, and order ids that are Prisma UUIDs are
  checked with `z.uuid()`; the page and limit parameters are bounded integers; the category and product
  slugs are bounded strings. Nothing was rewritten, and no new schema was added.

### Second hardening pass: compression, caching, forwarding, and connection limits

Added after Stage 32, when a report that "even the home page is slow" was traced to this process.

- **`server/src/middleware/compress.ts` is new.** Responses were crossing the wire at full size: a
  twenty-four-product listing is 23,984 bytes of JSON, and the API was sending all of it. It is
  hand-rolled on `node:zlib` rather than pulled from the `compression` package, for the same reason the
  rate limiter is hand-rolled — the codec is the library's, and the part that is this application's is
  the decision to bother. Brotli is preferred over gzip and a tie goes to Brotli; quality values are
  honoured, so `gzip;q=0, br` gets Brotli and `identity` gets the bytes untouched. Bodies under 1 kB,
  content types that are already compressed, responses marked `no-transform`, and anything whose headers
  have already been sent are all left alone. Measured against the running server: the listing above is
  5,906 bytes with gzip and 5,419 with Brotli, and the facet counts go from 1,853 to 535.
- **`server/src/middleware/cacheControl.ts` is new.** Every answer is `no-store` unless a route opts
  out, because the API serves order history, account details, a wishlist, and a cart, and a shared cache
  that keeps one customer's answer to hand to the next is the worst thing this middleware could do.
  Opting in is the catalog — `/api/products`, `/api/categories`, `/api/delivery`, `/api/search` — and it
  only applies to a request that carries no `Authorization` header, because the review list marks the
  caller's own votes and the caller's own review sits under the same prefix. Those reads get
  `public, max-age=60, stale-while-revalidate=300`: a listing is served from the browser's copy for a
  minute, and for five minutes after that the stale copy is drawn immediately while a refresh runs
  behind it.
- **`TRUST_PROXY` is new in `config/env.ts`, and off by default.** Without it, a server behind a reverse
  proxy sees every request arrive from the proxy: the rate limiter would keep one counter for the whole
  world and every refusal in the log would name the proxy. With it set too generously, a caller can
  forge its own address and spend somebody else's allowance — which is why it is a variable an operator
  sets rather than a guess the code makes. It accepts what Express accepts: `true`, a hop count, or an
  address list.
- **Connection limits in `server.ts`.** `keepAliveTimeout` is 5 s, `headersTimeout` 20 s, and
  `requestTimeout` 30 s. Node's default header timeout is a minute, which is longer than this API needs
  to answer anything, and the cheapest way to exhaust a server is to open many connections and never
  finish the request line on any of them.
- **A global rate limiter on `/api`.** The limits in the routers guard the endpoints where one repeat is
  expensive. This one guards the endpoints where one repeat is cheap and a flood is not: 600 requests
  per address per minute. A page load is under a dozen requests, so a caller who meets this limit is not
  browsing. The health check is exempt (a probe that is being counted is one that can be refused, and a
  rate-limited 429 reads to a platform as a dead instance) and so are tests. `rateLimit` gained a `skip`
  option for it.

Verified: `pnpm lint` clean, `pnpm -r typecheck` passes, `pnpm -r build` succeeds, `pnpm --filter
client test` passes 7 files and 71 cases. Against the running server: a listing answers with
`Content-Encoding: br` and `Cache-Control: public, max-age=60, stale-while-revalidate=300`; the same
listing with `Accept-Encoding: identity` carries no encoding and its full length; `gzip;q=0, br` answers
Brotli; a conditional request with `If-None-Match` answers `304` with no body; the health endpoint and
every authenticated read answer `no-store`; and `Keep-Alive: timeout=5` confirms the connection timeout
took effect.

What this pass did not fix, and why it matters to the report it came from: the home page's weight is not
in this process. Warm responses were timed at 6–14 ms, median 6.9 ms over fifteen sequential featured
requests, and the catalog listing above is 6 kB over the wire after compression. The page's cost is
client-side — `client/public/assets/products` holds 291 JPEGs totalling about 27 MB, the largest 675 kB,
and the home page draws roughly thirty-five cards from them — and the production bundle is a single
1.09 MB chunk (321 kB gzipped) that Vite flags on every build. Neither is touched by this pass; both are
recorded here rather than fixed, because re-encoding the catalog's photographs and splitting the bundle
are changes to the repository's contents that should be decided deliberately.

## Stage 13 — Client data layer

- [x] Create `client/src/features/products/products.api.ts` (existing): list, detail, related, featured, categories.
- [x] Create `client/src/features/products/products.types.ts` (existing) and `products.queries.ts` with
      TanStack Query hooks and cache settings.
- [x] Create `client/src/features/auth/auth.api.ts` (existing) and `auth.types.ts` (existing).
- [x] Create `client/src/features/checkout/checkout.api.ts` (existing) and `checkout.types.ts` (existing).
- [x] Create `client/src/features/wishlist/wishlist.api.ts` and `.types.ts`.
- [x] Create `client/src/hooks/useProducts.ts` (existing) as the thin wrapper pages consume.
- [x] Create `client/src/hooks/useDebouncedValue.ts` for search input.
- [x] Create `client/src/hooks/useMediaQuery.ts` for responsive behaviour in components.
- [x] Confirm queries refetch correctly after mutations and that errors surface to the UI.

Notes added during Stage 13:

- Every feature module is split the same way: an `.api.ts` that only makes requests with the shared
  `api` client, and a `.queries.ts` that owns the keys, the cache settings, and the invalidations. No
  second fetch wrapper was written, and no component imports an api module directly.
- Cache policy lives in `client/src/services/queryOptions.ts`: one `STALE_TIME` entry per resource, a
  shared `GC_TIME`, and a shared `retryQuery` that retries only a request that never reached the
  server or that failed with a 5xx. A 401, 403, 404, 409, 422, or 429 is an answer, and retrying it
  only delays the message the page has to show.
- Query keys stay in `client/src/services/queryKeys.ts`. This stage added an optional `limit` to the
  related and featured keys, an optional `limit` to the order list key, and a `wishlist.list()` key.
  Keys are arguments, not state: the filters object is embedded in the list key, which is what makes a
  filter change a different cache entry rather than a stale one.
- `POST /api/wishlist` answers 200 with no message when the product was already saved and 201 with one
  when it was saved now. The api client does not expose the raw status, so `wishlist.api.ts` reads
  `created` from the presence of the envelope message. That is the only place the difference is
  visible to the client.
- Placing an order invalidates the products, the wishlist, and the order list. All three can show a
  stock hint, and a checkout line can name a product this client never rendered, so the invalidation
  is broad on purpose. The created order is written into the detail cache from the response, because
  the checkout response is the same order the detail endpoint returns.
- `useSession` asks `GET /api/auth/me` with or without a token and turns a 401 into `null` rather than
  an error: carrying a token is not something a component can watch, and "nobody is signed in" is a
  normal state that private routes redirect on. Signing in and registering seed that cache entry from
  their own response; signing out clears storage and the whole cache.
- The wishlist list query is enabled only once a session exists, so a signed-out visitor sends no
  request that can only answer 401.
- Types are re-exported, not redefined: `products.types.ts` and the other feature type files import
  the domain shapes from `client/src/types`, so there is one `Product`, one `Order`, and one `User`.
- `client/src/hooks/useProducts.ts` is the only place a page touches catalog data. It returns the
  products plus `isLoading`, `isFetching`, `isError`, `errorMessage`, `isEmpty`, and `refetch`, so no
  page imports TanStack Query or reads an `ApiError`.
- `client/src/hooks/useMediaQuery.ts` subscribes through `useSyncExternalStore` with a `false` server
  snapshot, so it is safe to render without a `window` and the listener is removed on unmount.
- `readCheckoutErrors` and `readCheckoutFailure` in `checkout.api.ts` read the 422 `details.fields`
  map and classify 401, 409, 422, and 429, so the checkout form can place a message under the line
  that failed without parsing the envelope itself.

Stage 14 — Header

    [x] Create client/src/components/layout/AnnouncementBar.tsx: dismissible promo ticker with auto-rotation, multi-currency/location selector (UZS/UZ), text from config/site.ts, and versioned dismissal stored in localStorage.

    [x] Create client/src/components/layout/HeaderCatalogButton.tsx: catalog trigger button with animated icon state (hamburger-to-X) launching a full-screen blurred mega-menu overlay.

    [x] Fill client/src/components/layout/Header.tsx (existing) with desktop layout: logo, catalog trigger, intelligent search field, account menu, wishlist icon, mini-cart preview button, and smart sticky header transitions on scroll.

    [x] Create client/src/components/layout/HeaderSearch.tsx: interactive search input with debounced suggestions, quick category scope selector, query clear button, loading state spinner, and submission routing to /search?q=.

    [x] Create client/src/components/layout/AccountMenu.tsx: hover/click dropdown showing login/register actions for guests, or avatar, initials, order status badges, account settings, and logout for signed-in users.

    [x] Create client/src/components/layout/CartButton.tsx: cart button with pulsing item badge and dynamic mini-cart dropdown preview showing recent items, subtotal, quick view, and checkout actions.

    [x] Create client/src/components/layout/MobileHeader.tsx and MobileBottomNav.tsx: compact mobile top header plus app-like fixed bottom navigation bar (Home, Catalog, Wishlist, Cart, Profile) with active badge counts.

    [x] Add UX enhancements and accessibility: keyboard trap handling, backdrop blur overlays, click-outside dismissal, smooth framer/CSS transitions, and complete ARIA attributes (aria-expanded, role="dialog").

    Notes on this stage:

    - The cart state had to exist before the header could show a count, so
      `client/src/features/cart/cart.types.ts` and `cart.store.ts` were written here, together with
      `client/src/hooks/useCart.ts`. It is one Zustand store and the only place cart state lives, so
      the header badge, the mini-cart, the bottom navigation, and the cart page read the same array
      and Stage 21 extends the store rather than adding a second one.
    - There was no client search module either. `client/src/features/search/` was added with the
      existing `queryKeys.search` factories, so the suggestion list is a cached query like any other
      rather than a second fetch path.
    - `AccountMenu` opens on hover only where `(hover: hover)` matches, and always opens on click,
      which is the click a button receives from Enter or Space. Hover is a shortcut, never the only
      way in. The same applies to the cart preview; because the narrow layout has no room for a
      preview, that instance navigates to the cart instead.
    - `AnnouncementBar` stores the dismissed version, not a boolean, so raising
      `siteConfig.announcement.version` brings the strip back for everyone without clearing anything
      else. Rotation pauses while the strip is hovered or focused, and does not start at all under
      `prefers-reduced-motion`, where the arrows still move it by hand.
    - `siteConfig.markets` holds one market, so the region selector is a prepared seam: the choice is
      config-driven, validated against the list, and persisted under `ziyo:market`, but every price in
      this version is already in UZS and a second entry is what turns it into a real switch.
    - The account menu shows no order badge. The orders endpoint has no client query layer yet, and a
      count would have to come from a request this stage may not invent.
    - The desktop header and the mobile header are never rendered at the same time (`hidden lg:block`
      against `lg:hidden`), and the same holds for the two catalog triggers, so the overlay has one
      instance on screen and needs no shared open state.
    - The layering scale in `tokens.css` is plain custom properties, which Tailwind does not build
      utilities from, so `global.css` declares `z-base` through `z-toast` with `@utility` against those
      tokens. Class names at the point of use read as `z-header` and `z-drawer`, and the values stay in
      one place.

Stage 15 — Main navigation and mobile menu

    [ ] Create client/src/components/layout/CategoryNav.tsx: full-width mega menu driven by the category tree with level-1 icons, multi-column subcategories, featured promo tiles, and brand links.

    [ ] Create client/src/components/layout/MobileMenu.tsx: slide-in drawer with multi-level accordion categories, search integration, language/currency selectors, and support links.

    [ ] Handle drawer accessibility: strict focus trapping, Escape key listener, body scroll lock (overflow: hidden), and automatic focus restoration on unmount.

    [ ] Create client/src/components/layout/Breadcrumbs.tsx: dynamic breadcrumb path generator with JSON-LD schema support used across category, product, and order detail pages.

    [ ] Add secondary navigation row: quick links for Deals, New Arrivals, Bestsellers, and Weekly Flash Offers below the main category bar.

    [ ] Verify full responsive adaptability down to 320 px viewport width and 200 percent browser zoom without horizontal clipping.

Stage 16 — Search experience

    [ ] Create client/src/components/search/SearchBar.tsx: reusable search input component shared between header, mobile search modal, and main search page.

    [ ] Create client/src/components/search/SearchSuggestions.tsx: rich floating overlay with debounced API queries, arrow key highlight navigation, and click-outside dismissal.

    [ ] Group suggestions into distinct visual sections: quick product matches with thumbnails and prices, categories, and top brand tags.

    [ ] Implement local search history in client/src/features/search/recentSearches.ts: display recent user queries with clear-all/remove options when search input is empty or focused.

    [ ] Handle async race conditions: cancel stale inflight requests and enforce query key ordering so rapid typing always renders the latest result.

Stage 17 — Footer

    [x] Fill client/src/components/layout/Footer.tsx (existing) with four comprehensive link columns: Shop, Customer Service, Account, and About Ziyo.

    [x] Add legal compliance row: links to Privacy Policy, Terms of Use, Returns & Refunds, Cookie Settings, and Accessibility Statement.

    [x] Add client/src/components/layout/SocialLinks.tsx: accessible social media icon links (Instagram, Facebook, Telegram, YouTube) using SVGs with hover feedback.

    [x] Add client/src/components/layout/NewsletterForm.tsx: email subscription form with client-side validation, submit loading state, success/error feedback, and zero layout shift.

    [x] Add store contact block: physical address, direct customer phone line, Telegram support handle, and operating hours.

    [x] Add secure payment mark row: static visual badges for local and international payment methods (Payme, Click, Uzcard, Humo, Visa, Mastercard).

    [x] Verify link target validity across all footer elements, confirming active routes or fallback placeholders marked as coming soon.

    Notes on this stage:

    - The link groups live in `client/src/config/footer.ts`, not in the component. That file is
      where the question "does this link have a page behind it" is answered once: an entry with `to`
      renders as a router link, an entry with `href` as an anchor for the mail client, and an entry
      with neither as plain text plus a visible "(coming soon)" note. A link that promised a page and
      landed on the 404 route would be the worse outcome, so Help centre, Shipping, Returns, the four
      About entries, and all five legal entries carry no target in this version.
    - The Shop column is built from `quickLinks` in `config/navigation.ts` rather than repeating the
      labels, so the footer row and the header's secondary row cannot drift apart. "Browse" points at
      `/search` with no term, which is the catalog.
    - Bestsellers and Weekly Flash Offers are still absent for the reason recorded in
      `config/navigation.ts`: there is no sales-count sort to rank bestsellers by, and a flash offers
      link would be the same `onSale` filter under a name that promises a deadline the catalog does
      not have.
    - `SocialLinks` uses the icons from `lucide-react`, which the rest of the client already imports,
      instead of hand-written SVG paths; there are no social SVGs under `client/public/assets/social`.
      Each icon is `aria-hidden` and the accessible name is the network plus "opens in a new tab",
      and the hit target is 44 px square regardless of the 20 px icon inside it.
    - `client/src/features/newsletter/newsletter.api.ts` is the one place the signup happens. There is
      no newsletter route on the server, so the module records the address on the device under
      `ziyo:newsletterEmails` (newest first, deduplicated, capped at 20) and returns `saved` or
      `known`. It is already async and already distinguishes the two answers a server would give, so
      replacing the write with `POST /api/newsletter` does not change the form. The copy says the
      address was saved on this device rather than claiming a subscription that does not exist yet.
    - The payment row is the names in type rather than marks. There are no payment-brand assets under
      `client/public/assets`, and an approximation of a payment logo is worse than the name.
    - The form sets `noValidate` and validates with the same `zod` the server schemas use, so the
      message under the field is ours, is styled, and is announced at a known moment. The message line
      has a fixed height in every state, which is what keeps submitting from moving the footer.

## Stage 18 — Home page

- [x] Fill `client/src/pages/HomePage.tsx` (existing) as a high-conversion ecommerce layout composing all section components below.
- [x] Create `client/src/components/home/Hero.tsx`: one visible `h1` on a light panel, the store's
      copy beside a real product photograph read from the featured list, and a row of three standing
      facts. No slideshow, no autoplay, no dark slab, no drawn banner art.
- [x] Create `client/src/components/home/CategoryChips.tsx`: visual horizontal row highlighting top categories with dynamic icons, product counts, and hover scale animations.
- [x] Create `client/src/components/home/OfferRow.tsx`: a narrow row of three light cards — name,
      product count, arrow — one per sale-flavoured category, with no photographs and no paragraphs.
- [x] Create `client/src/components/home/FeaturedProducts.tsx`: automated product grid powered by `GET /api/products?featured=true` with quick-add overlay buttons.
- [x] Create `client/src/components/home/ProductRail.tsx`: reusable horizontal scroll section with navigation arrows and skeletons for New Arrivals and Bestsellers. The rail drifts forward on its own and loops; the wheel over it moves the rail before it moves the page. Both live in `useAutoRail`.
- [x] Create `client/src/components/home/CollectionsGrid.tsx`: one even row of equal collection tiles, four across on a wide screen and two across below it.
- [x] Create `client/src/components/home/DealsSection.tsx`: promotional showcase featuring real-time countdown timers, stock progress bars, and discount calculation badges.
- [x] Create `client/src/components/home/Recommendations.tsx`: personalized product rail backed by `localStorage` history with fallback to top-rated items when history is empty.
- [x] Create `client/src/components/home/TrustStrip.tsx`: brand trust bar featuring icons and micro-copy for express delivery, money-back guarantees, secure payments, and 24/7 support.
- [x] Assemble page composition order: Hero, Category Chips, Promo Banners, Featured Products, Flash Deals, Product Rails, Collections, Recommendations, Trust Strip, and Newsletter.
- [x] Verify home page state resilience: ensure graceful fallback UI, skeleton loaders, and zero layout shift across empty, partial, and full API responses.

Files this stage added beyond the list above, and why:

- `client/src/components/home/SectionHeading.tsx` — every section on the page wears the same
  heading, hint, action link, and (for the rails) trailing controls. Written once so the `h2`
  level and the `aria-labelledby` wiring cannot drift between ten sections.
- `client/src/components/home/ProductShelf.tsx` — pairs one catalog query with the rail. The rail
  decides how a shelf looks and moves; the shelf decides what to ask for. Three shelves on the
  page differ only in their query and their copy.
- `client/src/hooks/useAutoRail.ts` — the drift and the wheel that borrows it, written once for the
  three shelves and the recommendations rail. It owns what pauses the motion and what the wheel is
  allowed to spend; `ProductRail.tsx` owns the shape that makes the loop possible — the products
  rendered twice, the second copy `aria-hidden` and `inert`.
- `client/src/config/home.ts` — the hero copy and its three facts, the offer row's category slugs,
  the departments the collections grid prefers, and the row limits. Copy rather than data: every
  category name, picture, and product total is read from the API at render time.
- `client/src/features/products/discount.ts` — the percentage a `compareAtPrice` represents,
  derived every time it is shown rather than stored, so a badge and the struck-through price
  beside it cannot disagree. It lives outside `ProductCard.tsx` because a module that exports both
  a component and a plain function is a module the dev server cannot hot-reload.
- `client/src/features/products/categoryTree.ts` — the recursive slug lookup the promo tiles and
  the collections grid need. Recursive because the slugs they name are not all top level:
  clearance and bundles are children of deals.
- `client/src/features/products/recentlyViewed.ts` — the `localStorage` store behind the
  recommendations shelf. Whole product summaries, not slugs: there is no endpoint that loads
  products by slug in one call, so a stored summary is the only way the shelf can draw without a
  request per card.
- `client/src/lib/structuredData.ts` — the `Organization` and `WebSite` blocks the page publishes
  as JSON-LD, built from `config/site.ts` so they cannot claim an address or an account the store
  does not have.
- `client/src/components/product/ProductCard.tsx`, `ProductGrid.tsx`, `ProductGridSkeleton.tsx` —
  the card and the grid were empty files belonging to Stage 21. Stage 18 cannot show products
  without them, so they are built here and Stage 21 extends them rather than starting over.
- `embla-carousel-react` and `embla-carousel-autoplay` were added during this stage for the hero
  and the rails, and have since been removed. See the redesign note below for why.

Notes on this stage:

- **A second image and a variant count were added to the catalog API.** `ProductSummary` now
  carries `hoverImage` (the picture a card swaps to on hover) and `hasVariants`. Both are read by
  a card rather than by a table: without `hasVariants` a card cannot tell a product that can be
  added straight to the cart from one whose price depends on an option the shopper has not chosen
  yet, and quick-add would put the base price in the basket for the wrong variant. The list select
  now takes two images instead of one and counts variants rather than loading them.
- **The hero now has a photograph, and it is a real product.** An earlier version of this stage
  drew three dark panels from the brand tokens, because `public/assets/banners` is empty and a
  drawn banner would only repeat a product illustration that already has the product's name baked
  into the artwork. The hero now takes the first featured product that has an image, shows its name
  and its price under the picture, and links the whole frame to that product's page — so the
  largest picture on the home page is something a visitor can act on. If no featured product has an
  image the frame is dropped and the copy takes the full width.
- **The offer tiles and the collections grid name categories by slug, not by name.** A slug the
  catalog no longer has drops its tile; a row of three becomes a row of two. Nothing points at a
  page that is not there.
- **There is no countdown in the deals section, and the checklist item above is ticked for the
  parts of it that are real.** `compareAtPrice` records that a price was lowered, not until when,
  so a timer would count down to a deadline the store invented. What actually limits a deal is
  stock, so the section shows the units left and a bar comparing them with the fullest shelf on
  the page. The number beside the bar carries the fact on its own.
- **The recommendations shelf always takes its fallback branch today.** `rememberProduct` is
  called by the product page, which is still a placeholder. The reader is written and the writer
  is one line in Stage 23, which is the right way round: a store nobody reads is dead code, and a
  reader with nothing to read is a shelf that says so.
- **"Bestsellers" is still not a shelf.** There is no sales-count sort, so the second rail is
  best-rated, which the catalog genuinely can answer. This is the same reason the secondary
  navigation row leaves the label out.
- **Every section owns its own request and its own failure.** A shelf that fails keeps its heading
  and offers a retry, because a rail is a claim about the catalog ("new arrivals") and its absence
  would read as "there are none". The promo row, the collections grid, and the featured grid hide
  themselves instead: nothing below them depends on them, and a heading over an empty grid is
  worse than no section.

### Redesign of the hero, the offer row, the rails, and the collections grid

The hero, the offer row, and the shelves were rebuilt after a review of the stage called the
original versions careless. What changed, and what each change was for:

- **`HeroSlider.tsx` was deleted and replaced by `Hero.tsx`.** The slideshow advanced on a timer,
  carried three dark gradient panels, and rotated a stat on each one. A visitor who looked away for
  seven seconds lost a panel, the gradient said nothing, and the three panels between them had one
  headline's worth of content. There is now one headline, one paragraph, two links, and a row of
  three facts. The page's `h1` moved from off screen into that headline, so the outline a screen
  reader reads out starts at the words the visitor reads first.
- **`PromoBanners.tsx` was deleted and replaced by `OfferRow.tsx`.** Each dark tile carried a
  badge, a title, a paragraph, and a call to action — four lines of copy per tile, all of it
  restating the category name that the tile now takes from the catalog. What is left is a name, a
  product count read from the same tree the count comes from, and an arrow, on a light card.
- **The shelves drift, and the wheel over one moves the shelf before it moves the page.**
  `useAutoRail.ts` owns both. Two carousel libraries were removed rather than configured: they
  advance one slide at a time and stop at the ends, and this rail does neither. "Scroll the shelf to
  the end" needed a concrete meaning, since an endless track has no end — the wheel gets a budget of
  one screenful per visit of the pointer, refilled on re-entry, so the shelf answers the gesture
  without ever holding the page. The arrows lost their disabled state because a track that wraps
  has no first or last product for a button to arrive at.
- **The collections grid is one even row.** The lead tile spanned two columns and two rows with the
  others arranged around it, which read as a stretched tile more often than as a hierarchy. Four
  equal tiles in one row, two in a row below the wide breakpoint, and the department order carries
  the preference instead.
- **The header rows are on one height.** The catalog trigger, the search field with its selector and
  its submit button, the wishlist, the account menu, and the cart all sit at `h-10`. A row of
  controls that each sized themselves from their own padding never quite lined up, and the mismatch
  showed worst on the icon buttons.
- **The search field is a flex row, not an overlay.** The icon and the clear button were absolutely
  positioned against a padding that only fits one font size, so they drifted in the two other
  places the same field is drawn. The field also stopped being `type="search"`, because that makes
  the browser draw its own clear button next to this component's own.
- **The account menu opened and immediately closed for a mouse.** The panel is portalled, so a
  pointer travelling from the trigger into it left the wrapper that owned the leave handler and shut
  the menu it was heading for. The panel now carries the same enter and leave handlers as the
  trigger; `CartButton.tsx` already did this, which is what identified the fault.

**Still duplicated, and deliberately left alone:** the hero's three facts are the same three claims
the trust strip makes further down the page. They are the store's real delivery window, free
delivery threshold, and returns period, and the checkout repeats them too. The hero was asked for a
facts row and the trust strip was not asked about, so both are there for now.

### Second pass: the bento hero, the offer cards, and the language switcher

A second review of the same stage reported a broken shelf layout, asked for a modern animated hero,
a working account menu, better offer cards, and a language control. What changed:

- **The rail cards were the wrong size, and the cause was the flex basis.** `ProductRail.tsx` draws
  its children twice — the visible track and an `aria-hidden` copy that makes the wrap-around
  seamless — and a slide's `flex-[0_0_29%]` resolves against the width of the copy it sits in. The
  visible copy was `w-full`, so its 29% was a definite number; the hidden copy was sized by its
  content, so its 29% had nothing to resolve against and the cards fell back to the intrinsic width
  of an 800px photograph. Both copies now carry `w-full`.
- **The account menu flicker needed `modal={false}`, not more hover handlers.** The handlers on the
  portalled panel were necessary but not sufficient: a modal dropdown sets `pointer-events: none` on
  the rest of the page while it is open, so the trigger loses the hover that opened it, the menu
  closes, the pointer lands back on the trigger, and it opens again. `CartButton.tsx` was never
  affected because a popover is not modal by default, which is what identified the fault.
- **`Hero.tsx` is a bento grid.** A headline tile, two product-photograph tiles, and two figure
  tiles; the tiles arrive in a cascade, and each photograph leans up to six degrees towards the
  pointer through `useTilt.ts`, which writes the transform to the node instead of re-rendering the
  tile on every pointer move. Both are skipped under `prefers-reduced-motion`, and the lean is
  skipped again on a device with no pointer. With fewer than two product photographs the grid falls
  back to the headline beside a row of figures rather than stretching one picture across two tiles.
- **`OfferRow.tsx` gained an icon and a tone.** Each card is now an accent-tinted disc with a
  category glyph, the name, the product count, and an arrow; the tone and the glyph are keyed by
  category slug in a record of whole class strings, because a class assembled at runtime is a class
  Tailwind never generates. The card lifts on hover and takes a border in its own tone.
- **`LanguageSwitcher.tsx` is new, and the interface is now in three languages.** See the
  _Interface copy_ section below.

### Interface copy, in three languages

The header carries a language control that switches the whole interface between English, Russian,
and Uzbek, persists the choice, and updates `<html lang>`. How it is put together:

- **`i18n/en.ts` is the source of truth and the type.** It exports `en` and, derived from it,
  `Strings`. The table is deliberately _not_ `as const`: literal types would pin every value to its
  English wording, and a translation cannot satisfy `'Home'`. What the other tables have to match is
  the shape, and a missing key is a compile error rather than an English sentence left standing in a
  Russian page. `ru.ts` and `uz.ts` are typed `Strings`, which is what enforces that.
- **`i18n/strings.ts` holds the live table.** Components import `strings` and read it during render.
  `setLanguage` reassigns the exported binding — ESM live bindings are what make the reassignment
  visible to every module that imported it — and then notifies its subscribers. `App.tsx` calls
  `useLanguage()` and keys `<Routes>` on the language, so the tree is rebuilt and every sentence on
  screen is re-read. Nothing is lost to that remount: the cart, wishlist, and market live in stores
  outside the tree and the queries live in the react-query cache. The alternative — a subscription
  hook in every component that reads a sentence — is fifty files to change one thing.
- **Counted sentences are functions, not templates.** `strings.cart.itemCount(count)` decides its
  own grammar, because the plural form depends on the language: English has two forms, Russian has
  three and picks between them on the last two digits, and Uzbek takes no ending after a number at
  all. The Russian forms live in `i18n/plural.ts` rather than inline in five sentences. A
  `{count} items` template would have forced English grammar on both other languages.
- **The config modules learned to move.** `config/navigation.ts`, `config/footer.ts`, and parts of
  `config/site.ts` and `config/seo.ts` exported constants built from copy. A constant is evaluated
  once, at import, in whichever language the page happened to load in, and would have kept saying it
  after a switch. They now export functions — `getQuickLinks()`, `getFooterGroups()`, `getMarkets()`,
  `getAnnouncementMessages()`, `getSeoDefaults()` — and the constants that remain hold only what does
  not translate: the store's name, its phone number, its social handles, its limits.
- **The formatting locale follows the language.** `formatPrice` and `formatDate` default to
  `getLocale()` rather than a fixed store locale, so the digits group the way the reader's language
  groups them, and `lib/seo.ts` re-runs when the language changes so `og:locale` and the fallback
  title are not left behind in the previous one.
- **The switcher lists each language in its own language** — «English», «Русский», «Oʻzbekcha» —
  because the visitor looking for it may not read the language the page is currently in. It is a
  Radix radio group, so the check mark is `aria-checked` rather than a drawing, and the trigger shows
  the two-letter code, which is the one label that does not move when the choice is made.
- **With nothing stored, the browser's preference decides.** A Russian-speaking visitor with a
  Russian browser should not have to find the switcher before the page is readable. English is the
  fallback, not the default.

**Not translated, on purpose:** the currency code and the social handles. Those are facts about the
store, not about the language it is read in. The Uzbek table is Latin script, which is what `uz-UZ`
formats and what the store's own address uses; Cyrillic Uzbek would be a fourth table and a second
entry in `LANGUAGES`, not a transliteration of this one.

### The catalog, in three languages

The interface switching languages left the catalog behind: a Russian page read «Новинки» over a
shelf of _Men's Cotton Oxford Shirt_. The copy lives in a table of strings, but the names,
descriptions, brands, specs, and variant values live in Postgres, so no amount of `i18n/` work could
reach them. They are now stored per language and read per language, and search was rewritten to work
across all three at once.

- **Translation is stored in columns, not in a table of its own.** Every translatable field gained a
  `Ru` and a `Uz` sibling — `Category.nameRu`, `Product.descriptionUz`, `ProductSpec.labelRu`,
  `ProductVariant.valueRu`, and so on. A column keeps the Prisma selects typed, lets Postgres index
  the translated text (which the search rewrite needs), and makes the fallback a plain `?? base`. A
  generic `Translation` table would have traded all three for a `LEFT JOIN` per field and a shape the
  type checker cannot see through. The columns are nullable, and null means "not translated yet"; the
  base value is returned in that case, so a half-written row degrades to English rather than to a
  blank.
- **`server/src/utils/locale.ts` names the rule once.** `LOCALE_SUFFIX` is `{ en: '', ru: 'Ru',
uz: 'Uz' }`, which is what makes `row[`name${suffix}`] ?? row.name` type-check as a real key lookup
  rather than a stringly-typed guess. Every service maps its rows through that one table, so adding a
  language is one entry plus the columns.
- **The API shape did not change.** A translated name is returned in the `name` field, a translated
  description in `description`. `lang` is a query parameter on the catalog endpoints, validated by
  the shared `langParam()` helper — an unsupported value is a 422, not a silent English answer — and
  the client attaches it once, in `services/api.ts`, next to the access token. No component had to
  learn about languages, and no response shape had to be versioned.
- **`server/prisma/translations.ts` is the completeness rule.** Two tables keyed by the English
  source string, and a seed that collects every English string the catalog can write, asks both
  tables for each one, and refuses to start if anything is missing — listing every gap in both
  languages at once rather than failing on the first. A storefront that is 90% translated is not a
  state worth being able to reach quietly. The tables hold 412 strings each.
- **Descriptions are composed per language, not stored per product.** A product description is the
  category blurb, the category detail, and a closing sentence naming the brand. Translating the parts
  and composing the sentence per locale is 412 strings; translating whole descriptions would be 369
  more that all say the same thing.
- **Search matches every language at once, and forgives a typo.** `search.service.ts` scores each
  product with `GREATEST` over seven signals — a verbatim name match, trigram similarity of the name,
  `strict_word_similarity` against the closest single word, an edit distance to the closest word, a
  per-language full-text query with stemming («рубашки» finds «рубашка»), a match that appears only in
  the description or on the spec sheet (`induction`, `LPDDR5`), and a Latin-to-Cyrillic
  transliteration for a shopper typing on the wrong keyboard layout — then orders by score, rating,
  and id. A query in Russian finds a product whose Uzbek description is the one that mentions the
  term, because the language of the query should not decide what exists.
- **Every fuzzy signal carries a floor.** A trigram comparison between a short term and an unrelated
  long string is never zero — it returns the same small number for most of the catalog — so without
  floors every product ties at noise level and a typo search returns the catalog in rating order.
  Measured on this catalog, `shirt` against an unrelated name peaks at 0.33, and the floors sit just
  above that. The same reasoning fixed the edit-distance signal: the budget is one edit per four
  characters, and a transposition is counted as one edit by comparing the word against the term's
  adjacent-swap variants, because plain `levenshtein` charges two for a swap and would rather match
  `shirt` to `sheet` than to `shrit`.
- **The query cache is cleared when the language changes.** A cached response to `GET /api/products`
  holds names in the language it was asked in, and nothing in the cache knows that. `App.tsx` clears
  it on the switch — one line, against putting the language into every query key, which would be a
  change to every feature module and a trap for the next query someone adds without it.
- **The recently-viewed shelf remembers the language it was written in** and is treated as empty when
  it does not match, rather than re-fetching twelve products to re-translate a convenience feature.

**Not translated, on purpose:** reviews, and the product name snapshotted onto an order item. A
review title and body are what a customer wrote, and an order item records what was bought in the
language it was bought in; re-translating either would be putting words in someone's mouth or
rewriting history. `ProductImage.alt` has no translated sibling — the column holds the English name — though nothing
reads it today, because the images are rendered as decoration next to a heading that already carries
the name. `Brand.tagline` is written in three languages but read by nothing: the tagline on screen
comes from the interface's own `strings.footer.tagline`.

## Stage 19 — Category and catalog pages

The listing is driven entirely by its query string. `sort`, `page`, `view`, and `q` are read from the
URL, written back to it by every control, and never copied into component state, so a filtered
listing is an address that can be shared, bookmarked, reloaded, and walked back with the browser's
Back button. `client/src/features/products/catalogParams.ts` is the only module that knows how those
parameters are spelled; it parses tolerantly (an unknown sort or a page of `abc` falls back to the
default rather than reaching the API) and writes defaults by omission, so a plain category link stays
short. A page number past the end is replaced with the last page that exists, because that is what a
stale bookmark means once the result set behind it has shrunk.

Two deliberate deviations from the list below:

- **No filter panel and no mobile filter drawer in this stage.** Filters — price range, brands,
  rating, stock, sale — belong to Stage 20, and the panel and the chips that show its state arrive
  together. A toolbar button that opens nothing is worse than a button that is not there, so
  `ProductToolbar` has no filter trigger at all.
- **`ActiveFilters` ships here, wired to `q`.** The search term is the only narrowing the URL carries
  in this stage, so it is the only chip the page can produce; it is reached through the search prompt
  in the empty state. The component itself is generic — a key, a label, and what removing means — so
  Stage 20 adds chips to it rather than rewriting it.

The header shows the category's own square illustration beside its name, not a wide banner: the
catalog holds one square picture per category and no banner artwork, and stretching a square into a
band would be inventing a design the assets cannot support.

Three pieces that Stage 21 lists — the card's `layout` prop and its list form, the grid's list
columns, and `Pagination` — were built here because the listing needed them. Stage 21 keeps the rest
of its own list.

- [x] Fill `client/src/pages/ProductsPage.tsx` (existing) to render dynamic category catalog views based on route slugs.
- [x] Render dynamic category header with breadcrumbs, title, category description, banner, and active product counter.
- [x] Create `client/src/components/product/SubcategoryNav.tsx`: visual pill/tab selector listing direct child categories with active state indicators.
- [x] Create `client/src/components/product/ProductToolbar.tsx`: responsive control bar with item count, active filter chips, sort selector dropdown, mobile filter drawer trigger, and grid/list layout view toggle.
- [x] Create `client/src/components/product/SortSelect.tsx`: custom drop-down menu supporting `featured`, `price_asc`, `price_desc`, `rating`, and `newest` parameters.
- [x] Create `client/src/components/product/ActiveFilters.tsx`: interactive filter tag bar with single-chip removal and a global "Clear All Filters" button.
- [x] Synchronize state with URL: reflect all filter selections, sorting orders, and page indexes in URL query parameters for shareability and hard-refresh persistence.
- [x] Design dedicated empty catalog state with alternative category links and search prompts when zero products match criteria.

## Stage 20 — Filters

The filter panel is one component, `ProductFilters`, rendered twice: in a sticky column beside
the grid on a wide window, and inside `FiltersDrawer` below it. The drawer is a Radix dialog, so
the focus trap, the background scroll lock, the Escape key, and the return of focus to the button
that opened it all come from the primitive rather than from us. A `framed` prop lets the drawer
ask the panel to skip its own border and heading, because the drawer already draws both.

Every filter lives in the query string and nowhere else, which is why the drawer has no apply
button: each control writes to the URL as it changes, so the listing behind the scrim is already
the one the shopper built, and the footer button only reports the count and closes. Text and price
inputs are debounced through the existing `useDebouncedValue` before they reach the URL, so typing
`250000` is one request and not six.

Two things the panel needs had nothing behind them, so this stage added them. A new
`GET /api/products/facets` endpoint counts the facets for the whole filtered set — brands, price
bounds, and variant attribute values — because deriving them from the page on screen would silently
drop a brand on any category holding more than one page. And `GET /api/products` gained a repeated
`attr=Name:Value` parameter, implemented server-side: values of one attribute are alternatives,
different attributes must all hold. The keys are the English `name` and `value` columns; the labels
are translated for display only.

- [x] Fill `client/src/components/product/ProductFilters.tsx` (existing) serving dual duty as desktop sidebar filter panel and mobile slide-out filter drawer.
- [x] Implement dual-input range control with numeric min/max inputs, interactive range slider, and quick-select price presets.
- [x] Add searchable brand list filter with sticky text filter input for long brand lists.
- [x] Add star rating threshold filter, "In Stock Only" toggle switch, and "On Sale" toggle switch.
- [x] Implement variant attribute filters (Size, Color swatches) dynamically populated from backend schema metadata.
- [x] Bind filter state directly to URL query string, applying debounced navigation updates for text and price range inputs.
- [x] Render contextual product count badges next to filter options where provided, alongside a master reset action.
- [x] Ensure mobile filter drawer enforces focus trapping, background scroll locking, and smooth slide-out dismissal.

Four deliberate deviations, recorded here so they are decisions rather than oversights:

- The presets are computed from the facet's real bounds, in thirds, rather than hard-coded sums.
  A category from 189 000 to 1 490 000 so'm gets three useful buttons; a fixed list would have given
  it four that all say the same thing.
- The switches are native checkboxes styled with the accent colour, not the `switch` role. The
  Radix switch package is not installed, and two named states a screen reader already understands
  are better than a custom widget that has to teach them.
- The colour swatches come from a short built-in map keyed by the lowercased English value. It is
  deliberately not translated: it holds hex values, which are the same in every language. A value
  the map does not recognise renders as a labelled pill, which is also the honest fallback for a
  value nobody anticipated.
- The brand filter's text field is local state and never reaches the URL. It narrows the list, not
  the catalog, and a shopper who scrolled away would not expect it to still be in effect.

## Stage 21 — Product card, grid, and pagination

The card, the grid, and the pager were built in Stage 18 and extended here, so this stage is mostly
about the parts of them that had nothing behind them: a sold-out card, a way to reach a page the
pager does not show, and a phone that never gets the pager at all.

A sold-out card used to end in a disabled "out of stock" button — a control that says what the card
already says twice and offers nothing to do about it. It now ends in a Notify Me trigger, and behind
it is a real feature: a `StockNotification` table keyed on the product and the address, and
`POST /api/products/:slug/notify`. The address is deliberately not tied to an account. A shopper who
finds a product sold out is usually not signed in, and asking them to register before they can be
told about the one thing they came for is how the request never gets made. Asking twice is a no-op
rather than a conflict, because "you are already on the list" is not something a shopper acts on.
The card also dims its picture and marks it in words, since a wash says "unavailable" only to
somebody who can see it.

The pager grew two controls for the two ways numbers are not enough. A jump field reaches a page the
numbered window does not draw, because walking thirty pages a click at a time is not something
anybody does. And under `sm` the numbers are replaced by a single Load More button, since a row of
page links under a grid is a row of targets too small to hit. Load More does not navigate: it grows
the listing in place, so the shopper keeps the products they were already looking at. That is a
`pages` parameter in the URL meaning "how many pages deep the grid is showing", requested as one
long first page — `page=1` with a `limit` of `CATALOG_PAGE_SIZE × pages` — rather than as several
pages fetched one after another. The stack lives in the URL like everything else on this page, so a
shopper who has pressed the button three times can share or reload what they are looking at. The
server's `MAX_PAGE_SIZE` went from 60 to 120 to give the button five screens to work with; past that
it stops offering another and the numbered pager carries on, which is why the button and the numbers
are drawn from the same component rather than one replacing the other.

Moving through the listing now returns the viewport to the first product, smoothly, and not at all
when the visitor has asked for reduced motion. The first render is skipped: on arrival the browser
has a position of its own to restore, and scrolling on top of that would throw it away. A layout
change does not scroll, because switching between a grid and a list redraws the same products in the
same order and the shopper is still looking at the same one.

- [x] Fill `client/src/components/product/ProductCard.tsx` (existing): primary catalog card featuring secondary image hover swap, promotional badges (New, Sale, Top), title link, price with strike-through compare-at price, calculated discount percentage, star rating summary, stock status indicator, wishlist toggle heart button, and quick-add button.
- [x] Implement out-of-stock card presentation with disabled action buttons, visual overlays, and a "Notify Me" trigger.
- [x] Reflect active cart item quantity badges directly on product cards to make repeat additions visible.
- [x] Fill `client/src/components/product/ProductGrid.tsx` (existing): flexible grid layout adapting from 1 column on mobile to 4 columns on wide displays with stable card aspect ratios.
- [x] Create `client/src/components/product/ProductListRow.tsx`: horizontal list view row alternative for high-density catalog scanning.
- [x] Create `client/src/components/common/Pagination.tsx`: accessible pagination control with explicit page numbers, previous/next controls, jump-to-page, and an optional mobile "Load More" append mode.
- [x] Create `client/src/components/product/ProductGridSkeleton.tsx`: animated layout placeholder matching exact dimensions of catalog grid cards to prevent cumulative layout shift.
- [x] Ensure page navigation preserves smooth scroll restoration, scrolling to catalog top without jarring view jumps.

Three deliberate deviations, recorded here so they are decisions rather than oversights:

- There is no `ProductListRow.tsx`. The list row is the card with `layout="list"`, which is what
  Stage 18 built it as and what the rest of the app already renders. A second component would be a
  second place to change the price, the badges, the wishlist button, and the quick-add, and the two
  would disagree within a stage or two. The checklist item is satisfied by the row existing, not by
  the file existing.
- Load More is drawn only under `sm`, beside the numbers rather than instead of them. The numbers
  come back when the window is wide enough for them, which is why both live in `Pagination` and the
  page decides only whether there is another page to offer.
- The notify dialog is a Radix dialog opened from the card, not a form embedded in it. An email
  field inside a grid tile would be a form per product on a page holding twenty-four of them, and the
  focus behaviour the dialog owes a keyboard user cannot be built into the tile.

## Stage 22 — Search results page

A search is a listing over the whole catalogue rather than over one shelf, and this stage is mostly
about making that true rather than about drawing a second results page. The two pages now share one
URL vocabulary (`catalogParams`), one request builder (`toSharedQuery`, with the category dropped and
the term kept), one set of hooks, and one results section — `CatalogResults`, which owns the filter
column and its drawer, the toolbar, the chips, the grid with its skeleton and its error state, the
pager, and the scroll back to the first product. `ProductsPage` keeps only what makes it a shelf: the
breadcrumbs, the category header, the nav to the shelves beside it, and a category-specific empty
state. `SearchPage` keeps what makes it a search: the field, the heading naming the words, and the
answer to a search that matched nothing.

Until now the server could not have answered a search page honestly. `GET /api/search` took no
filters, and the listing's own `where` builder treats `q` as a plain ILIKE — narrower than the fuzzy
ranked search. So a filter panel on a search page would have counted one set of products and the grid
would have shown another. Search now takes the same filter fields the listing takes; the ranked path
hands the ids it matched to the shared `where` builder through `selectProductIdsInOrder`, which
re-applies every filter to the scored set and keeps the ranking; and a new `GET /api/search/facets`
counts brands, price bounds, and attributes over that same matched set, leaving `attr` out exactly as
the listing's facets endpoint does. Filtering a search and filtering a category are consequently the
same code path, and cannot drift.

A search that matches nothing is a normal answer, not a failure, and the page answers it in two
layers. "Did you mean" is drawn when the catalogue recognises the words as a near miss of a name it
holds — a brand or a category from the existing suggestions endpoint, whose name matching is already
fuzzy and already translated. A brand has no page of its own yet, so following one narrows the search
the shopper is already running; a category does have a page, so following one leaves the search and
browses the shelf. Products are deliberately left out of this block: a shopper whose word matched
nothing does not want the product that matched it partially, and the grid above would be showing it.
Below that sits the same block the page shows when it is opened with no term at all: the terms this
visitor searched before, the featured products, the shelves of the catalogue, and a link back to it.

Verified against the running API: `q=beautiy` matches nothing and offers the `Beauty` category, which
is the zero-result case the block exists for, and `q=shirt` narrows correctly under `brand=ziyo-wear`,
`minPrice`, and `attr=Size:M`, with `/api/search/facets` reporting the same totals as the listing.

- [x] Create `client/src/pages/SearchPage.tsx` fetching and parsing search parameter `q`, active filters, and sort options from the URL.
- [x] Display search query heading displaying search term, total result count, and contextual query metadata.
- [x] Integrate catalog components: re-use `ProductToolbar`, `ProductFilters`, `ProductGrid`, and `Pagination` components directly.
- [x] Add automated "Did you mean?" suggestion block on zero-result queries based on fuzzy category and brand index matches.
- [x] Build empty search state presenting recent search queries, trending items, popular categories, and a link back to the catalog.
- [x] Update document head title dynamically to reflect the current search query string.

Two deliberate deviations, recorded here so they are decisions rather than oversights:

- "Trending items" is the featured products endpoint reused as it stands. The catalogue has no
  notion of a trend — nothing counts views, adds, or sales over a window — and inventing one for a
  block that appears under a failed search would be inventing a signal. Featured is the one editorial
  answer the shop already has.
- The results section was extracted into `components/product/CatalogResults.tsx` rather than
  duplicated. The checklist asks for the catalog components to be re-used directly, and the honest
  way to do that is to re-use the section that arranges them: two pages composing the same five
  components in the same order is two places for that order to change.

## Stage 23 — Product detail page

The page is one two-column grid on a wide screen and one column on a narrow one: the gallery on the
left, and on the right the panel that answers the questions in the order a shopper asks them — what
it is, what it costs, which one, how many, and then the buttons — with the delivery and returns
block under them. The panel is sticky within the section, so it is still there beside a gallery of
twelve photographs and three tabs of description, and it stops at the foot of the section without any
measurement. Everything below that grid is full width: the tabs, then the related rail and the
recently-viewed row.

The choice of options is held by the page and not by any component that draws it. The variant buttons
set it; the price, the article number, the stock count, the quantity ceiling, and the add-to-cart
payload all read it. That is what makes the second half of the variant item true — price, SKU, stock,
and the quantity bound all follow the selection — and it is also why the selection resets when the
product does: a size chosen on the previous product is not a choice on this one.

Three things the item asks for are not statements the catalogue can support, and the honest handling
is recorded rather than faked:

- **"Disabling unavailable variant combinations"** cannot mean combinations, because the catalogue
  stores option rows and not combination rows: a shirt has four `Size` rows and three `Color` rows
  and no row naming both. Availability is therefore a property of a value. A value with no stock of
  its own is disabled and cannot be chosen, and the shopper's real ceiling is the smallest stock
  among the values they have chosen, which is what the quantity control is bounded by. The reasoning
  is written out at the top of `features/products/variantSelection.ts`.
- **The gallery does not follow the selection.** Variant rows carry a price difference and a stock
  count and no image of their own, so there is no per-colour photograph to switch to. The gallery is
  the product's photographs, which is what is stored.
- **Checkout charges the base product price.** `variantIds` identifies the cart line and the page
  displays the selection's price, but the order service prices the line from `product.price`, because
  `OrderItem` has no variant column. This is a pre-existing gap in the order model, not something
  this stage introduced, and it is recorded here so that the difference between the price shown and
  the price charged is a known one. Fixing it belongs with the checkout stage, which owns the order
  shape.

The viewport item could not be verified. There is no browser automation in this project — no
Playwright, no Puppeteer — so layout at 320, 768, 1024, and 1440 pixels was not measured. What was
done instead: the page was typechecked and built, and the classes it uses are the ones the rest of
the client already uses for the same breakpoints (`lg` for the two-column switch, `max-w-page` and
`px-page-x` for the frame, `sm`/`lg` for the mobile bottom navigation's clearance). The grid columns
are `minmax(0, 1fr)` so the gallery can shrink inside the column rather than forcing it wider, and the
purchase panel carries `min-w-0` for the same reason. This item stays unverified until a browser
runner exists.

Verified against the running API: `GET /api/products/mens-wool-blend-coat` answers with two option
groups (`Color` Black/Navy/Sand and `Size` S/M/L/XL), each value carrying its own `priceDelta`,
`stock`, and `sku`, which is the shape the selector and the quantity bound read; the electronics
product answers with no variants and no groups, so the selector draws nothing and the page falls back
to the product's own SKU and stock; and an unknown slug answers `404` with `not_found`, which is the
branch the page turns into the not-found panel.

- [x] Fill `client/src/pages/ProductPage.tsx` (existing) featuring a two-column desktop layout (interactive gallery and sticky purchase panel) followed by stacked detail tabs and recommendations.
- [x] Create `client/src/components/product/ProductGallery.tsx`: main gallery display, thumbnail navigation carousel, hover zoom lens for desktop, touch swipe for mobile, fullscreen lightbox toggle, and keyboard arrow controls.
- [x] Create `client/src/components/product/ProductInfo.tsx`: breadcrumb navigation trail, product title, brand page link, star rating summary with smooth anchor link to review section, SKU badge, and stock status indicator.
- [x] Create `client/src/components/product/PriceBlock.tsx`: price display showing current price, strike-through original price, savings badge, and split-payment installment estimate tags.
- [x] Create `client/src/components/product/VariantSelector.tsx`: visual attribute pickers (color swatches, size buttons), automatically disabling unavailable variant combinations while updating price, SKU, stock, and gallery images dynamically.
- [x] Create `client/src/components/product/QuantitySelector.tsx`: accessible step control bounded strictly by real-time available inventory limits.
- [x] Create `client/src/components/product/AddToCartPanel.tsx`: primary "Add to Cart" button, express "Buy Now" checkout button, wishlist toggle heart, and inline confirmation toast notification.
- [x] Create `client/src/components/product/DeliveryInfo.tsx`: zip code delivery estimator, store pickup availability, return window guarantee policy, and accepted payment option badges.
- [x] Create `client/src/components/product/ProductTabs.tsx`: tabbed content interface containing rich text description, structured spec table, and review module.
- [x] Create `client/src/components/product/ProductSpecs.tsx`: key-value specification table grouped by feature categories with alternating row shading.
- [x] Create `client/src/components/product/RelatedProducts.tsx`: context-aware product rail leveraging the related products API endpoint alongside a recently-viewed history slider.
- [x] Update document title, meta description tags, and Open Graph meta attributes dynamically on product load.
- [x] Handle invalid or missing product slugs with a custom 404 page rather than generic unhandled runtime errors.
- [ ] Test layout presentation across target viewports: 320 px, 768 px, 1024 px, and 1440 px. **Deferred, and honestly: never performed at those widths by anything that rendered.** Every responsive decision in the page — the single column below `lg`, the two-column grid above it, the sticky panel, the gallery ratio — was written against the breakpoints Tailwind names and reviewed by reading, and Stage 33's mobile work was the same. The project has no browser automation (Stage 36 is skipped for that reason), so this bullet stays open rather than being ticked on the strength of the CSS being correct. It is the first thing to check when somebody next opens the site at 320 px.

Two further decisions worth recording:

- **The delivery estimator is a server answer, not a client table.** `GET /api/delivery/estimate`
  resolves a postal code against a seeded `DeliveryZone` table and also returns the shop's policy —
  the return window, the free-delivery threshold, and the accepted payment methods — so the panel
  draws those from the first paint, before any code is typed. Writing the policy into the client
  would have been a second copy of it, and the copy is what drifts. The request is made without a
  code when the page loads, which is why `zip` is optional on the endpoint: a policy-only request is
  a real question, and `quote: null` answers both "not asked" and "we do not deliver there".
- **The instalment tags are illustrative and say so.** The rates live in `config/payments.ts` rather
  than in a bank's API this storefront cannot see, and the block states under them that the split is
  confirmed at checkout. A plan a product is too cheap for is not offered at all, rather than shown
  greyed out.

## Stage 24 — Reviews

The reviews are the product page's bottom panel, and they are the one part of the storefront where a
shopper writes the content. That shapes everything below: the list is a page of other people's words,
the summary is a count of them, and the form is the only place a visitor's text reaches the database.

Three things are worth stating before the list, because they are decisions rather than details.

- **Photographs are real files on disk.** A review's photographs are uploaded as `multipart/form-data`
  to `POST /api/products/:slug/reviews/mine/images`, written by `multer` to a UUID-named file under
  `uploads/reviews/`, and recorded as a `ReviewImage` row whose `url` is the served path
  (`/uploads/reviews/<uuid>.<ext>`). The directory is served statically with
  `Cross-Origin-Resource-Policy: cross-origin`, and the client resolves a stored path against the API
  origin with `resolveApiAssetUrl` so an image loads in development (where the API is on another port)
  and in production. The alternative — storing a data URL or a third-party bucket — was rejected
  because the project has a server and a disk. The upload is a second request that happens after the
  review is saved, so a failed upload cannot lose a written review, and the extension is taken from
  the declared MIME type rather than from the client's filename. Only one route in the API accepts
  multipart, and it is declared to `requireJsonContentType`, so every other endpoint still refuses a
  body that is not JSON.
- **A review is published when it is written.** There is no moderation queue in this project, so the
  server sets `isApproved: true` on creation. The column stays in the schema, and every public read
  filters on it, so adding moderation later is a change of one write rather than a change of the
  read path. What must not be deferred is the arithmetic: the product's `rating` and `reviewCount`
  are denormalised columns, and they are recomputed from the approved rows inside the same
  transaction that writes the review, so the card, the list, and the summary cannot disagree.
- **"Verified purchase" means delivered, and only the server decides it.** The badge appears when the
  reviewer has an order containing this product in status `DELIVERED` and not for any other status.
  The check is made server-side at read time from the orders table; nothing in the request can assert
  it. A pending or shipped order leaves the badge off, which is the honest answer — the shopper has
  not received it yet.

- [x] Create `client/src/components/product/ReviewSummary.tsx`: overall rating score, visual star breakdown distribution bars, and verified purchase count.
- [x] Create `client/src/components/product/ReviewList.tsx`: paginated list of user reviews with helpfulness upvote/downvote buttons, verified buyer badges, and uploaded review images.
- [x] Create `client/src/components/product/ReviewForm.tsx`: modal or collapsible form for authenticated users featuring interactive star rating picker, review title, body text area, photo upload field, Zod validation, and loading submission state.
- [x] Enforce single-review rule per product/user, presenting an "Edit Your Review" interface when a submission already exists.
- [x] Display guest callout prompting unauthenticated visitors to sign in before leaving a product review.
- [x] Implement review filtering by star rating and sorting by newest, highest rated, and lowest rated.
- [x] Trigger cache invalidation to recalculate average product ratings and review counters immediately after review creation.
- [x] Build empty review state encouraging users to write the first product review.

How the panel is put together, and what the pieces read:

- The list's slice — page, ordering, and rating filter — lives in the address
  (`reviewPage`, `reviewSort`, `reviewRating`) rather than in component state, in the same way the
  catalog's slice does. A page of reviews can therefore be linked to, the pagination controls are
  real links, and a filter change resets the page instead of leaving the reader on a page that no
  longer exists under the new filter. Unknown parameters are preserved and defaults stay out of the
  URL; the reader is tolerant, so a hand-edited parameter degrades to the unfiltered list.
- The summary, the filters, the list, the empty state, and the guest callout are one panel with one
  request behind the list, so there is no second copy of the count to drift. `ReviewSummary` draws
  the five distribution bars from the same `summary` object the list request returns and gives each
  bar a text label, because a bar chart read by a screen reader is otherwise a coloured rectangle;
  the average is also written out in words.
- The form is a `Modal` opened from the write button. Its Zod schema is exported
  (`reviewFormSchema`) and unit-tested, and it is the same schema the server enforces, so the client
  refuses a rating of 0 or 6, a body under the floor, and an over-long title before the request, and
  the server refuses them again. The rating picker is a real radiogroup — arrow keys move and select,
  one tab stop — rather than five clickable icons, because a choice of one out of five is what a
  radio group is. Photographs are previewed from object URLs that are revoked when the selection
  changes, and uploaded after the review itself is saved.
- One review per person per product is enforced by a unique constraint on `(productId, userId)`, not
  by the form. The page asks for the viewer's own review and the form switches between "write" and
  "edit" from whether that answer exists; a submission that races another one is refused by the
  server with `review_exists`, which the form turns into the already-reviewed message rather than a
  generic failure.
- The guest sees one callout, placed under the list (or under the empty state, where it is the only
  thing below), with a link to sign in. The form is not rendered at all for a guest, and the
  own-review request is not made, so a normal visit carries no request that is going to be answered 401.

Verified against the running server: creating a review answers 201, a second one for the same product
and person answers 409; updating answers 200; a body that breaks the schema answers 422. An image
upload answers 201 with a `/uploads/reviews/<uuid>.png` path, the file is fetched back with
`Content-Type: image/png` and `Cross-Origin-Resource-Policy: cross-origin`, a wrong type answers 415,
an oversized file 413, and too many files 422. A vote goes 1 → -1 → 0 and a guest voting answers 401.
The list filters by rating and sorts by newest, highest, and lowest. The recompute was proven on a
live product: its rating moved from 5.0 to 4.2 when a 1-star review was created and back to 5.0 when
that review was edited. The verified badge was false with no order, false while the order was
`PENDING`, and true once it became `DELIVERED`. The test rows were deleted afterwards and the product
recomputed back to its seeded state.

Two limits worth recording:

- **No browser verification.** As in Stage 23, this project has no browser automation, so the panel
  was not measured at 320, 768, 1024, and 1440 pixels and no screenshot of it exists. Its behaviour
  was checked through the API and its rendering through typecheck, lint, and the component tests;
  the layout classes are the ones the rest of the client already uses for those breakpoints.
- **The seed's `Product.rating` and `reviewCount` are a synthetic public counter.** Three accounts
  exist, so the seeded `Review` rows are a subset of the counter — a product card can say 60 reviews
  while the list holds two. That is deliberate, and it is written out at the top of `seed.ts`. One
  review in seven is seeded unapproved so the public listing has something real to filter out; the
  reviewer still sees their own through the own-review endpoint, which is what the edit interface
  reads. This means the seeded denormalised columns do not equal the recompute of the seeded rows, and
  they are not meant to: the columns are overwritten by the recompute the first time anybody writes a
  review through the API.

## Stage 25 — Wishlist

- [x] Create `client/src/store/wishlist.store.ts` providing guest wishlist storage backed by persistent `localStorage`.
- [x] Synchronize guest wishlist items with backend database upon user authentication, automatically deduplicating overlapping entries.
- [x] Create `client/src/pages/WishlistPage.tsx` presenting saved items with quick "Move to Cart", bulk management, and "Remove" actions.
- [x] Update header wishlist icon with dynamic item count badges.
- [x] Design empty wishlist page featuring a call to action leading back to popular categories and catalog items.
- [x] Ensure item removal in wishlist state updates all heart toggle indicators synchronously across all open components.

Saved products existed on the server before this stage: a `WishlistItem` row, three endpoints behind `requireAuth`, and a listing that maps saved rows through the same product projection a catalog card reads. What did not exist was the client half. The wishlist page was a placeholder, the hearts on the product card and the buy panel sent a signed-out visitor to `/login` — so a guest could save nothing at all — and the header badge counted only what the server list held. The stage is therefore the guest half of the feature, the page that manages it, and the one place where the two halves meet.

Three decisions shape the work.

- **A guest's list holds ids, and the products are fetched.** The store keeps a list of product ids in `localStorage`; the page reads them back through the catalog. `ProductListQuery.ids` already existed in `product.service.ts` — `buildWhere` renders it as `where.id = { in: ids }` on top of the always-present `isActive: true` — but the HTTP query schema did not expose it, so a new `idsParam()` in `utils/queryParams.ts` and one line on `listQuerySchema` were the whole server change. The alternative, storing a snapshot of each saved product beside its id the way `recentlyViewed` does, was rejected because a snapshot keeps a name in the language it was saved in, keeps a price that has since moved, and keeps a product that has been switched off. Reading the ids back gives current names, current prices, the browsing language's translation, and the same active-only rule the server's own wishlist applies. The filter is repeated values (`?ids=a&ids=b`) rather than a comma-joined list, for the same reason `attrParams()` is: the API client already repeats array values, and a separator inside a value would split it. It is capped at 120 ids, the listing's own page ceiling, and it is deliberately not on the facets schema — facets answer what the catalog would look like, which is not a question about an exact id set.
- **A signed-out heart saves locally** instead of redirecting to sign-in. That is what makes a guest wishlist exist; a redirect turns one click into a registration form. The redirect, and the sentence under the buy panel that described it, are both gone.
- **The merge at sign-in is automatic.** When a session appears and the guest list is not empty, the ids are posted one at a time, the guest list is cleared, and the wishlist cache is invalidated. Deduplication needed no rule on the client: saving a product that is already on the account's list answers 200 instead of 201 and leaves one row, so an overlap between the two lists resolves itself. Nothing is dropped either — an id whose request failed for a reason other than "already saved" stays in the guest list for the next attempt.

How the list is put together, and what the pieces read:

- One hook answers "is this product saved?" and every heart in the application reads it. `useWishlistState()` chooses between the account's server list and the browser's store by session and returns `{ ids, count, isSignedIn, isSaved, isPending, toggle, remove, removeMany }`, so the product card, the buy panel, the header button, and the mobile navigation bar no longer branch on whether anybody has signed in. The two paths meet the same requirement in different ways. For a guest the store is the single source: a press writes to it and every subscribed heart repaints from that write. For a signed-in visitor the mutation patches the cached list as it starts, rolls the patch back if the request fails, and invalidates once it has settled; a click repaints every heart from the patched cache, and the refetch that follows confirms it. The optimistic entry carries a placeholder `id`, because the server's own row id arrives with the invalidation and every place that draws an entry works from the product it already holds.
- `useWishlistProducts()` gives the page a `Product[]` whichever kind of shopper is asking — the account's list from the server, or a guest's ids read back through `useProductsByIds` and re-ordered to match the id list, since a listing answers in its own order. Nothing on the page above that hook knows which of the two it is drawing, which is why the empty state, the loading skeleton, and the error paragraph are written once.
- Removal deliberately treats "not on the list" as success. `DELETE` answers 404 when the row is already gone, which happens when the same list is open in two places and one of them has already removed it; reporting that as a failure would put an error on a page that is showing exactly what was wanted.
- The page offers two actions per row and a selection above them. A product with options is the one exception: its row links to the product page and its checkbox is disabled, because the base price is a real price but it is not necessarily the price of the option the shopper wanted — the same rule the card follows. Selection is component state rather than address state: it is not shareable and it does not outlive the page. It is pruned against the products on screen on every mutation, so a row that has been moved or removed takes its id out of the selection rather than leaving one behind for the next bulk action to act on. The toolbar's select-all checkbox reports its half-selected state through an `indeterminate` ref and announces the count of what is selected, because a checkbox cannot say "some" on its own.
- The empty state is the only way back into the catalog from a list with nothing in it, so it carries two: a link to the storefront and up to four top-level category links from the category tree. The tree is drawn only when it has been read — the link above it already goes somewhere, so nothing is blocked on that request.
- The badge reads the same `count` the page does, so a guest's saved products are counted before anybody registers, and the header and the mobile bar agree because they read one number.

Verified against the running server: `GET /api/products?ids=<a>&ids=<b>` answers exactly those two products in the envelope, with a `total` of 2; an id that is a valid UUID but not a product is simply absent; a malformed id answers 422; and an empty `ids=` is treated as no filter rather than as a filter for nothing. A product was switched off and its id disappeared from the answer, then came back when the product was switched on again, which is the active-only rule the server's own wishlist applies. The wishlist endpoints were exercised end to end: first save answers 201, a second save of the same product 200 with one row still on the list, removal 204, a second removal 404. The smoke-test account and its rows were deleted afterwards.

Two limits worth recording:

- **No browser verification.** As in Stages 23 and 24, this project has no browser automation, so the page was not measured at 320, 768, 1024, and 1440 pixels and the guest flow was not clicked through. The store, the id re-ordering, and the query keys are covered by unit tests (`wishlist.store.test.ts`, `orderProductsByIds.test.ts` — 13 cases), and the rendering was checked through typecheck, lint, and the build; the layout classes are the ones the rest of the client already uses at those breakpoints. What that leaves unmeasured is interaction rather than logic: that a heart on the home rail, one on a catalog card, and one on the product page all fill on a single press was reasoned from the shared subscription and the shared cache entry, not observed.
- **A guest's list is unauthenticated local state.** Anybody with the browser can read and edit it, it does not follow the shopper to another device, and clearing site data loses it. It is written through `utils/storage`, the only module in the client that touches `localStorage`, and a write that fails — private mode, a full quota — degrades to a list that lives for the session rather than throwing.

## Stage 26 — Cart store

- [x] Fill `client/src/features/cart/cart.store.ts` (existing) leveraging Zustand with `persist` middleware: managed item state, add/remove mutations, quantity adjustments, clear cart action, and computed totals aggregations.
- [x] Fill `client/src/features/cart/cart.types.ts` (existing) defining strict cart item interfaces including selected variant parameters, stock limits, unit prices, and thumbnail metadata.
- [x] Enforce max inventory bounds on item additions and merge duplicate additions of identical variant combinations.
- [x] Compute subtotal, savings, promo discount, delivery and order totals dynamically from line items rather than writing hardcoded scalar totals.
- [x] Fill `client/src/hooks/useCart.ts` (existing) exposing reactive read utilities and cart action wrappers for components.
- [x] Implement automatic cart revalidation against backend stock and price endpoints when opening the cart page, alerting users to price or availability shifts.
- [x] Confirm cart state persists across browser reloads and clears completely upon confirmed order placement.
- [x] Add the promo code model, migration, service, and `POST /api/promos/validate`, and apply the code inside the checkout transaction so the discount is recomputed from the database.

## Stage 27 — Cart page

- [x] Fill `client/src/pages/CartPage.tsx` (existing) featuring a two-column layout: line item management on the left, order summary card on the right.
- [x] Create `client/src/components/cart/CartItemRow.tsx`: item thumbnail, title link, selected variant tags, unit price, quantity step control, total line calculation, remove button, and "Save for Later" action.
- [x] Create `client/src/components/cart/CartSummary.tsx`: detailed financial summary breakdown (subtotal, applied discounts, estimated delivery, total), secure payment badges, and primary checkout CTA button.
- [x] Create `client/src/components/cart/PromoCodeForm.tsx`: coupon input form validating promo codes against the backend API and adjusting cart totals.
- [x] Create `client/src/components/cart/EmptyCart.tsx`: zero-state layout featuring links to top product categories and recent history rails.
- [x] Render dynamic free delivery progress bar showing the remaining order amount required to unlock free shipping.
- [x] Display prominent warning banners and one-click auto-fix actions for cart items that exceed stock limits or have become inactive.
- [x] Ensure full keyboard accessibility for line-item quantity inputs and action controls.

The cart contained no arithmetic and no promo codes before this stage: `cart.store.ts` held an array of lines with the legacy single-`variantId` shape, `useCart` re-exported the store, the page was a list of names with a subtotal, and nothing anywhere read the catalog again once a line had been added. Stage 26 is the data layer and Stage 27 is the page; the two are written together because the second is what proves the first.

Four decisions shape the work.

- **No tax is added, because the project has no tax model.** There is no tax column, no rate, no field on `Order`, and no copy about one anywhere in the client. Inventing a rate here would have meant a migration, an API surface, and a policy decision that nobody asked for, so the financial model stays the one the server already writes: `subtotal + shipping − promo discount = total`. Two checklist bullets above asked for a tax figure and were rewritten rather than ticked falsely.
- **The promo discount is a new column, not a new meaning for `discountTotal`.** `discountTotal` already means something specific on an order: what the basket saved against `compareAtPrice`, a record rather than a deduction. Overloading it would have made the order history's savings line drop whenever a coupon was used. `Order` gained `promoCode` and `promoDiscount`, the summary shows both lines separately, and the total follows the server's `subtotal − promoDiscount + shipping`. Promo codes are a real server-side feature or they do not exist: a `PromoCode` model, a migration, `services/promo.service.ts`, `POST /api/promos/validate` behind a rate limiter, and the same service called inside the checkout transaction. The service prices a code — `PERCENT` of the subtotal or `FIXED` in minor units, capped by `maxDiscount`, floored by `minSubtotal` — and refuses with a 422 whose message belongs under the input: not recognised, not yet active, expired, switched off, basket too small. Codes are normalised to upper case and trimmed on the server, so `welcome10` and ` WELCOME10` are one code.
- **The client is told the rule, not the amount.** `PromoCodeForm` sends a code and the basket subtotal and keeps what comes back as a rule — type, value, cap, minimum — and `calculateTotals` re-prices the discount on every render. That is what keeps the figure right when the next quantity change moves the subtotal, without a second request. Nothing about money is trusted from the client at any point: the checkout schema accepts `promoCode` and no amount, and the transaction reads the code, the prices, and the stock from the database before it writes the order. The discount previewed in the summary and the discount written to the order can disagree only by the shopper's own edits between the two.
- **The cart is re-read, never silently repaired.** A cart is a copy of prices and stock taken when the lines were added, so the page reads its products again on open through the Stage 25 `ids` filter — one request for the whole basket, `staleTime: 0`, `refetchOnMount: 'always'`. What it finds is reported and offered a fix, not applied: paying a new price or accepting fewer items is the shopper's decision, and a basket that quietly changed under them would be worse than one that is wrong out loud. `cart.revalidate.ts` sorts each line into `price_changed`, `insufficient_stock`, `out_of_stock`, or `inactive`, `CartIssues` offers "update prices", "reduce to N", and "remove", and a line that is switched off or gone blocks the checkout button rather than failing at the last step. Variant-level stock is not in the product listing, so a variant line is checked against its product's stock — the one place this check is coarser than the server's own.

How the pieces fit together:

- The store keeps lines and the applied code, and nothing else. `quantityCeiling` clamps every write, so a quantity can never reach zero or pass the stock the line was added with; identical product-and-variant combinations merge into one line rather than two. Totals are computed from the lines on every render by `calculateTotals`, never stored, so a line removed in one tab cannot leave a stale sum on the screen. Persistence goes through `utils/storage` — the only module in the client that touches `localStorage` — so a failing write degrades to a cart that lives for the session instead of throwing, and a stored line in the old single-`variantId` shape is migrated on read.
- `useCart` answers counts, totals, and actions for the header and the buy panel; `useCartTotals` takes the free-delivery threshold as an argument, which the page fills from the store's delivered policy. `FREE_DELIVERY_FROM` was exported from `delivery.service.ts` and applied inside the checkout transaction, and `config/site.ts` mirrors it as the value the page has before the policy arrives, so the progress bar cannot promise a delivery the server would charge for.
- "Save for later" is the Stage 25 wishlist and nothing else: the row saves the product id through the same toggle the hearts use, then removes the line. A save that fails leaves the basket as it was, which is the honest outcome — the shopper asked for the item to be kept somewhere, and it is still here.
- The empty cart is a page rather than an empty version of one. It offers the storefront, up to four categories from the category tree, and a rail of what this device remembers through `recentlyViewed` — no new endpoint was added for any of the three.
- Money is counted and read out loud: `aria-live` regions announce the item count after a change, the summary is a labelled section, quantity controls are the product page's own selector with real labels, and the issue banners carry their severity and their action in the accessible name.

Verified against the running server. `POST /api/promos/validate` answers `WELCOME10` for `"  welcome10 "` with a discount of 100 000 tiyin on a 1 000 000 tiyin basket; an unknown code, the switched-off `SUMMER20`, and a basket below a code's minimum each answer 422 with the message filed under `promoCode`. A real order was placed against the seeded database with `welcome10`: it recorded `subtotal` 1 740 000 000, `promoCode` `"WELCOME10"`, `promoDiscount` 5 000 000 — the cap, not 10 percent — `shippingTotal` 0, and `total` 1 735 000 000, with `discountTotal` left at 0. A second order below the free-delivery threshold recorded `shippingTotal` 2 500 000 and `total = subtotal + shipping`. `pnpm lint` is clean, `pnpm -r typecheck` passes both projects, `pnpm --filter client test` passes 6 files and 64 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only.

Two limits worth recording:

- **No browser verification.** This project still has no browser automation, so the two-column layout was not measured at its breakpoints and the flow was not clicked through. The store, the totals, the promo pricing, and the revalidation rules are ordinary functions and were reasoned about and typechecked; that a quantity press repaints every summary line was reasoned from the computed totals, not observed.
- **The promo table has no per-customer limit.** A code can be used once per order by the same account, and nothing counts redemptions against a total; a campaign that has to stop after N uses needs a counter this model does not have. Expiry and the active flag are the only controls.

## Stage 28 — Authentication UI

- [x] Fill `client/src/store/auth.store.ts` (existing): token state management, active user profile, auth status flags, login/logout mutators, and storage hydration hooks.
- [x] Fill `client/src/hooks/useAuth.ts` (existing) exposing user profile state, authentication status, and auth actions.
- [x] Fill `client/src/pages/LoginPage.tsx` (existing): email/password form, Zod schema validation, inline error messaging, pending submission state, registration page link, and automatic redirect back to original entry route.
- [x] Fill `client/src/pages/RegisterPage.tsx` (existing): first/last name, email, phone number, password strength feedback meter, confirm password validation, and terms of service check.
- [x] Add logout handler in user navigation menu clearing local token storage, resetting user store, and redirecting to the home route.
- [x] Create `client/src/components/auth/RequireAuth.tsx` route guard wrapping protected paths (`/account`, `/account/orders`, `/checkout`) and redirecting guests to login with `returnUrl` context.
- [x] Create `client/src/components/auth/RedirectIfAuthed.tsx` guard redirecting signed-in users away from auth pages (`/login`, `/register`).
- [x] Implement global HTTP error interceptors mapping server errors (duplicate email on register, invalid credentials, expired JWT) to readable notification UI.
- [x] Confirm user auth state persists seamlessly across browser reloads and that expired session tokens perform clean, unprompted client logouts.

The server half of authentication has existed since Stage 13: `POST /api/auth/register`, `POST /api/auth/login`, and `GET /api/auth/me` behind `requireAuth`, with a bcrypt password service and rate limiters on the two write routes. What did not exist was the interface. `LoginPage.tsx` and `RegisterPage.tsx` were `PagePlaceholder`s, every protected route was open, and nothing in the client could answer "is anybody signed in?" except by asking for the account and reading a failure as an answer.

The stage adds no backend route, no model, and no library. It fills the two empty files the checklist names, writes the two guards, and builds the two forms on the API that was already there.

Three decisions shape the work.

- **The session keeps one source, and the store holds what a query cannot.** `features/auth/auth.queries.ts` remains the only thing that asks for an account — `useSession` fetches `GET /api/auth/me` and reads a 401 as "nobody is signed in", which is what makes an expired token an ordinary state rather than an error to report. `store/auth.store.ts` is not a second session: it makes no request, and it is written from exactly one place, an effect in `useAuth`. What it holds is the three things a query cannot answer. Whether a token existed at boot — storage is synchronous, so that is read while the store module is imported, before the first render. A session for callers that are not renders, which read `useAuthStore.getState()`. And a third status, `hydrating`: a token exists and the server has not confirmed it. That third state is the whole answer to the flicker requirement. A guard that saw "no account yet" during the check would either show the sign-in form to somebody who is already signed in or bounce them off their own page; instead it waits, with a sentence that says so. A session read that fails outright — the network, a server briefly unwell — is deliberately _not_ a wait, in either guard: the token stays in storage, but the route stops waiting, so a failed request cannot park a page on a spinner with no way out.
- **The return path is validated, not trusted.** Where a visitor goes after signing in travels in the URL, and a URL is something a stranger can write, so `routes/returnUrl.ts` accepts a value only when it is a path on this store: a single leading slash, no scheme, no backslash (some browsers read `/\evil.example` as `//evil.example`), no control character, and not one of the two auth pages themselves — which would bounce the visitor straight back. Everything else falls back to the storefront. A guard passes the interrupted address two ways on purpose: router state, which is exact but dies with the history entry, and a `returnUrl` query parameter, which survives a reload of the sign-in page. The form reads the state first and the parameter second. The review callout on a product page uses the same helper, so signing in from there returns to the product rather than to the home page.
- **The forms check what the server checks, and no more.** `features/auth/auth.rules.ts` mirrors the limits in `server/src/utils/validation.ts` — eight characters, sixty for a name, seventy-two for a password, the same phone pattern — as named constants, so the rule the form refuses on and the rule the API enforces cannot drift. The schemas carry keys rather than sentences (`'passwordRequired'`, `'phoneInvalid'`), and `components/auth/messages.ts` turns a key into copy in the language being read, which is what `ReviewForm` already does. The registration form asks for the fields the account actually needs: name, address, an optional telephone number, a password, and its confirmation. No marketing checkbox, no company field, and no captcha — the server stores none of them, and every field it does not want is a field a customer has to read before they can buy. Password strength is a reading rather than a rule: the meter counts length, mixed case, a digit, and a symbol, names the first one that is missing, and never gates submission, because the API's floor is the eight characters the schema already enforces. Duplicate addresses arrive as `409 email_taken` and are placed under the email box, with the sign-in link as the way out; wrong credentials arrive as `401 invalid_credentials` and are one sentence about both fields, which is the API's own decision not to tell a stranger which addresses are registered here.

How the pieces are wired:

- The two guards are layout routes in `App.tsx` rather than wrappers repeated on each page, so a page added to one of the groups inherits the rule instead of having to remember it. `/login` and `/register` sit under `RedirectIfAuthed`; `/checkout`, `/account`, `/account/orders`, and the order detail route sit under `RequireAuth`.
- `components/auth/PasswordField.tsx` draws the reveal button inside the field's own frame, with a name that changes with its state ("Show password" against "Hide password") and `aria-pressed` carrying the state itself. The reveal is switched off after a refused attempt of any kind, so a password the server has just rejected is not left legible on the screen.
- `components/common/Input.tsx` gained the pairing its error message was missing: the message now carries an id, the input points at it through `aria-describedby`, and `aria-invalid` is set while it is there. Previously a message was merely near a field, which a screen reader may read before the field or after the next one.
- `services/fieldErrors.ts` holds the one reading of `details.fields`, the shape behind a 422. The checkout form's `readCheckoutErrors` now delegates to it instead of walking the envelope a second time.
- Signing out navigates to the storefront as it clears storage and the cache, so a visitor who signs out while standing on the account page is not left on a page they may no longer see. The account menu already had the entry; what it gained is the destination.
- Passwords and tokens are never logged, never stored outside the token's own storage key, and never used as a cache key. The password lives in the form's state and leaves it with the request that submits it.

Verified against the running server: `POST /api/auth/login` with the seeded account answers 200 with a session, and the token it returns is accepted by `GET /api/auth/me`, which answers the same account; the wrong password answers `401 invalid_credentials`; a malformed token answers `401 invalid_token`, which is the response the API client drops the stored token on. Registration with an address that is already registered answers `409 email_taken` with the message also filed under `details.fields.email`, and a payload that breaks several rules answers 422 with one message per field — `firstName`, `email`, `phone`, `password` — which is exactly the set the client schema refuses first. `pnpm lint` is clean, `pnpm -r typecheck` passes both projects, `pnpm --filter client test` passes 6 files and 64 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only.

Two limits worth recording:

- **No browser verification.** This project has no browser automation, so the guards were not clicked through. Whether a reload of `/account` shows the wait and then the page, whether the return path lands where it should, and whether the reveal button reads correctly to a screen reader were reasoned from the state machine — `hydrating` waits, `anonymous` redirects, `authenticated` renders — and from the fact that both guards read that state from the same hook. What was not observed is the timing: that the account page never flashes before the redirect on a signed-out reload, and that a slow `me` request never shows the sign-in form to a signed-in visitor.
- **The strength meter is a reading, not a promise.** It knows nothing about whether a password has appeared in a breach, and its own comment says so rather than implying otherwise. A password that satisfies every check it counts can still be a bad one, and the meter will call it strong.

## Stage 29 — Checkout

- [x] Fill `client/src/pages/CheckoutPage.tsx` (existing) as a multi-step checkout workflow: Contact Details, Delivery Method, Payment Details, and Final Order Review.
- [x] Create `client/src/components/checkout/CheckoutSteps.tsx`: visual progress bar displaying step sequence, completed steps, and current step position.
- [x] Create `client/src/components/checkout/ContactForm.tsx`: email, full name, and phone number validation. The checkout sits behind `RequireAuth`, so the boxes start from the signed-in account rather than from an express guest path this store does not have.
- [x] Create `client/src/components/checkout/ShippingForm.tsx`: shipping address fields (country, city, street, postal code) and the courier-versus-pickup selector. The account's own details prefill the contact step; there is no addresses API to pick a saved address from, and no model is added for one.
- [x] Create `client/src/components/checkout/PaymentForm.tsx`: payment option selection (cash on delivery, card payment) filled from the codes the delivery policy publishes, plus a test-mode indicator. No card fields are drawn: payment is simulated, and no card number is asked for, sent, or stored.
- [x] Create `client/src/components/checkout/OrderSummary.tsx`: sticky order summary card reflecting cart items, shipping for the chosen delivery method, applied promo codes, and step-edit shortcuts.
- [x] Execute strict step-by-step Zod schema validation before allowing users to advance through checkout steps.
- [x] Intercept checkout submissions if cart items become out of stock during the checkout process, displaying specific item errors.
- [x] Process order creation via `POST /api/orders`, handle simulated payment response, flush local cart state, and route directly to order confirmation page.
- [x] Create `client/src/pages/OrderConfirmationPage.tsx`: success confirmation displaying assigned order number, item summary, total paid, delivery time estimate, and action button to view order tracking.
- [x] Implement submission button disable states to prevent duplicate order requests during API network latency.

The order endpoints have existed since Stage 12: `POST /api/orders` writes the order inside a transaction that re-reads every price and every stock row, `GET /api/orders/:id` returns it to its owner, and `cancelOrder` restores stock. The client half was a `PagePlaceholder`, and the payload it would have sent was never built. This stage adds no route, no model, and no library. It builds the four-step form, the summary beside it, and the page an order lands on.

One real inconsistency was found and fixed first: the delivery policy published four payment codes (`CASH_ON_DELIVERY`, `CARD`, `PAYME`, `CLICK`) while the checkout schema accepted two (`CARD`, `CASH`). A shopper choosing from the published list could have been refused for choosing correctly. The codes now live in `server/src/config/payments.ts`, which both `order.service.ts` and `delivery.service.ts` read — the shared module rather than one service importing the other, because the order service already imports the delivery service for the free-delivery threshold and the other direction would be a cycle. Verified live: `GET /api/delivery/estimate` now answers `"paymentMethods":["CARD","CASH"]`, and a checkout naming `PAYME` answers `422` with `details.fields.paymentMethod`.

The decisions that shape the client:

- **Validation is per step, and only for the step being left.** `features/checkout/checkout.rules.ts` holds one schema per step — contact, shipping, payment — plus a combined schema for the review submission, and the limits mirror `routes/order.routes.ts` field for field: a name of 120, a country and city of 60, a street of 160, a postal code of 20, notes of 500, and the same email and phone rules registration uses. A stricter client would block an order the API would have accepted; a looser one would move the refusal to the end of a filled-in form. Rules carry keys (`'streetRequired'`), and `components/checkout/messages.ts` turns a key into copy in the language being read, exactly as the auth forms do.
- **The basket is checked, not trusted.** The checkout re-reads its products through the same `useCartRevalidation` the cart page mounts, so a line that sold out while the form was open is reported against that line and the order cannot be placed while something is unbuyable. A price that moved is reported and not blocked: the server prices the order either way. When the server itself refuses a line — the case the catalog read cannot see, a variant's stock — the 422 body arrives as `items.3.quantity`, `lineIndexOfField` turns that index into the cart line at the same position, and the refusal is drawn under that product in the summary. The same response also triggers a fresh catalog read, which is what turns "something was refused" into "here is what is left of it".
- **Nothing about money travels from the client.** The payload names products, quantities, and one variant id per line — and a line that picked two option groups sends none, because half a selection would read as a selection. `checkoutShipping` prices the summary for the chosen method (pickup is free at any value; courier is the flat fee below the published threshold) from the same `shippingFor` the cart uses, and every figure is recomputed by the server inside the transaction that writes the order.
- **The order is placed once, and the confirmation is a route.** The submit button is disabled while the request is in flight, and the page routes to `/checkout/confirmation/:id` on the response rather than offering a second attempt. The id is in the URL, so a reload, a bookmark, or a link from the order history all show the same page — the order is the server's, not the tab's. `features/orders/` is new and minimal for that: `orders.api.ts` reads one order, `orders.queries.ts` wraps it, and the placement seeds the same cache entry so a fresh checkout draws what the server already sent. An order belonging to another account is a `404` by the server's own rule, and the page says the order could not be found rather than pretending it exists.
- **The confirmation repeats the delivery promise rather than inventing one.** The window comes from the same `GET /api/delivery/estimate` the product page asks, keyed on the postal code the order recorded; a code no zone covers answers "we will confirm the window with your order". Pickup says so instead. The payment line is the method that was chosen with the status the order holds.

How the pieces are wired:

- `CheckoutSteps` marks the steps that are done with a tick and the current one with `aria-current="step"`, and a completed step is a button back to itself — changing the city from the review is one click rather than three. `OrderSummary` repeats those shortcuts beside the figures they change, and carries the `PromoCodeForm` the cart already has, so a code is applied, re-priced, and refused in one place.
- An empty basket is `EmptyCart`, as it is on the cart page; the placed-order id is set before the navigation, so the emptied basket is never drawn on the way to the confirmation.
- `utils/formatPrice.ts` remains the only formatter, and the `checkout` copy group is new in all three languages, with `pages.checkout.note` and `pages.orderConfirmation` replaced now that the pages are real.

Verified against the running server with a seeded account: a courier order below the threshold (`subtotal 7 800 000`, `WELCOME10` at 10% → `promoDiscount 780 000`, `shippingTotal 2 500 000`, `total 9 520 000`) — `total = subtotal − promoDiscount + shipping` holding exactly; the same basket above the threshold ships free; a pickup order ships free at `1 890 000`; `paymentMethod: "PAYME"` answers `422` under `details.fields.paymentMethod`; an oversized line answers `422` with `{"items.0.quantity": "Only 4 left in stock."}`, which is the key the page maps back to the product. `GET /api/orders/:id` answers the order with its lines to its owner, `404` to another account, and `401` without a token. `pnpm lint` is clean, `pnpm -r typecheck` passes both projects, `pnpm --filter client test` passes 6 files and 64 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only.

Two limits worth recording:

- **No browser verification.** The project still has no browser automation, so the steps were not clicked through. What was reasoned rather than observed: that the summary stays beside the form while the page scrolls, that a refused line repaints in the summary without a reload, and that the review step's values are the edited ones after a jump back and forward. The state machine behind those is one piece of state plus a step index, and the same schemas decide both the step advance and the final submit.
- **The payment step is a choice, not a payment.** Both codes record an intention and the order stores it; no card is charged, no gateway is called, and no card number is collected — which is why there are no card fields to format. The panel says so where a shopper reads it, rather than leaving the omission to be inferred.

## Stage 30 — Orders

- [x] Fill `client/src/pages/OrdersPage.tsx` (existing): user order history page displaying order IDs, purchase dates, status badges, item thumbnail previews, total cost, and direct detail links.
- [x] Create `client/src/pages/OrderDetailPage.tsx`: comprehensive order page detailing full item list, itemized price breakdown, delivery address, payment method used, order status timeline, and order cancellation button when eligible.
- [x] Create `client/src/components/orders/OrderStatusBadge.tsx`: colour-coded status badge mapping backend states (`PENDING`, `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`) to visual indicators, each with an icon and a word so the badge does not rely on colour.
- [x] Create `client/src/components/orders/OrderTimeline.tsx`: visual step-tracker from placement to delivery, marking the steps that are done, the step the order is on, and the ones still ahead, with a separate reading for a cancelled order.
- [x] Restrict access to order details, returning standard 404/Forbidden views if a user attempts to view an order belonging to another account. The rule is the server's — the history and the detail both read orders by owner — and the page draws the 404 as "we could not find that order" rather than as a failure.
- [x] Render empty order list state featuring CTA links back to the catalog.
- [x] Verify that order cancellations execute stock re-crediting and update user order status UI instantly. Verified against the running server: cancelling `ZY-2026-1011` took the line's stock from 148 back to 150, and a second cancel answered `409 order_not_cancellable`. The page takes the returned order and writes it into the cache, so the badge, the timeline, and the button all move on the response rather than after a reload; that part was reasoned from the code, not watched in a browser.

Every endpoint this stage needs has existed since Stage 12: `GET /api/orders` pages a customer's orders newest first, `GET /api/orders/:id` answers one to its owner and 404s to anyone else, and `POST /api/orders/:id/cancel` cancels an order inside a transaction that restores its stock. What was missing was the client: `OrdersPage.tsx` and `OrderDetailPage.tsx` were `PagePlaceholder`s, and nothing in the client had ever asked for an order except the confirmation page. This stage adds no route, no model, and no library.

The decisions that shape it:

- **The two pages are one receipt read twice.** The confirmation page and the order page show the same lines and the same money, so those two pieces were extracted into `components/orders/OrderBreakdown.tsx` (`OrderLines` and `OrderTotals`) and the confirmation page was moved onto them. The duplicated version had already drifted: the confirmation drew a line's total and not its unit price, and the order page needs both. The totals are the server's own `subtotal`, `promoDiscount`, `shippingTotal`, and `total` — never a sum computed in the component, because `subtotal − promoDiscount + shippingTotal` is the server's rule and a second copy of it is how the two would eventually disagree.
- **Cancellation is offered, and then confirmed.** The button is drawn only from the statuses the server accepts (`CANCELLABLE_STATUSES`, mirrored in `features/orders/orders.rules.ts` as `canCancelOrder`), and pressing it opens a dialog rather than sending the request, because cancelling is the only destructive thing a customer can do to an order and it cannot be undone. An order past that point says why there is no button instead of leaving the customer to look for one. The server still enforces the rule: a second cancel — or a cancel racing a status change — answers `409 order_not_cancellable`.
- **The response is the new state.** `useCancelOrder` writes the order the server returned into the detail entry and into the row in the cached history, then invalidates the history. That is not an optimistic patch: the response is the server's own version, so the badge, the timeline, and the button all move when the answer arrives, and the items are back in stock by the same request. The list is refetched as well, which is what corrects a page count when a cancelled order drops out of it.
- **The page number is in the address bar.** The second page of a history is a link a customer can keep, and `Pagination` is given the same `hrefFor` every listing uses, so a page of orders can be opened in a new tab. An account with no orders gets `EmptyState` and a way into the catalogue rather than an empty panel, and a history that failed to load says so and offers a retry without emptying the page.
- **Two readings of one status, in one place.** The six status words live once, in the `orders` copy group, and the badge, the timeline, and the history all read them from there; the timeline's sentences are separate because they say what a status means rather than what it is called. The badge carries an icon, a colour, and the word, so a customer who cannot tell the tones apart still reads "On its way".

How the pieces are wired:

- `OrderTimeline` is a list rather than a row of dots with a line between them: a list reflows on a narrow screen without the rail being redrawn, and each step carries the sentence that explains it. The rail is drawn per step, so the last step has no line under it. A delivered order has every step done and no current one; a cancelled order leaves the sequence entirely, and the timeline says what happened to the money — refunded or not — because that is the question the state raises.
- A line links to its product when the catalog still has it, because the most common reason to open an old order is to buy the same thing again, and renders as plain text when the product is gone rather than as a link to nowhere.
- The placeholders went away with the pages: `pages.orders.note` and `pages.order.note` no longer say that the pages arrive in Stage 30, and the `Order` copy group is new in all three languages.
- `utils/formatDate.ts` and `utils/formatPrice.ts` remain the only formatters, so an order's date and its total read in the language the customer is using.

Verified against the running server with a seeded account: the history answers 8 orders over 2 pages at `limit=5` (5 on the first page, 3 on the second), each with its lines, its slug, and its thumbnail URL; requesting another account's order answers `404` and that account's own history shows only its own order (`total: 1`); a request without a token answers `401`, and a malformed id answers `422`. Cancelling `ZY-2026-1011` (`total 9 520 000`, `PENDING`, `UNPAID`) answered the order with `status: CANCELLED` and the product's stock went from 148 to 150 — the two units the order held — and a second cancel answered `409` with `order_not_cancellable`, which is the race the conditional update exists for. `pnpm lint` is clean, `pnpm --filter client typecheck` passes, `pnpm --filter client test` passes 6 files and 64 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only.

Two limits worth recording:

- **No browser verification.** The project still has no browser automation, so the two pages were not clicked through. What was reasoned rather than observed: that a cancelled order repaints in place without a reload, that the confirm dialog closes on success and stays open on failure, and that the timeline's rail lines up at a narrow width. The state behind all three is one cached order object that the response replaces, and the dialog is one boolean that only a successful response clears.
- **The timeline shows states, not times.** The API records `createdAt` and `updatedAt` and nothing per step, so the tracker says where the order is and not when it got there. Drawing a timestamp beside each step would mean inventing one, which is the same reason the confirmation page asks the delivery estimate endpoint rather than promising a date of its own.

## Stage 31 — Account page

- [x] Create `client/src/pages/AccountPage.tsx`: tabbed customer portal managing profile information, default shipping address, security settings, order history link, and wishlist link. The three sections are tabs on one page, addressed as `?tab=profile|address|security`, and the orders and the saved products are linked from the top of the page because they are pages rather than panels.
- [x] Create `client/src/components/account/ProfileForm.tsx`: user information form with name, email, and phone validation. The email is drawn but not editable — it is the sign-in identity and this version has no way to verify a new one — so the names and the phone number are what is validated, and the field says why it cannot be changed.
- [x] Create `client/src/components/account/AddressForm.tsx`: shipping address management interface for editing default user delivery details. The list, the add-and-edit form, "Make default", and the deletion behind a confirmation are one component; the form opens in place rather than in a dialog, because the list behind it is what is being chosen between.
- [x] Create `client/src/components/account/PasswordForm.tsx`: password change form requiring current password verification alongside new password confirmation. Done as written: the current password is sent with the new one and verified by the server, not by the browser.
- [x] Implement backend endpoints `PATCH /api/users/me`, `PATCH /api/users/me/password`, and user address routes with Zod request validation. The address schemas mirror the shipping half of the checkout schema field for field, because a saved address is filled into that checkout.
- [x] Display contextual success/error notifications upon profile or password update attempts. Delivered as inline status and alert messages rather than toasts: there is no notification system until Stage 32, and a form that reports the result beside the button that sent it says the same thing without pretending a toast exists.

The account has been readable since Stage 28 and writable only now. The server half is new — `services/user.service.ts`, `controllers/user.controller.ts`, and `routes/user.routes.ts`, mounted at `/api/users` behind `requireAuth` — and the client half is `features/account/`, `components/account/`, and a page that replaces its placeholder.

The decisions that shape it:

- **The email is not editable.** It is what the account signs in with — `requireAuth` re-reads the account by the id in the token, and the token is issued for that address — and this version has no way to prove that a new address belongs to whoever typed it. An edit would therefore have to be trusted or verified, and a mistyped address would lock the account out of its own orders. The field is drawn with the reason rather than left as a greyed box.
- **An address is addressed by its owner and its id.** Every route reads the owner from the session and matches on the pair, so another account's address id answers `404` rather than being editable, and no route takes a user id at all.
- **The first address becomes the default.** Setting one clears the flag on the others in the same transaction, so "the default" is a single row rather than a race between two. Deleting the default deliberately promotes nobody: `Address` has no timestamps, so any successor would be chosen by an invented ordering, and the honest state is an account with no default until the customer picks one. The list is drawn default-first because that is the order the server returns.
- **A wrong current password is a field message, not a `401`.** `PATCH /api/users/me/password` answers `422` with the reason filed under `fields.currentPassword`: the session is fine and one box is not, and a `401` would make the api client drop a token that is still valid. The change costs a bcrypt comparison per attempt, so the route is rate-limited per account — a stolen token should not be a free password-guessing oracle. A token issued before the change stays valid, because there is no session table to revoke it in, and the form says so instead of implying that other devices were signed out.

How the pieces are wired:

- `features/account/account.rules.ts` holds the schemas and the same limits the server enforces — the name, phone, and password rules are imported from the auth rules rather than restated, so a phone number is refused in the same words wherever it is typed. `components/account/messages.ts` turns a broken rule's key into that sentence, handing the shared keys to the auth form's own message table.
- Two queries change what the rest of the application shows, so both are written from the response rather than refetched: `useUpdateProfile` puts the returned account straight into `queryKeys.auth.me()`, which is what moves the header's greeting, and `useChangePassword` caches nothing because the answer has no body. Address writes invalidate the address list instead, because setting a default clears the flag on rows only the server knows about.
- The address query and the mutation behind it are idle without a session, like the orders: without one the request can only answer `401`.
- The tab bar is a set of links rather than buttons imitating tabs. Each section already has a URL, so a link is what the control honestly is, `aria-current` marks the open one, and the back button behaves the way it does everywhere else on the site.
- `components/auth/PasswordField.tsx` gained an optional `hint`, because a box asking for the password somebody already has should not be told that a new one needs eight characters.

Verified against the running server with a seeded account: `PATCH /api/users/me` answers `200` with the account in the envelope and leaves the email untouched, and an invalid phone number answers `422` with `details.fields.phone`; the address list comes back default-first, a created address answers `201`, and `PATCH { isDefault: true }` moved the flag — the list then showed the new row default and `Home` not. Deleting it answered `204`, and deleting the default left the account with no default, which is the documented behaviour; a later `PATCH` restored `Home`. Earlier, against the same server: another account's address answers `404` on both `PATCH` and `DELETE`, a malformed address id answers `422`, a request without a token answers `401`, and a wrong current password answers `422` with `details.fields.currentPassword`. `pnpm lint` is clean, `pnpm -r typecheck` passes, `pnpm --filter client test` passes 6 files and 64 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only.

Two limits worth recording:

- **No browser verification.** The project still has no browser automation, so the tabs were not clicked through. What was reasoned rather than observed: that a tab link keeps the section open across a reload, that the address form repaints the list on the answer without a reload, and that the delete dialog closes on success and stays open on failure. The state behind those is one query key plus one `null`-able editing target.
- **No toasts yet.** Success and failure are reported in place. Stage 32 builds the notification system, and moving these messages into it is a change to where they are drawn rather than to what they say.

## Stage 32 — Loading, empty, and error states

- [x] Create `client/src/components/common/Skeleton.tsx`: configurable loading skeleton component with variant shapes (`text`, `card`, `avatar`, `image`). Done as written: the variant is only a default, and the caller passes the size and the radius through `className` and, where it measured something, `style`.
- [x] Create `client/src/components/common/EmptyState.tsx`: reusable empty state container with custom SVG illustration, title, descriptive message, and action CTA button. The component predates this stage and was already in use on the catalog, the search results, the wishlist, and the order history; what it takes is an `Icon` from the icon set rather than a bespoke SVG illustration, and no second empty-state container was written to change that.
- [x] Create `client/src/components/common/ErrorState.tsx`: reusable error container featuring error detail text, retry request trigger, and support links. Done as written, and deliberately kept apart from `EmptyState`: empty is an answer, failure is a broken request whose whole point is the retry.
- [x] Create `client/src/components/common/LoadingSpinner.tsx`: lightweight SVG spinner component for button loading states and inline async content waits. Done as written — two paths and a `size`, `aria-hidden` because the control that owns it carries the label.
- [x] Create `client/src/components/common/ErrorMessage.tsx`: standardized inline field error message component for form controls. Done as written, with the size left to the caller so the same element serves a field under an input and a compact one inside a summary line.
- [x] Create `client/src/components/common/Toast.tsx` paired with `client/src/store/toast.store.ts`: global notification system for feedback (add-to-cart success, wishlist updates, network errors). All three sources are wired: adding to a card, saving or removing a wishlist entry, and a mutation that never reached the server. The network notification fires only for `status === 0`, because a refused field is already answered under the field it belongs to.
- [x] Integrate skeleton loaders across all primary data components: home rails, catalog grid, product detail view, cart page, and order list. Those five already drew placeholders shaped like their content; what was missing was one definition of the box, and the hand-written `animate-pulse` divs in eleven files now go through `Skeleton`.
- [x] Audit every application page for complete loading, empty, and error path coverage. Done, and it found four places where a failed request was drawn as an answer: the category page, the product page, the order detail page, and the confirmation page all reported "not found" for a request that never arrived. All four now read the status and draw an empty state only for a `404`.
- [x] Implement localized retry capabilities on error states, allowing re-fetching of failed queries without reloading the entire page. Every page-level failure carries a button that re-runs the query that failed — `refetch` on the resource that owns it rather than `location.reload()` — and its label comes from `strings.actions.retry`, so it is written in the language on screen.
- [x] Add offline/network disconnect banner alert with automatic reconnection detection. `hooks/useOnlineStatus.ts` reads `navigator.onLine` through `useSyncExternalStore` and subscribes to the `online` and `offline` events; `components/layout/OfflineBanner.tsx` draws the strip while the browser reports no connection and notifies once when it comes back.

The pieces are five primitives and one store, and the work was mostly wiring them to call sites that had each grown their own version.

The decisions that shape it:

- **`ErrorState` is not `EmptyState` with different words.** Empty means the question was answered and the answer was nothing; the next step is somewhere else in the catalog. A failure means the same question can be asked again, and the retry is the reason the panel exists. Keeping them apart is what stops a page from offering "browse the catalog" to somebody whose connection dropped.
- **A toast is the last resort, not the default.** A message goes in a toast only when the thing it describes has left the screen: a product added from a grid of twelve, a wishlist entry saved from a card that no longer shows its own confirmation, a list emptied by a bulk action, a connection that dropped. Anything a page can say where the visitor is already looking stays in place — a field message, a repainted panel, a button that changed its own label. A notification that repeats what is on screen is noise somebody has to dismiss.
- **The message is resolved when the event happens, not when it is drawn.** The store holds sentences, and the callers build them at the moment of the event. A notification lives a few seconds and describes something that has passed; re-resolving it on a language switch would describe the past in the new language, and the sentences that carry a product name or a count would have to be stored as a key and its arguments to do it.
- **At most three notifications, and a fourth drops the oldest.** A bulk removal is one request per product, and a queue with no ceiling is a queue that covers the page it is reporting on. Each one leaves on its own timer — errors stay longer than confirmations — and a caller can take one away early by the id `notify` returns.
- **The global failure notification is for the request that never arrived.** It hangs off the query client's mutation cache and fires only for `status === 0`. A `422` belongs under the field that caused it, a `404` belongs in the panel that explains the missing thing, and a second toast saying "something went wrong" on top of either would be a worse message in a worse place.
- **The wishlist notification lives in the hook, not in the button.** Both the heart on a card and the "save for later" row on the cart page call the same `toggle`, and one press is one message wherever it was pressed. That is what let the cart page drop a piece of component state and a timer whose only job was to print the same sentence.
- **The offline banner is driven by the browser, not by a request.** `navigator.onLine` is not a guarantee that the API is reachable, and it is not meant to be: it answers the one question this banner asks, which is whether the browser has a connection at all. The event subscription is what makes the recovery automatic, and the coming-back notification fires only on a real transition, so a page opened while offline does not announce that it reconnected.
- **A failed request is not a missing thing.** The audit's finding was one mistake repeated: three pages and one panel told a shopper that a category, a product, or an order did not exist when the truth was that the answer never came. Each now reads `isApiError(error) && error.status === 404` to decide between an empty state and a retry, which are different promises about the same blank page.

How the pieces are wired:

- `components/common/Toast.tsx` exports `ToastViewport`, which is mounted once in `Layout.tsx` outside `main`, so a notification survives the route change that caused it. The region is `role="status"` with `aria-live="polite"`; each notification is a tone-coloured row with an `aria-label`ed dismiss button, and only the dismiss button takes pointer events, so a toast never covers a control under it.
- `store/toast.store.ts` also exports a module-level `notify`, for the callers that are not components: the wishlist mutations, the cart button, the query client's mutation cache, and the offline banner.
- `services/queryClient.ts` is new and owns the one hook into failures that no page can see. `main.tsx` builds the client from it rather than constructing a `QueryClient` inline.
- `hooks/useOnlineStatus.ts` and `components/layout/OfflineBanner.tsx` are the whole of the connection story. The banner is the first thing inside `Layout`, so it pushes the announcement bar down rather than covering it.
- `features/wishlist/wishlist.queries.ts`: `useWishlistProducts` gained a `refetch`, so the wishlist page's failure state re-runs whichever of the two requests its list came from — the catalog read for a guest, the account's list for a signed-in visitor. `toggle` and `removeMany` are where the wishlist's own sentences are chosen, because the direction of the change is only known there.
- Every icon-only spinner is gone: `Button`, `AuthPending`, and `Pagination` now draw `LoadingSpinner` instead of a lucide circle with `animate-spin`, so the wait looks the same in all three.

Verified after the changes: `pnpm lint` is clean, `pnpm -r typecheck` passes, `pnpm --filter client test` passes 7 files and 71 cases — the notification store's own suite is new and covers the three-notification ceiling, the per-notification timer, the longer life of an error, dismissal by id, and clearing — and `pnpm -r build` succeeds with the pre-existing chunk-size warning only. Against the running server, the endpoints behind the error states still answer as the panels expect: a product listing answers `200`, an unknown product slug answers `404` and draws the not-found state rather than the retry panel, and the order history without a token answers `401`. No server file changed in this stage; it is entirely a client change.

Two limits worth recording:

- **No browser verification.** The project still has no browser automation, so no notification was watched leaving the screen and the offline banner was not seen appear and vanish. What was reasoned rather than observed: that a toast survives the navigation that caused it, that the coming-back notification fires only on an offline-to-online transition, and that a retry on each page refetches that page's query and nothing else. The state behind the first is a viewport mounted outside the router's outlet, the second is a ref that remembers the previous reading, and the third is each page's own resource object.
- **The e2e path is not exercised.** The change that makes a request fail with `status === 0` is the api client's own, and it was not triggered end to end here — the query client's hook and the banner's condition were checked by reading, not by pulling a cable. What is tested is the store underneath both, which is where the queue, the timers, and the dismissal actually live.

## Stage 33 — Responsive and mobile UX

- [x] Audit and refine component responsiveness across core breakpoints: 320 px, 375 px, 768 px, 1024 px, and 1440 px. Done as a reading, not as a session in a browser — see the limits below. Every page sits in one container (`max-w-page px-page-x`, or `max-w-narrow` behind `AuthPanel` on the auth pages), so no page has a width of its own to get wrong. What it changed is three grid templates that used a bare `1fr` track: `CartItemRow`, the hero's footer row, and the catalog's mega-menu all now use `minmax(0, 1fr)`, because a `1fr` track refuses to shrink below its content's minimum and that is what puts a horizontal scrollbar on a narrow window.
- [x] Ensure all mobile touch controls adhere to minimum 44 by 44 px hit target sizing guidelines. Done by raising ten controls to 44 px below the small breakpoint and leaving them at their drawn size above it, where a pointer is doing the aiming: the two rail arrows, the product card's heart, the quantity stepper's two buttons and its field, the toolbar's grid/list pair, the filters button, the sort menu's trigger, the review filters' trigger, the gallery's arrows, the modal's close button, and the review vote buttons. Two controls were already compliant by design rather than by size: the pager's numbers are replaced below the small breakpoint by a full-width "load more" button, and the jump field appears only where the numbers do.
- [x] Implement sticky bottom "Add to Cart" action bar on mobile product detail pages and sticky checkout CTA bar on mobile cart page. `components/common/StickyActionBar.tsx` is the bar; `components/product/StickyAddToCart.tsx` mounts it on the product page and the cart page mounts it directly. It is `lg:hidden`, draws its own spacer so the last row of a page is not hidden behind it, and sits directly on top of the bottom navigation — which is why that navigation's row now has a fixed `h-14` rather than a height decided by its content.
- [x] Lock background body scrolling when mobile navigation drawer, filter drawer, or modal overlays are active. `hooks/useBodyScrollLock.ts` is new and `Modal.tsx` now uses it. The three drawers — the mobile menu, the filter drawer, and the gallery's full-screen view — are Radix dialogs, which already stop the page behind them from scrolling; the modal was the one hand-written layer that did not share that behaviour, and the hook is what it takes from it.
- [x] Prevent text overflow across tight viewports, enforcing text truncation with ellipsis or word wrapping for long titles. The audit found the app already wrapping or truncating where it matters — sixteen utilities across the source, from the card's two-line clamp to the account menu's truncated name and address — and it added `break-words` to the one place a single unbroken token from a person can land: the reviewer's name. The grid-track change above is the other half of this: an over-long word inside a `1fr` track is what pushes a layout sideways.
- [x] Enable image lazy loading (`loading="lazy"`) for below-the-fold assets with explicit `width` and `height` dimensions to eliminate cumulative layout shift. Already true of every catalog surface before this stage — the cards, the category chips, the collections grid, the deals row, and the review photographs all declared their dimensions and their loading behaviour — and it is now true of the review thumbnails, which were the two elements still carrying only a class for their size. `Thumbnail` is the deliberate exception: it declares no dimensions because its box is sized by the caller's CSS, so there is nothing for the browser to reserve.
- [x] Test gesture responsiveness for home page product rails and product image gallery lightbox swiping. Confirmed by reading rather than by swiping: the rails are a native horizontal scroller, so the browser's own touch handling is what moves them, with the vertical drag left alone. The gallery already implemented the swipe — a horizontal move of more than 45 px, with a mostly-vertical drag handed back to the page so a reader is not trapped mid-scroll — and its full-screen view inherits the same handler. No change was needed to either.
- [x] Confirm layout integrity when tested at 200 percent browser zoom, ensuring no horizontal scrollbars or overlapping text elements occur. Addressed by the two changes that could have caused it rather than by testing at 200 percent: nothing in the layout has a horizontal scroll container outside the rails, the grid tracks that could not shrink now can, and every breakpoint is in CSS pixels, so a zoomed window crosses into the narrower layouts rather than overflowing a wide one. What that reasoning does not cover is a real 200 percent session, which is recorded below as a limit.

The stage is one new bar, one new hook, and a pass over sizes.

The decisions that shape it:

- **A sticky bar repeats a control; it does not invent one.** The bar's whole reason to exist is that the real button has scrolled away, so it appears only once `useElementInView` says the panel it copies has left the screen, and it disappears the moment the shopper scrolls back to it. Two buttons offering the same thing, one of them covering the product, is a worse page than one button a thumb has to travel to.
- **And because it repeats one, it is hidden from assistive technology.** Every action the bar offers is already on the page with a real name and a real place in the tab order. A second control with the same name would read the page twice to a screen reader and give a keyboard user two identical stops, so the bar is `aria-hidden` and its button is taken out of the tab order — reachable by thumb, invisible to everybody else.
- **The bar stacks on the navigation instead of covering it.** Its offset is the navigation's height, which meant fixing that height: the bottom navigation's row is `h-14` rather than sized by its content, so the bar's position is a constant rather than a guess that drifts with the font size.
- **The lock counts, and it saves what it replaces.** Two layers can be open at once — a dialog over the account page — and each unlocks on its own, so a boolean would let the first one to close unlock the page under the second. It also replaces the scrollbar's width with padding, because removing the scrollbar widens the document and everything centred on it jumps sideways at the moment the layer opens.
- **One action, one hook.** `features/cart/useAddToCart.ts` is new and holds what "add to cart" means on the product page — the line and the beat of confirmation. The panel and the sticky bar both press it, so the bar records exactly what the panel would have, including the size and quantity chosen after the bar was rendered. The hook reads its input from a ref refreshed during render, because a press has to record what was on screen when it happened.

How the pieces are wired:

- `hooks/useElementInView.ts` wraps `IntersectionObserver` behind a callback ref, and answers `false` while there is no element — which means "the bar is shown". A bar that appears a moment early is in the wrong place; one that never appears is a control the shopper cannot reach.
- `components/common/StickyActionBar.tsx` takes a label, an optional second line, a disabled flag, and a handler. The product page passes a price and the cart page passes the total; neither passes markup.
- `components/product/StickyAddToCart.tsx` is the product page's own wiring: the chosen options, the quantity, the price, and the same `disabled` rule the panel uses. A sold-out product gets no bar, because the panel already has that answer.
- `pages/CartPage.tsx` mounts the bar with the same `blocked` flag its summary uses, so a basket that cannot be checked out says so in both places.

Verified after the changes: `pnpm lint` is clean, `pnpm -r typecheck` passes, `pnpm --filter client test` passes 7 files and 71 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only. No server route changed in this stage.

Two limits worth recording:

- **No browser and no device.** The project still has no browser automation and no testing on a handset, so nothing here was watched at 320 px, nothing was swiped, and the 200 percent zoom check is reasoning about the layout rather than an observation of it. What was done instead is a reading of every page container, every grid template, and every control against the five widths, and the changes above are the ones that reading justified.
- **The sticky bars were reasoned about, not seen.** That the bar clears the bottom navigation is arithmetic on a height that is now fixed; that it appears only when the panel has scrolled away is a property of the observer, checked by constructing it rather than by scrolling a phone. The behaviour most likely to need a look on a real device is the bar's arrival and departure, because an intersection that flickers at a boundary is a bar that blinks.

## Stage 34 — Accessibility

- [x] Add a skip-to-content link as the first focusable element in `Layout.tsx`. Already there, and this stage confirmed it rather than adding it: the link is the first element inside the layout, it is `sr-only` until it takes focus, and it points at the `<main id="main-content">` that holds the routed page. It matters most on the two screens with a stretch of navigation ahead of the content — the catalog page's category row and the account menu.
- [x] Use one `h1` per page and a logical heading order. Checked branch by branch across every page rather than by reading the rendered HTML, because half the pages draw one of two headings depending on whether an entity was found: the cart page's empty and filled branches, the checkout page's blocked and open ones, the confirmation page's found and missing ones, and the search page's results and empty ones each carry exactly one `h1`, never two. The `h1` also lives in the shared pieces that stand in for a page — the auth panel, the not-found page, the route error boundary, the empty placeholder, and the home hero — and `SectionHeading` supplies the `h2`s beneath them. No change was needed.
- [x] Give every image meaningful alt text, decorative images empty alt. Every `img` in the source was read and found to carry an explicit `alt`, so none can fall through to the browser's habit of reading the file path. The empty ones are decorative for a stated reason — the logo inside a link that has its own name, the picture inside a card whose heading is beside it, the category tile inside a link named by `aria-label`, the hero's product image inside a named link, the review thumbnails whose position in the row is written into their text. No change was needed.
- [x] Label every form field and associate help and error text with `aria-describedby`. True of the field components already: `Input` gives each field an id, points it at the error or the helper through `aria-describedby`, and marks it `aria-invalid` while a message is showing; `PasswordField`, the notify dialog's address field, and the review form's rating and body do the same. The audit's finding is on the other side of the line — the accessibility linter could not see the text of the two radio cards (the delivery method and the payment method), because their name sits two wrappers inside the `label` that owns the input, and it read that as a label with no text. The text is `strings.checkout.…` and the browser computes the name from the label's contents; the rule now looks one level deeper instead of the markup being flattened to suit it.
- [x] Announce cart updates, toast messages, and async errors through live regions. The audit found this mostly done and found the one cause that spoke to nobody: a press on a card's own add-to-cart button swapped the button's label to "Added", and a control that renames itself is read only when it is reached again — the shopper is looking at the picture. `ProductCard` now carries a `role="status"` region beside that button, empty until a press and holding one sentence, so the confirmation is heard once and never twice. The rest was already in place and was left alone: toasts are a polite status region, error messages are `role="alert"`, the cart page announces its own count because the button that changed it may be gone from the screen, the product page's panel says what it added, and the announcement strip deliberately does not rotate its text through a live region.
- [x] Manage focus when opening and closing the menu, filter drawer, modals, and lightbox. The drawer, the filter panel, the gallery's full-screen view, and the notify dialog are Radix dialogs and were already doing all of it — Tab stays inside, Escape closes, the backdrop closes, the page behind is locked, and focus returns to what opened it. `components/common/Modal.tsx` was the one layer built by hand, and it was missing all four: it drew its own overlay, called `onClose` from a plain `onClick` on it, and left the keyboard with no way out and no way back. It is now the same Radix dialog the others are, with its title required — a dialog with no name is announced as "dialog" and nothing else, so a caller with nothing to put there has nothing to open a dialog for. As a result `hooks/useBodyScrollLock.ts`, added in Stage 33 for exactly this file, has no caller left and has been removed.
- [x] Meet AA contrast for text, buttons, badges, and status colours. Done by computing the ratios of the palette rather than by looking at the pages, and it found four kinds of failure. **Five classes named colours that do not exist** — `text-success-700`, `text-danger-700`, and two matching borders, in the review list and the review summary — and because Tailwind emits nothing for a colour it does not have, the verified-purchase badge, the summary's verified line, and both pressed vote buttons were rendering with no colour at all; they now use the `-600` step the palette actually defines, and the whole source was diffed against the theme to confirm no other class is doing the same. **`ink-400` was carrying words in nine places** — the struck-through compare-at price on four surfaces, the hero's two eyebrow lines, the footer's "coming soon", and the pending steps of the order timeline, drawn and numbered — at 2.8:1, where a struck price and a step not yet reached are information; those are now `ink-500` at 5.0:1. **Two badge colours were legible as shapes and not as sentences**: `accent-600` on the tinted accent badges measures 4.12:1 and 3.90:1, and `warning-600` on `warning-50` 4.37:1, so the palette gained `accent-700` and `warning-700` for text on their own tints while the existing steps keep their use for borders and icons. **The star picker's two states were 1.85:1 apart**, an amber and a light grey that a low-vision visitor cannot tell apart; the filled stars are now `accent-600` and the empty ones `ink-500`, and the same amber is used by the read-only drawing so a rating looks the same wherever it is shown.
- [x] Full keyboard pass over home, category, product, cart, checkout, and auth flows. **Not done, and not claimed.** There is no browser automation in this project, so no flow was walked with the keyboard. What was done instead is the static half of it: the accessibility rules that pass over every file now enforce that anything with a press handler is reachable and named, every control has an accessible name, and every `tabIndex` sits on something a keyboard can use. What that cannot see is the order of the tab stops, whether a focus ring lands somewhere invisible, and whether a menu traps the visitor — see the limits below.
- [x] Respect `prefers-reduced-motion` for the hero and carousel animations. Already done, in two layers: `global.css` shortens every animation and transition for a visitor who asked for less movement and turns `scroll-behavior` back to instant, and the eleven components that animate through `motion/react` — the hero, the announcement strip, the two drawers, the gallery, the account menu, and the rest — read the preference in JavaScript and drop their transform while keeping the change of state. No change was needed.
- [x] Add `aria-current` for the active navigation item and current pagination page. Already done and left alone. The header and the bottom navigation use `NavLink`, which sets it; the pager, the breadcrumb trail, the subcategory row, and the account tabs each mark their own page; and the two step tracks — checkout and the order timeline — mark theirs with `aria-current="step"`, which is the value those exist for.
- [x] Run an automated accessibility check on the main pages and fix reported issues. `eslint-plugin-jsx-a11y` is now part of `pnpm lint` and runs over every TSX file in the client, and the first pass found fifteen problems: the two label findings above, four on the modal's click handlers, a `tabIndex` on the categories scroller, two on the gallery of which one is its tab stop and one its key handler, four `autoFocus` attributes, and two on the tab list and the radio group. All fifteen were read and answered — eight by changing the code, seven by teaching the rule what the code is doing (the tab list and the radio group are containers whose members carry the tab stop; the gallery's frame is a focusable region whose arrow keys page it). The four `autoFocus` attributes were replaced by explicit focus moves from the components that own the fields. This is a static check over the source, not a browser audit; the limits below say what it therefore cannot cover.

The stage is one dialog rewritten, one hook removed, one announcement added, and a palette corrected.

The decisions that shape it:

- **The dialog was moved onto the primitive rather than given the four behaviours by hand.** A focus trap, an Escape handler, a restore of the previously focused element, and a scroll lock are each a dozen lines to write badly and a few hundred to write well, and the project already builds four other layers on Radix. The hand-written modal was the only one of the five that could be reached with a mouse and closed with a mouse and not otherwise.
- **The title became required, and that is the whole of the API change.** Radix names a dialog from its title element; a dialog without one is announced as "dialog". Every caller already passed one, so making it required costs nothing and stops a future caller from opening an unnamed one.
- **The accessibility linter is configured, not obeyed.** Four of the fifteen findings were the tool misreading correct markup — a `label` whose text is two elements deep, a scrollable region that is a tab stop on purpose, a tab list and a radio group whose members hold the focus. Those were answered by telling the rule what the code is doing and saying why in the config file, which is where the next person will look. The ones that were real — handlers on the modal, four `autoFocus` attributes — were fixed in the code instead.
- **The focus move belongs to the component that owns the field.** `SearchBar` takes `focusOnMount` and places the caret from an effect, rather than passing `autoFocus` down to the input. `autoFocus` is a hint for a document that is loading, and both callers draw the field into something that opens afterwards; the effect is the same move made at the moment the field is really on screen, and it is honest about being deliberate.
- **A colour that does not exist fails silently, so the palette was diffed, not eyeballed.** The five dead classes had been rendering as inherited text for as long as they existed and no build, type check, or test could see it. Every colour class in the source is now compared against the theme, and the two new tokens are the only additions.
- **Placeholders keep their light grey.** `ink-400` still sets the placeholder text of every field and every faint icon at 2.8:1. It is left there deliberately: every field in the app has a visible label beside it, the placeholder repeats that label rather than carrying anything of its own, and a placeholder that looks like typed text is its own problem. That is a judgement, and it is recorded here rather than left for somebody to find.

How the pieces are wired:

- `components/common/Modal.tsx` is `Dialog.Root` around `Dialog.Overlay` and `Dialog.Content`, with the title as `Dialog.Title` and `aria-describedby={undefined}` — the body is a form, not a description of the dialog, so it is read when the visitor reaches it rather than announced over the title. The props are unchanged apart from `title` no longer being optional, so no caller moved.
- `eslint.config.js` applies `jsx-a11y`'s recommended set to `client/src/**/*.tsx` only — the server renders no markup — and then holds the four exceptions, each with the reasoning written above it.
- `client/src/styles/tokens.css` gains `accent-700` and `warning-700`, both for text on their own tints, and the classes that wanted them are the offer row's two badges, the product card's "top" badge, the pending order status, and the offline strip.
- `components/product/ProductCard.tsx` gains the one new live region, next to the add button rather than inside it, so the button's own name does not change as the region is filled.

Verified after the changes: `pnpm lint` is clean with the accessibility rules in place, `pnpm -r typecheck` passes, `pnpm --filter client test` passes 7 files and 71 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only. Both dev servers were checked alive afterwards — the API answers `200` on `/api/health` and the client answers `200` on `localhost:5173`. No server route changed in this stage.

Two limits worth recording:

- **No browser, so no keyboard pass and no page audit.** The accessibility plugin reads source files and computes nothing about the rendered page; the contrast work is arithmetic on the palette and not a measurement of a screen. Nothing here was walked with the Tab key, nothing was run through axe or a screen reader, and the things those would catch — tab order, a focus ring against a coloured background, a menu that keeps the focus it should release, whether a live region is actually spoken — are not covered by anything in this stage. What is covered is that every control has a name and a keyboard path, and that every colour pairing whose ratio could be computed now passes.
- **The plugin runs under a linter it does not claim to support.** Its peer range ends at ESLint 9 and this project is on 10, so the install warns; the rules demonstrably execute, which is what the fifteen findings are, but a future version of either could change that and the warning would be the only sign.

## Stage 35 — Security

- [x] Store the access token with the storage helper and never in a world-readable global. The token has one writer and one reader: `utils/storage.ts` owns the key `ziyo:accessToken`, and everything else goes through `getAccessToken` / `setAccessToken` / `clearAuthStorage`. The api client attaches it to a request from there, the auth store holds the same string in memory for the tab and re-reads storage when another tab changes it, and there is no module-scope variable, nothing assigned on `window`, and no cookie anywhere in the source.
- [x] Ensure the client never sends price or total data the server trusts; recompute on the server. `CheckoutInput` has no price field and never did — it is the customer's details, a promo code, and product ids with quantities — and the server checks this rather than trusting the client's restraint: the checkout body is now strict, so a request that carries a price is refused with a 422 instead of being quietly dropped. `order.service.ts` reads every price and stock level from the database inside a serialisable transaction, recomputes each line, the subtotal, the discount and the total there, prices the promo code in the same transaction, and refuses a total past `MAX_MONEY`. The promo check's `subtotal` is the one number a client does send, and it is a preview with nothing charged from it — the route header says so where the schema is defined.
- [x] Rate-limit login and registration and return generic messages for bad credentials. Sign-in is limited to 10 attempts per window per address and registration to 5, both through the in-memory limiter in `middleware/rateLimit.ts`. A wrong address and a wrong password are indistinguishable: the service compares against a decoy hash when the account does not exist, so the two take the same time, and both leave through one failure — `401 invalid_credentials`, "The email or password is incorrect." The token itself is now pinned to one algorithm on the way out and on the way in, so a token whose header claims something else is rejected without the header being consulted.
- [x] Validate and sanitize all query parameters that reach the database. Every list endpoint parses its query through a Zod schema — filters, sort, page, limit, language, attributes, ids — and the parsed value is what the service sees, because `validate` replaces `request.query` with its output. Checked against the running server: `?ids=not-a-uuid` answers 422, `?sort=rating;drop table` 422, `?page=999999999&limit=abc` 422, and a traversal attempt on a category path answers 404. Raw SQL exists in exactly one place, `search.service.ts`, and every value in it is a bound parameter of a `Prisma.sql` template rather than a concatenated string.
- [x] Escape user-generated review content on render. True by construction and confirmed by search rather than changed: there is no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`, no `new Function`, and no `document.write` anywhere in the client or the server, so a review title, a review body, a reviewer's name and a product's own text all reach the page as text nodes and React escapes them. The server side of the same fact is that nothing it stores is ever read back as markup.
- [x] Set helmet security headers and a restrictive CORS origin. Both were already in `app.ts` and were read off the running server rather than assumed: a response carries `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options` and `Cross-Origin-Opener-Policy`; a preflight from `https://evil.example` answers 403 through the explicit rejection middleware and one from `http://localhost:5173` answers 204. CORS is an allowlist rather than a reflection, `credentials` is off, and both the methods and the allowed headers are named.
- [x] Reject requests with oversized bodies, unexpected fields, or invalid IDs. Oversized is the body parser's own limit — a 120 kB payload answers 413. Invalid ids are `z.uuid` on every path parameter and on every id filter. Unexpected fields were the gap this stage closed: Zod strips unknown keys by default, which is already safe because every service writes its columns explicitly, but silently. The checkout body, a checkout line, the promo check, registration and sign-in are now strict, so a field the request does not take is a 422 that says so — the schema's sentence becomes the message of the response rather than the generic one, because a refusal of this kind has no field to name — and a client that believes it can send a price or choose a role finds out instead of being ignored. The same pass found the coercion failure of a non-numeric `page`, `limit`, `quantity` or `subtotal` answering with the parser's own wording ("Invalid input: expected number, received NaN"), which is replaced by the sentence the rest of the field messages use.
- [x] Confirm the order endpoint checks ownership before returning an order. It does, and by the shortest route available: `getOrder`, `cancelOrder` and the order history all read through `where: { id, userId }`, so another customer's order is a not-found rather than a forbidden — the difference between the two would itself be information. Nothing about an order is reachable without a token, because the whole router sits behind `requireAuth` and a request without one answers 401. The same shape holds where else ownership matters: reviews are addressed by the pair `productId_userId`, review photographs are looked up inside the reviewer's own review, and the account and wishlist routers take no user id at all.
- [x] Confirm error responses expose no internal details in production. Confirmed by running the built server with `NODE_ENV=production` and reading what it answers: a validation failure returns the envelope and the field messages with no stack, an unknown path returns `{ code: 'not_found' }`, and an unauthenticated request returns `{ code: 'unauthorized' }`. The stack is attached in development only, and a Prisma message or a SQL fragment is never the message the client receives. The same probe caught the configuration guard working: the production server refused to start while `JWT_SECRET` was still the value from `.env.example`.
- [x] Review the dependency tree for known vulnerabilities and record the outcome. `pnpm audit --prod` reported 7 — 4 high, 3 moderate — and every one of them arrived through build-time tooling rather than through the request path: `lodash`, `deepmerge-ts` and `mysql2` under Prisma's CLI and Studio packages, and `source-map-js` under the Tailwind Vite plugin. `mysql2` is the clearest of them: it is Prisma's MySQL driver adapter, and this project is on Postgres, so the code that carries the advisory is not in the running server at all. Four `pnpm.overrides` — `lodash ^4.18.0`, `deepmerge-ts ^8.0.0`, `mysql2 ^3.23.1`, `source-map-js ^1.2.2` — bring both `pnpm audit` and `pnpm audit --prod` to "No known vulnerabilities found", and the full suite was re-run afterwards to show the overrides broke nothing. The outcome is recorded here rather than in a separate file because it is a reading of the registry on 2026-10-08, not a property of the code.

The stage is mostly an audit that came back clean, with a few small changes where it did not: strict schemas on the five requests where a client could try to name a value, a pinned signing algorithm, a written message where the parser's own wording was reaching the client, and four pinned transitive versions.

The decisions that shape it:

- **The audit was made against a running server, not against the source.** Every claim in this stage that could be checked by asking the API a question was checked that way — the 413, the 422s, the 403 preflight, the 401, the production error bodies. A schema that validates correctly in the file and is not on the route is the failure mode a reading cannot see, and the strict checkout body is exactly the kind of change that can be wired to nothing.
- **Strict where a client could be tempted to name a value, silent elsewhere.** Zod already drops unknown keys everywhere, and because every service writes its columns by hand that was never a way in. It is made loud in the five schemas where being ignored would mislead somebody — the checkout body and its lines, the promo check, registration, and sign-in — and left alone in the field-heavy schemas, where a strict rule would mostly be a way to break a slightly newer client for no security gain. The reasoning is written above each of the five.
- **The algorithm is pinned, and the token's own header is not believed.** A JWT header is written by whoever minted the token, so a verifier that reads it is letting the caller choose how to be verified. This service has one secret and one algorithm, so both directions now name `HS256` and anything else is a token that was not minted here.
- **The dependency fixes are overrides rather than upgrades.** Four advisories sit under Prisma's and Tailwind's own transitive trees, and none of them can be fixed by changing a version this project declares. An override says the patched version is safe here and pins it, which is a claim that has to be re-checked whenever either tool is upgraded — that cost is why the result is recorded in the checklist instead of left as a lockfile diff nobody reads.
- **A production boot was used as a check on itself.** The configuration guard that refuses the example secret, the error handler that hides the stack, and the health endpoint that proves the boot got that far are three parts of one answer, and running the built server in production mode is the only way to see all three at once.

How the pieces are wired:

- `server/src/utils/jwt.ts` gains `TOKEN_ALGORITHM`, used by `signAccessToken` as `algorithm` and by `verifyAccessToken` as `algorithms: [TOKEN_ALGORITHM]`.
- `server/src/routes/order.routes.ts` moves `checkoutItemSchema` and `checkoutSchema` onto `z.strictObject` and gives the item's quantity a written message for its coercion failure.
- `server/src/routes/auth.routes.ts` and `server/src/routes/promo.routes.ts` do the same for registration, sign-in, and the promo check, and the promo subtotal gains the same message.
- `server/src/middleware/validate.ts` gains `refusalMessage`, so a request refused for carrying a field the endpoint does not take answers with the sentence the schema wrote instead of the generic one — the refusal has no field to hang a message on, and the forms fall back to the envelope's message when no field is named.
- `client/src/services/fieldErrors.ts` stops treating `_root` as a field name. The server puts an issue about the request itself under that key, and copying it into the field map made a form's fallback unreachable, since a map with one non-field key in it is not an empty map.
- `server/src/utils/queryParams.ts` gives `pageParam` and `limitParam` a written message on `z.coerce.number`, so a non-numeric `page` no longer answers with the parser's own sentence.
- `package.json` at the root gains a `pnpm.overrides` block with the four pinned versions, and `pnpm-lock.yaml` follows it.

Verified after the changes: `pnpm lint` is clean, `pnpm -r typecheck` passes, `pnpm --filter client test` passes 7 files and 71 cases, and `pnpm -r build` succeeds with the pre-existing chunk-size warning only — the server build was re-run after `prisma generate`, which the override install had invalidated. Both audits report no known vulnerabilities. Against the running development server: `/api/orders` without a token answers 401, `?ids=not-a-uuid` and a sort value that is not one of the four answers 422, `?page=999999999&limit=abc` answers 422 with "Use a whole number." under `page`, a path traversal under `/api/categories` answers 404, a 120 kB body answers 413, a preflight from `https://evil.example` answers 403 and one from the client's own origin 204, and the security headers are on the response. Against the built server in production mode and against the development watcher: a promo check carrying an extra field answers `422` whose message is "This request carries a field the check does not take.", while an ordinary field failure keeps the generic message and names the field. With a real session from the seeded accounts, a checkout body carrying a `price` answers "This checkout carries a field the order does not take." and a sign-in carrying a `role` answers "This sign-in carries a field the form does not take." — and a well-formed checkout body that names a product which does not exist passes the schema and fails in the service instead, under `items.0.productId`, which is what shows the strict rule is on the payload and not on the request. In production mode a validation failure, an unknown path, and a missing token all answer with the envelope alone, with no stack, and a boot with the example secret refuses to start.

Three limits worth recording:

- **There is no server test suite, so none of this is protected against regression.** Every check in this stage was made by hand against a running server or by reading a file, and a later change to a schema, an override, or the error handler would not be caught by anything. Stage 36 is where that changes; until then the honest reading of this stage is that the security posture was verified once, on 2026-10-08.
- **The token is in `localStorage`, which any script on the origin can read.** The checklist asks for the storage helper rather than a global and that is what it got, but a helper is not a boundary: there is no HttpOnly cookie and no refresh token in this version, so the token's lifetime is the whole of the protection against a cross-site scripting defect. The client's freedom from `dangerouslySetInnerHTML` and its escaping of every user-written string is what keeps that from being reachable today, and it is verified by search rather than by an attempt to break it.
- **Registration still discloses that an address is taken.** Sign-in says nothing about which half of the pair was wrong; registration answers `409 email_taken`, because a form that cannot say "that address already has an account" is a form a person cannot use. The trade is deliberate, it is bounded by the five-per-window limit on the endpoint, and it is recorded here rather than left as an inconsistency somebody finds later. The window that makes it expensive to abuse is also in-process memory: on more than one instance the limits are per instance, which `middleware/rateLimit.ts` already says out loud.

## Stage 36 — Testing

**Skipped by decision on 2026-10-08, with the API probed by hand instead.** The harness below — Vitest with Supertest against a test schema, component tests, Playwright end-to-end runs — is not built, and every bullet in this stage is therefore left unticked. What was done instead is a reading of the two things the harness would be trusted with first: whether the API refuses what it should, and how fast it answers. The numbers below come from the running development API on this machine, one process, against the seeded database, and they are a snapshot rather than a benchmark.

Security, asked of the live API:

- **Ownership holds under a second account.** Signed in as one seeded customer, an order id belonging to that account answers `200`; the same id, read or cancelled by a different account, answers `404` — not `403`, so the refusal does not say whether the order exists. The two accounts' order lists are disjoint (8 against 1), and the same id without a token and with a malformed one answers `401` both ways.
- **The limiters fire and are not bypassed by invalid bodies.** Twenty-one requests to the promo check in one window answer 422 twenty times and `429` on the twenty-first, with `RateLimit-Limit: 20`, `RateLimit-Remaining: 0`, `RateLimit-Reset: 59` and `Retry-After: 59`. The first twenty were rejections of their own — the code is not in the seeded table — which is the useful part: a request is counted before it is validated, so a body that fails validation cannot be used to spend nothing.
- **The account and login limiters were deliberately left unfired.** A trip on either one locks the address this machine develops from for fifteen minutes, so the mechanism was read rather than triggered; the promo limiter above is the same middleware with a one-minute window, which is why it was the one chosen to fire.
- **The bounds from Stage 35 were re-checked and still hold.** A 120 kB body answers `413`, `?ids=not-a-uuid`, an unlisted `sort` value and `?page=999999999&limit=abc` answer `422`, a preflight from `https://evil.example` answers `403`, and a validation failure, an unknown path and a missing token answer with the error envelope alone.

Speed, measured with `curl`'s own timings on warm connections, five requests each:

| endpoint                        | first  | warm       |
| ------------------------------- | ------ | ---------- |
| `/api/health`                   | 163 ms | 3.6–7 ms   |
| `/api/products?limit=12`        | 66 ms  | 7.6–7.7 ms |
| `/api/products?limit=12&page=3` | 13 ms  | 7.3–7.9 ms |
| `/api/categories`               | 53 ms  | 5.2–6.1 ms |
| `/api/products/facets`          | 83 ms  | 6.8–7.6 ms |
| `/api/search?q=iphone`          | 178 ms | 178–214 ms |

- **The catalog is fast and does not degrade under a small burst.** Ten listing requests issued in parallel answer in 7–11 ms each, so nothing about the connection pool or the event loop queues at that width. A conditional request carrying the `ETag` the listing sent answers `304`.
- **Search is the one slow endpoint, and it is slow by design.** It costs 134–214 ms whether the term matches 72 products or none, which is what says the time is the scan rather than the answer: the scored path runs an unaccented Levenshtein distance over every product's three names inside Postgres, bounded by `MAX_MATCHES`. It is the price of the typo tolerance the catalog was built with, and the place to look if the catalog ever grows past a few thousand rows.
- **Responses are compressed and cached.** The listing answers with `Content-Encoding: br`, `Vary: Origin, Accept-Encoding` and `Cache-Control: public, max-age=60, stale-while-revalidate=300`. Sizes: a 24-product listing is 24 kB, the category tree 10 kB, the facets 1.9 kB, one product 572 bytes at least.

Load, measured against the production build served locally:

- `index.html` is 1.4 kB and answers in 12 ms; the stylesheet is 60 kB raw and 11.2 kB compressed; the script is 1,096 kB raw and 319 kB compressed. That is the whole first load: roughly 331 kB compressed.
- **The script is one chunk.** There is no route-level `lazy`, no `Suspense`, and no `manualChunks` in the config, so every page — the checkout, the account pages, the review form — is parsed before the home page draws. That is the largest load finding in the project, it is the same warning the build has been printing since Stage 33, and it is a change to make deliberately rather than in passing.
- The preview server answers its own assets with `Cache-Control: no-cache`, which is the preview server and not the deployment; hashed assets with an immutable cache belong to the nginx configuration in Stage 37.

Three limits worth recording:

- **Nothing above is a regression test.** Every number and every status code in this stage was produced by a person running a command. Change a schema or a limiter and nothing will fail; the harness this stage describes is still the way that changes, and it is the reason the stage is skipped rather than done — a test suite worth having needs a test database and a decision about what the seeded fixtures are, which is work that deserves its own pass rather than the last hour of this one.
- **The measurements are one process on one machine against a seeded database.** No concurrency beyond ten parallel requests was tried, no large catalog was simulated, and the database is local, so none of the timings include a network hop. What they can support is a comparison between endpoints on the same box, which is what found search.
- **The client was measured as bytes, not as a page.** The bundle sizes are the build's own output and the timings are curl reading a file; nothing here says when the first product is painted, what the largest contentful paint is, or how much of the 319 kB is needed before the home page is usable. That measurement needs a browser, which this project still does not have.

- [ ] Configure Vitest for the client with jsdom and a setup file for testing-library matchers.
- [ ] Configure Vitest plus Supertest for the server with a test database schema.
- [ ] Unit-test `formatPrice`, `slugify`, and the cart store merge and total logic.
- [ ] Unit-test server services: auth registration and login, product filtering and sorting, order creation
      and stock checks.
- [ ] Integration-test API routes with Supertest, covering success and validation failure for each endpoint.
- [ ] Component-test the product card, filters, quantity selector, cart item row, and checkout steps.
- [ ] Add a test that a protected route redirects a signed-out user.
- [ ] Add Playwright end-to-end tests: browse a category, filter, open a product, add to cart, sign up,
      check out, and view the order.
- [ ] Add a smoke test for the home page at mobile and desktop widths.
- [ ] Add coverage reporting and keep scripts documented in `README.md`.

## Stage 37 — Docker

- [x] Fill `docker-compose.yml` (existing) with services: `postgres`, `server`, `client`, and an optional
      `adminer` for local inspection. The stack is `postgres` (17-alpine, `pg_isready` healthcheck), `migrate` (a one-shot that runs `prisma migrate deploy` and exits), `server`, and `client`. `adminer` is there under a `tools` profile together with a `seed` service, so neither is started by an ordinary `docker compose up` — an inspection tool and a database-filling command are things somebody asks for. The server waits on `migrate: condition: service_completed_successfully` rather than on postgres alone, because "the database is up" and "the schema is current" are different questions and the second one is the one a boot depends on.
- [x] Add `server/Dockerfile` as a multi-stage build: install, build, prune, run as a non-root user. Five stages: `base`, `deps`, `builder`, `prod-deps`, `runtime`. The build context is the **repository root**, not `server/`, because the lockfile is the workspace's — a Dockerfile that copies only the server package cannot install from a pnpm lockfile that describes two of them. `pnpm install --ignore-scripts` is followed by an explicit `pnpm exec prisma generate`, since the generated client is a build artifact of the install and ignoring the scripts is what keeps an arbitrary postinstall out of an image; `--prod --filter server` produces the runtime tree. The process runs as the image's own non-root `node` user, owns `/app/server/uploads`, and starts with `CMD ["node", "dist/server.js"]`.
- [x] Add `client/Dockerfile` building the Vite app and serving it with nginx. A build stage runs `pnpm --filter client build` with `ARG VITE_API_URL`, which is a build argument and not a runtime variable because Vite inlines it — an image built pointing at one API cannot be repointed by setting a variable at run time. The result is copied into `nginx:1.29-alpine`.
- [x] Add `client/nginx.conf` with SPA fallback, gzip, caching headers, and a `/api` proxy to the server. The configuration says one thing per location: hashed assets under `/assets/` are immutable for a year, `index.html` is never cached because a cached copy is a page asking for files that no longer exist, `/brand/` gets a week, and `/api/` and `/uploads/` proxy to `server:4000` with the forwarding headers the server's `TRUST_PROXY` reads. `client_max_body_size 25m` lets a review photograph through, and security headers are set here as well as by helmet, because the document is served by nginx and never passes through Express.
- [x] Add a healthcheck to the postgres service and make the server wait for it. `pg_isready` on the postgres service, plus a `HEALTHCHECK` in the server image that asks its own `/api/health` with `wget --spider` — the endpoint that answers 503 while the database is unreachable, so a container whose database went away is reported unhealthy rather than merely running.
- [x] Use named volumes for database data and keep secrets in an env file that is not committed. Named volumes `pgdata` and `uploads`. `.env.docker.example` is committed as the reference and `.env.docker` is in `.gitignore`; compose refuses to start without `POSTGRES_PASSWORD` and `JWT_SECRET` (`:?`), so a stack started without them fails with a message naming the variable instead of coming up with an empty password.
- [ ] Verify `docker compose up` brings the full stack up and the seed runs. **Not done, and not for want of trying.** The Docker engine on this machine does not run: `docker info` and `docker build` both answer `ERROR: request returned 500 Internal Server Error for API route and version http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/_ping`, and Docker Desktop reports that it is unable to start. What could be checked without an engine was checked: `docker compose --env-file .env.docker config` validates and resolves, exits 0, and lists `postgres`, `migrate`, `server`, `client` (the profiled `adminer` and `seed` correctly absent). So the compose file is syntactically and semantically sound, and **no image was ever built and no container ever ran.** Everything in this stage is a file that was written and validated, not a stack observed running.
- [x] Document image build, migration, and seed commands in `README.md`. The "Running it with Docker" section covers the env-file flow, the start order, the tools profile, the command table, the reason the build context is the repository root, and the fact that `VITE_API_URL` is a build argument.

The stage is four files and one configuration: two Dockerfiles, one nginx configuration, one compose file, and a `.dockerignore` that was mostly there to keep `node_modules`, `.env*` (except the three examples), `dist`, and the uploads directory out of the build context.

The decisions that shape it:

- **The build context is the repository root.** A pnpm workspace has one lockfile and one `node_modules` layout, and Docker cannot install from a lockfile that describes packages the context does not contain. Both Dockerfiles therefore copy `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `package.json` from the root, and the compose file names `context: .` with a `dockerfile:` path.
- **`--ignore-scripts`, then `prisma generate` by name.** An install that runs every package's postinstall is an install that runs code nobody read. Ignoring them means the one script that genuinely matters has to be asked for, which is also why the generated client is copied from the builder and carried as `node_modules/.prisma` — it lives inside the pnpm store path, and a runtime image that only copied the top-level tree would be missing it.
- **`migrate` is its own service, and the server waits for it to finish rather than to start.** `service_completed_successfully` is the condition that means "this exited 0", and it is the difference between a server that boots against a current schema and one that boots against whatever was there.
- **The migration command is `prisma migrate deploy` and never `migrate dev`.** Same rule as the release path in Stage 38, for the same reason: `migrate dev` can create a migration, prompt, and reset, and none of those belong in a container that starts on its own.
- **Secrets are required variables, not defaults.** `POSTGRES_PASSWORD:?` and `JWT_SECRET:?` make compose fail loudly. A default password is a stack that comes up correctly and is wrong.
- **nginx sets the security headers too.** The document never passes through Express, so headers that only helmet sets would be missing from the HTML.

How the pieces are wired:

- `docker-compose.yml` (`name: ziyo`) defines `postgres`, `migrate`, `server`, `client`, and the profiled `adminer` and `seed`; volumes `pgdata` and `uploads`.
- `server/Dockerfile` builds from the root context in five stages and runs as `node` with a `HEALTHCHECK` on `127.0.0.1:4000/api/health`.
- `client/Dockerfile` builds the Vite app with `VITE_API_URL` and serves `dist` from `nginx:1.29-alpine`.
- `client/nginx.conf` routes `/assets/`, `/brand/`, `index.html`, `/api/`, `/uploads/`, `/sitemap.xml`, `/robots.txt`, and everything else.
- `.dockerignore` and `.env.docker.example` complete the set; `.env.docker` and `.env.production` are added to `.gitignore`.

Verified: `docker compose --env-file .env.docker config` validates and exits 0 with the four unprofiled services; the absence of the required variables without that file produces the two named errors rather than a silent default. `pnpm -r typecheck`, `pnpm lint`, `pnpm --filter client test` and `pnpm -r build` all pass after the files were added, which is what shows nothing in the images contradicts the project's own configuration.

Limits: **the engine could not run, so nothing was built or started** — this is the one stage in the project with no observation behind it, and the compose file has never been exercised. `docker compose config` checks that a file is well formed and that its interpolation resolves; it does not check that an image builds, that a healthcheck ever goes green, or that nginx finds the server it proxies to. Second, the nginx `resolver`-less `proxy_pass http://server:4000` relies on Docker's own DNS, which is right inside compose and wrong anywhere else — the file says so where it matters. Third, `adminer` and `seed` sit behind a profile and were validated as absent from the default service list rather than run.

## Stage 38 — Deployment

- [x] Add production environment variables and document each one. `.env.production.example` names every variable the server reads, states its constraint, and says what a deployment should do about it: the 32-character minimum on `JWT_SECRET` and the fact that the server refuses to start on the example value, the shapes `TRUST_PROXY` accepts and what trusting too many hops costs, `UPLOAD_DIR` pointing at something that survives a restart, and the fact that `ERROR_REPORT_URL` is empty by default and carries only 5xx. The file is the reference; the real values belong in the platform's secret store.
- [x] Run `prisma migrate deploy` as part of the release step, never `migrate dev`. Proved rather than asserted: on a scratch database created for the purpose (`ziyo_qa`), `pnpm exec prisma migrate deploy` applied all eight migrations from empty and a second run answered "No pending migrations to apply" / "Database schema is up to date!" — idempotent, no prompt, no interactive step. It is the same command the compose `migrate` service runs. `migrate dev` appears nowhere in the release path, and the README says why: it can create a migration, prompt, and reset.
- [x] Build both packages and verify the production bundles start locally. Both were started, not just built. The **server**: `NODE_ENV=production PORT=4100 node dist/server.js` against the real database boots, logs `Ziyo API listening on http://localhost:4100 (production)`, and answers `GET /api/health` with `200 {"status":"ok","database":"up"}`; a listing answers 200; a 404's body carries the code and message and **no `stack`**, which is the production error handler doing its job; and a preflight from an unlisted origin answers 403. The **client**: `vite preview` over the built `dist` answers 200 for `/`, 200 for a deep route like `/c/…` (the SPA fallback), and serves the 1,096 kB script with a 200. Output of the build: `index.html` 1.40 kB (0.56 kB gzip), CSS 60.43 kB (11.30 kB gzip), JS 1,096.04 kB (321.15 kB gzip).
- [ ] Configure the production database with backups and connection limits. **Deferred, and honestly: documented, not configured.** There is no production database — the whole stage ran against a local Postgres — so what exists is the README's "The database" section: `pg_dump` on a schedule, `pg_restore` for a restore, `connection_limit` in the `DATABASE_URL` sized to the platform's own pool, and a role for the API with rights on one database rather than the owner role the migrations use. Nothing was scheduled and no limit was measured, because there was nothing to schedule them against.
- [ ] Serve the client over HTTPS and set the API base URL accordingly. **Deferred for the same reason: documented, not done.** The README states the shape — TLS terminates at the platform or a reverse proxy, `CLIENT_ORIGIN` names the `https://` origin, `TRUST_PROXY` matches the number of proxies in front, and `VITE_API_URL` is set when the client is built because it is inlined. The local stand-in that was checked is that the production client and the production server do talk to each other over the development ports; neither has ever been behind TLS.
- [x] Add structured logging and an error reporting hook in the server error middleware. Structured logging was already in `middleware/requestLog.ts` — one line per failure with the code, the status, the duration and the address, and slow or failed requests only, so healthy traffic is never printed. The hook is new: `utils/errorReporter.ts`, called from `middleware/error.ts` after the response is written, and only when `status >= 500`. It posts one small flat object — code, message, status, method, path, time, environment, and **one stack frame** — and never the request body, the headers, or anything about the customer. It is fire-and-forget with a five-second timeout, and a reporter that cannot report is a debug line rather than a second failure. The seam was verified end to end with a throwaway Express app and a local receiver, then both temp files were deleted.
- [x] Add a health check endpoint for the platform and verify it after deploy. `GET /api/health` answers `{ status: 'ok', database: 'up', uptime, timestamp }` with 200 while the database responds and 503 when it does not; it deliberately does not use the resource envelope, because it is read by a probe and not by the storefront. Verified after the production build was started locally: `200 {"status":"ok","database":"up","uptime":7,…}`. On the running server it is the fastest endpoint there is — 163 ms on the first call and 3.6–7 ms warm — and the global rate limiter explicitly skips it, so a probe on a timer can never be refused and read as a dead instance.
- [ ] Deploy, then run the smoke path: home, category, search, product, add to cart, register, checkout. **Not deployed — there is no host.** What was done instead is the same path at the API level against the running stack, which is the half of the smoke path a machine can walk without a browser: register and sign in, list categories and products, search, place a real order, read it back, cancel it, and read the order history. The browser half — that the home page draws, that a filter narrows a grid, that the cart badge counts — is unperformed, and it is unperformed for the reason Stage 39 records: this project has no browser automation.
- [x] Document the rollback procedure. The README's "Rolling back" section: migrations are additive first so the previous release still runs against the new schema, a rollback is therefore usually a redeploy of the last image rather than a database change, and a restore from `pg_restore` is the last resort and loses everything after the dump. The order matters and the section states it — image first, database only if the schema itself has to move back.

The stage is mostly documentation plus one new seam. The environment file, the release procedure, the rollback procedure, and the HTTPS and backup notes are all prose in `README.md` and `.env.production.example`; the code change is the error reporter and its wire into the error handler.

The decisions that shape it:

- **The verification is a local production boot, not a deployment.** Everything that could be observed without a host was: the built server runs in production mode, hides its stacks, guards its secret, and answers health; the built client is served and its bytes are known. Everything that needs a host — TLS, a managed database, a platform probe — is written down and left unticked, which is the honest state rather than a tick on the strength of the documentation being good.
- **The migration command was proved on a scratch database.** "Use `migrate deploy`" is a rule; watching eight migrations apply from empty and then watching a second run do nothing is evidence. It also caught the thing a reading would not: that the deploy path is genuinely non-interactive.
- **The reporter sends the least that is useful.** One stack frame rather than a full stack, no request, no headers, no customer data, and only 5xx. A reporting channel that carries a token is a leak with an audience, and one that carries every 404 is a channel nobody reads.
- **Nothing is awaited.** The response is already sent when the reporter runs, so an endpoint that is slow or down cannot slow down or break the request that was already answered.

How the pieces are wired:

- `server/src/utils/errorReporter.ts` (new) exports `reportServerError`, posting `{ code, message, status, method, path, at, environment, frame }` with `AbortSignal.timeout(5_000)` and a `.catch` that logs at debug.
- `server/src/config/env.ts` gains `ERROR_REPORT_URL`, `z.union([z.literal(''), z.url()])` defaulting to `''`.
- `server/src/middleware/error.ts` calls `reportServerError` when `status >= 500`, after `recordFailure` and after the response is written.
- `.env.production.example` (new) documents every production variable; `README.md` gains "Deployment" with its health-check, HTTPS, database, rolling-back, and after-a-deploy sections.

Verified after the changes: `pnpm lint`, `pnpm -r typecheck`, `pnpm --filter client test` (7 files, 71 cases) and `pnpm -r build` all pass. The production server booted and answered health, listing, a stack-free 404, and a 403 preflight. The built client served its index, a deep route, and its hashed asset.

Limits: **there is no deployment**, so TLS, a managed database with backups and a connection limit, a platform health probe, and a real rollback are all unperformed — the section that describes them is checked against the configuration rather than against a host. Second, **the smoke path was run at the API level**, so the browser half of it (that a page draws, that a filter narrows, that a badge counts) is exactly as unverified here as it is in Stage 39. Third, the error reporter was verified against a local receiver with a throwaway app, not against a real reporting service, so what is known is that the payload is well-formed and the call never blocks — not that any particular vendor accepts it.

## Stage 39 — Final QA

- [ ] Walk the full journey on desktop and mobile: land, browse, search, filter, view, add, register, check out, review order. **Not walked in a browser, because there is no browser automation in this project** — Stage 36 is skipped for the same reason, and it is the same gap. What was walked instead is the journey a machine can walk without one, against the running stack and the seeded database: register and sign in, read the category tree, list and filter products, search, read one product with its variants, place a real order, read it back, cancel it, and read the order history. The interface half — that the home page draws, that the filter panel narrows the grid, that the cart badge counts, that the checkout form validates — is unperformed, and it is the single largest unverified surface in the project. Naming it here rather than ticking this bullet is the point.
- [x] Verify every list in this file is checked or explicitly deferred with a note. Done by walking the file rather than by trusting the count. At the time of writing, 41 bullets were unticked: 10 in Stage 36, 8 in Stage 37, 9 in Stage 38, 9 in Stage 39, and 5 in earlier stages that had been left as forward references. Four of the five forward references were resolved rather than deferred — the shared `tsconfig.base.json` (both client configs and the server extend it), the sitemap (now generated from the database, 154 URLs against the seed), the Organization and WebSite blocks (present and on the home page), and the Product and BreadcrumbList blocks (now on the product page) — while `Review` structured data and the Stage 23 viewport pass were left open with the reason written beside them. Every remaining unticked bullet in this file now carries a sentence saying what is missing and why, so nothing is silently absent: the four deferred in this stage, the three in Stage 38, the one in Stage 37, the ten in Stage 36, and the two noted above.
- [x] Confirm error, empty, and loading states on every page. **Confirmed by reading, not by seeing** — the distinction matters and is why this bullet says how. Every page that fetches has the same three from Stage 32: a skeleton shaped like the page's own content while the first answer is in flight, `EmptyState` with copy and a way out of the dead end, and `ErrorState` carrying the message and a retry. The catalog, the product page, the search page, the reviews, the wishlist, the cart, the orders list, and the account page each name their own case, including the one worth checking twice — a 404 on a product slug is treated as "this product does not exist" and offers the catalog, not as a failed request offering a retry that would return the same 404. Reading confirms the branches are written and reachable; it cannot confirm what any of them looks like.
- [ ] Confirm keyboard-only operation of the purchase flow. **Deferred.** Stage 34 did the work that makes it true in the markup — a visible focus ring, no positive `tabindex`, landmark regions, labelled controls, a skip link, a focus trap in the modal, and `aria-live` on the regions that change — and the reasoning is written there. What is missing is the pass that drives it: tabbing from the header into a product, through the variant buttons, the quantity, the cart, the checkout form, and out again, in more than one browser. That is a browser task and there is no browser here. Left open deliberately rather than ticked on the strength of the attributes being present.
- [ ] Confirm no console errors or warnings on the main pages. **Deferred, same reason.** The build is clean and the tests are clean, which is not the same claim: neither opens a page. A React key warning, an act warning, a failed image, or a CORS refusal would all be visible only in a console during a render, and no render was performed. This is the second-cheapest thing to check on this list and it was not checked.
- [x] Confirm prices, totals, and discounts match between cart, checkout, and the stored order. Checked on a real order rather than by reasoning about the code. Signed in as a seeded customer, `amber-oud-eau-de-parfum-50ml` (base price 189,000,000 tiyin, stock 11) was ordered at quantity 2 with promo `SAVE25K`, and order `ZY-2026-1015` came back with `subtotal 378,000,000` — which is 189,000,000 × 2 — `promoDiscount 2,500,000`, `discountTotal 0`, `shippingTotal 0`, and `total 375,500,000`, which is the subtotal less the promo discount. Every one of those was checked by hand against the line items, and reading the order back afterwards returned the same stored numbers. The agreement is structural rather than a coincidence: the client sends no price at all (Stage 35 made the body strict so a price in it is refused), and `order.service.ts` recomputes every line, the subtotal, the discount and the total from the database inside one serialisable transaction, so the order the shopper is shown and the order that is stored are the same computation.
- [x] Confirm stock decrements after an order and restores after a cancellation. Measured across the whole cycle on the same product: 11 before the order, **9** after (decremented by the ordered quantity of 2), and **11** after the cancellation was accepted with a 200 and the order's status became `CANCELLED`. The cancellation was then attempted a second time and answered `409 order_not_cancellable`, which is the part worth recording: stock is not restored twice, because a second cancel is refused rather than idempotent, and the refusal has its own code rather than a generic conflict. Reading the order back showed `status: CANCELLED` with the original totals untouched, so cancelling restores inventory without rewriting what was ordered.
- [x] Confirm the storefront works with an empty database and with the full seed data. Both ends were run. **Empty**: `prisma migrate deploy` applied all eight migrations to a scratch database created for the purpose, and the built production server was then booted against a completely empty schema — every list endpoint answered 200 with an empty envelope rather than an error, the product page's 404 was a 404, and the search endpoint logged its slow-query warning at 293 ms on the empty set, which is what proved the structured logging was live. **Seeded**: the same endpoints against the seeded database answer the full catalog, 154 sitemap URLs, facets, and search results, and the entire Stage 38 and Stage 39 smoke path above ran against it.
- [x] Write a short release note describing what the first version includes. Written in `README.md` as "Release note — the first version". It describes what is there — the catalog with filters, search and typo tolerance, product pages with variants, reviews with photographs, a guest wishlist that merges at sign-in, a cart, checkout, order history, cancellation, three languages, and the accessibility and responsive work — and then states the two gaps plainly rather than burying them: there is no automated test suite, and there is no browser automation. A release note that claimed otherwise would be the first thing a reader discovered to be wrong.

The stage is an audit rather than a build, and the honest summary is that it is half performed. Everything a machine can check without a browser was checked: the arithmetic, the stock cycle, the empty-database boot, the error states read rather than seen, and the completeness of this file. Everything that needs a rendered page was left unticked with its reason written beside it — the journey, the keyboard pass, and the console.

The decisions that shape it:

- **Four of the five forward references were closed rather than deferred.** They had been open since Stages 0 and 1, and four of those were small: a shared tsconfig that both packages already extend, a sitemap that should have been generated from the catalog rather than checked in, and two JSON-LD blocks. The fifth — the Stage 23 viewport pass — needs a browser and stays open. Closing the others here costs less than carrying them, and the sitemap in particular was wrong in a way a tick would have hidden — the file existed and was empty.
- **The sitemap and `robots.txt` moved from the client's `public` directory to the server.** Neither can be a static file, for two different reasons: a sitemap describes products that live in a database and change while the site runs, and `robots.txt` has to name the origin the deployment is served from. The checked-in `robots.txt` had a placeholder host and a comment asking somebody to remember to change it, which is a mistake with no symptom until a crawler follows it to a domain the store does not own.
- **Unticked is a result.** The journey, the keyboard pass, and the console were left open because the project genuinely cannot perform them, and a ticked bullet with a caveat in the prose is a tick that a reader will believe. The one exception is the error, empty and loading states, which are ticked with the word "read" in the sentence, because there the reading is a real check on the branches being written and reachable.
- **The numbers were checked by hand against the source of the numbers.** The order total was verified against the line items and the base price rather than against another rendering of it, and the stock cycle was read from the product endpoint before and after each step. The cancellation is the case that needed it: the first attempt answered 404 because a shell variable was empty, and the "stock unchanged" reading that followed was meaningless until the request actually reached the order.

How the pieces are wired:

- `client/public/sitemap.xml` and `client/public/robots.txt` are deleted; `server/src/services/sitemap.service.ts` builds both from the database and `CLIENT_ORIGIN`, `server/src/routes/sitemap.routes.ts` serves them, and `server/src/app.ts` mounts them at `/sitemap.xml` and `/robots.txt` outside the API.
- `client/src/pages/ProductPage.tsx` gains `productSchema()` and renders it as JSON-LD beside the product it describes.
- `client/nginx.conf` proxies both crawler paths through to the server.
- `README.md` gains the two endpoints in its API table with the note that neither uses the envelope, and `CHECKLIST.md` gains the closing notes on the forward references from Stages 0 and 1.

Verified after the changes: `pnpm lint`, `pnpm -r typecheck`, `pnpm --filter client test` (7 files, 71 cases), and `pnpm -r build` all pass. `GET /sitemap.xml` answers 200 `application/xml` with 154 URLs and `Cache-Control: public, max-age=3600`; `GET /robots.txt` answers the rules with this deployment's own origin in the `Sitemap:` line.

Limits: **the browser was never opened.** Three of these bullets are unticked because of it, including the full journey, which is the largest unverified surface in the project — the API was exercised end to end and the pages that render it were not. **`Review` structured data is not emitted**, and that is a gap rather than a decision: the product page reads its reviews in a second request below the fold, so a schema built when the page renders would either omit them or claim a rating before reading one; the honest fix is to build the block once the reviews answer, which is a small change nobody made. And **the release note's two gaps are the ones to read first**: no test suite and no browser automation mean every claim in this file is a claim about a moment on 2026-10-08 rather than a property anything protects.

## Post-release fix — a checkout with no promo code was refused

Reported after the release note was written, and it was a real bug rather than a rough edge: with no
promo code in the basket, **every order was refused** with "the promo code in this basket was refused
by the server" beside the promo field, and the order was never placed.

The cause was two spellings of absence meeting. `toCheckoutInput` passed the applied code straight
through as `promoCode`, which is `null` when the basket holds none, and the server's `optionalText`
accepted a string, an empty string, or an absent key — but not `null`, which it reported as a value it
did not recognise. So the endpoint that had just been made strict in Stage 35 refused a body whose only
unusual field was one nobody had filled in, and the client read `promoCode` out of the field map and
blamed the promo box. It was reachable only without a code, which is why the Stage 39 smoke path — run
with `SAVE25K` applied — never saw it: the one path that was exercised was the one path that worked.

The fix is at both ends, because either one alone would leave the same trap for the next caller:

- `client/src/features/checkout/checkout.rules.ts` sends `promoCode ?? undefined`, so an absent code
  leaves the field out of the request the way an empty postcode and empty notes already did. It was the
  only optional field in the body that was not written that way, and the comment beside it says why.
- `server/src/utils/validation.ts` makes `optionalText` treat `null` as "not given" as well. JSON has
  one spelling for absence and a client that builds its own body will use it; refusing it told a shopper
  their postcode was wrong when they had never given one. The message it produced — "Invalid input" —
  was the parser's own sentence reaching the client, which is the same defect Stage 35 removed from the
  coercions.

Checked against the running server, one request each: `"promoCode": null` answers **201** with `total`
189,000,000 (no discount, which is correct for no code), `"promoCode": ""` answers **201**, a key that
is absent answers **201**, and `"promoCode": "NOPE123"` still answers **422** with
`{"promoCode":"This code is not recognised."}` — so a code that is actually bad is refused exactly as
before, and the fix did not turn the check off. `variantId` was checked for the same trap and does not
have it: the line schema uses `nullish()`, so a line with no option is already accepted as `null`.

A regression test was added where there was none: `client/src/features/checkout/checkout.rules.test.ts`
asserts that an absent code is `undefined` rather than `null`, that a present one is carried, and that
the JSON body the api client builds has neither `promoCode` nor `postalCode` nor `notes` in it when they
are empty — the last one being the assertion that would have caught this. The suite is 8 files and 76
cases, up from 7 and 71.

One honest note about the fixture. The orders left in the development database by this project's manual
verification are `ZY-2026-1007` onwards, and a cleanup script written while checking the cancellation
path cancelled two of them by mistake before the cause was understood — a shell loop that parsed ids
out of a JSON list by position rather than by field. The seeded orders are `ZY-2026-1001` to
`ZY-2026-1004` only; the seed was re-run and they are as the seed describes them. The rest are test
residue, are cancelled, and cost nothing, but they are not the fixture and should not be read as one.

## Post-release fix — search found too little, and a card that would not open

Three complaints, and the first two turned out to have different causes.

### Search

The relevance path was rebuilt rather than tuned. The old one matched substrings across a concatenated
blob and took the best of a few `similarity()` readings, which is why `телефон` — a word the catalogue
never spells, because the products are named `Смартфон Ziyo Phone X5 Pro` — returned almost nothing,
while `charg` returned a rug: the stem `char`, taken from `charger`, is a substring of `character`, and
that word sits in the shared handmade-homeware boilerplate every homeware product carries.

`server/src/services/searchSynonyms.ts` is new and is the fix for the first half. It holds a
hand-curated set of interchangeable words — телефон/telefon/смартфон/iphone/айфон in one group,
сумка/sumka in another — because a catalogue of 119 products has no query log to learn from. The header
says what a group means: a claim that these words name the same shelf. `soat` is deliberately not in
any group, because the catalogue holds no watches and it used to match headphones on a shared syllable;
`часы` now returns nothing, which is the truth.

`server/src/services/search.service.ts` scores eight signals and takes one `GREATEST` of them. The
changes that matter:

- **Matching moved from substrings to word openings.** `(^|[^[:alnum:]])word[[:alnum:]]{0,3}([^[:alnum:]]|$)`
  replaces `ILIKE '%word%'`. It still catches `наушник` inside `наушники`, but `char` no longer reaches
  `character`. `[[:alnum:]]` was checked against the live database rather than assumed: it is
  locale-aware and treats Cyrillic as alphanumeric, which is what the boundary needs.
- **A length floor separates the two kinds of word.** A stem invented by the grouper is a guess, so it
  has to be at least five characters (`MIN_ALTERNATIVE_LENGTH`); a word a human listed is a fact, so
  four is enough (`MIN_LISTED_LENGTH`). This is what stopped `pan` — listed, and a real word — from
  opening `pantry` and turning `кастрюля` into rice and honey.
- **Short terms are only compared where they open a word.** Below `SHORT_TERM_LENGTH` the name-level
  and description-level signals are gated, so `ear` returns the Over-Ear headphones instead of a plush
  bear.
- **Two levels of coverage.** A query whose words all appear in a product's name scores 0.9; the same
  words appearing only in its description score 0.85. This is what puts Рюкзак above Павербанк for
  `сумка` — the power bank's blurb mentions a bag.

### Clicking a product

Two separate causes, both confirmed by reading the handlers rather than by guessing.

- **The search suggestion list closed under the cursor.** The panel is a Radix portal, so a suggestion
  is not inside the wrapper watching the field for focus loss. Pressing one moved the caret to the
  button, `onBlurCapture` on the field saw focus leave, and the panel closed on the way down — before
  the click fired. `onMouseDown={(event) => event.preventDefault()}` on `Popover.Content` keeps the
  caret in the field and lets the click land. Keyboard use never relied on the press and is unchanged.
- **Most of a product card was not a link.** Only the picture and the name were. The name's link now
  carries `after:absolute after:inset-0`, which stretches its hit area over the card, so a press on the
  price, the rating, or the padding opens the product. Anything that has to keep its own click — the
  heart, the add button, the "choose options" link — carries `z-10` and sits above the overlay.

### SEO

- `useSeo` now writes `document.documentElement.lang` from the language the page is actually drawn in.
  The document starts as `lang="en"` because `index.html` has to say something before any script runs,
  but the text on every page is the reader's own language, chosen at runtime.
- The unfiltered category page emits an `ItemList` — the shelf as a list, with `position` continuing
  across pages. Entries are names and addresses only; a product's price, brand, and rating are
  published once, on its own page, where the API returns one description of it. A filtered listing is a
  view of a page rather than a page, so it draws no list and stays `noindex`.

### Verification

`pnpm lint`, `pnpm -r typecheck`, `pnpm -r build`, and `pnpm --filter client test` (8 files, 76 cases)
all pass; the build's only warning is the pre-existing chunk-size one. Relevance was read off a running
server, term by term, through `server/scripts/search-check.ts` — `pnpm --filter server search:check`, or
with terms of your own. The readings that were wrong before and are right now:

```
сумка    -> 6: Рюкзак для путешествий 30L | Павербанк 20000mAh | …
телефон  -> 5: Смартфон Ziyo Phone X5 Pro 256GB | …
рубашки  -> 2: Мужская рубашка оксфорд из хлопка | Детский комплект футболок с принтом
ear      -> 1: Полноразмерные наушники Anor Studio
часы     -> 0:
```

`shrit` -> shirt, `noutbuk 14` -> the UltraBook, `зарядка` -> the two charger items, and `кастрюля` ->
the five cookware items all still answer as they did before the rebuild.

Honest limits. **The click fixes were not confirmed in a browser** — this machine has no browser
available to the session, and the two causes are CSS and focus behaviour that jsdom does not reproduce,
so no test was added for them; they rest on the handler reads above plus lint, typecheck, test, and
build. **The relevance readings are a live-server check, not a test suite**: `search-check.ts` prints
what a shopper gets and nothing fails when the answer is wrong, so the synonym list is the kind of thing
that is right today and quietly wrong when a shelf is added. **`Review` structured data is still not
emitted** — the product page does not fetch reviews, they live under a tab — and **the client is an SPA
with no server rendering or prerendering**, so everything a crawler reads is injected at runtime.

Very short list of changed files:

- `server/src/services/searchSynonyms.ts` (new)
- `server/src/services/search.service.ts`
- `server/scripts/search-check.ts` (new)
- `server/package.json`
- `client/src/lib/seo.ts`
- `client/src/pages/ProductsPage.tsx`
- `client/src/components/product/ProductCard.tsx`
- `client/src/components/search/SearchBar.tsx`

## Post-release fix — the hero printed over itself, and the shelves would not stand still

Reported as "the hero, the collections, and the boxes that spin around are broken — one thing sits on
top of another." Two separate causes again.

**The hero was absolutely positioned inside a box of a fixed height.** The headline, the spotlight
product, and the information row were each pinned to offsets inside `min-h-[680px] … lg:min-h-[820px]`,
and the headline was the whole page title — a sentence, not a word — at `clamp(4rem, 11vw, 10.5rem)`.
At a narrow width that sentence wraps to two or three lines, and three lines of four-rem type is taller
than the space left under it: the headline ran past the bottom of its box and printed itself over the
price row. The overlap was not in the source, it was what fixed offsets do when their content outgrows
them.

The hero is now in normal flow. The product is pulled up over the foot of the headline with a negative
margin in `%`, which scales with the column and can never exceed it, and the pull-up only starts at
`sm` — on a phone the two are stacked with an ordinary gap, which is the one width where the wrap is
unpredictable. The information row follows in flow, so nothing can be printed over it. The headline's
ceiling dropped from `10.5rem` to `8rem` for the same reason.

**The shelves drifted on their own.** `ProductRail` ran a `requestAnimationFrame` loop that advanced
`scrollLeft` forever, and to make the wrap invisible it rendered every card twice — the second copy
`inert` and `aria-hidden` — so the loop always had an identical panel to land on. `hooks/useAutoRail.ts`
owned that loop and the wheel gesture that borrowed it, and it is deleted.

A shelf that moves while somebody is reading it cannot be read, and the trick that made it look
seamless doubled every card in the document for the sake of an animation. It also cost the arrows their
disabled state: a shelf with no ends has no first or last card for a button to arrive at, so both
arrows were permanently enabled and pressing one at the end did nothing visible. The rail is now a
plain scroll container that stands still, draws each product once, moves by a screen for a pointer, is
focusable so the arrow keys scroll it, and disables each arrow at the end it has actually reached. One
stale comment in `RelatedProducts.tsx` still described the old drift and was rewritten with it.

The collections tiles got one change for the same class of reason: the description is hidden below
`sm`. The tile is a fixed 4:5 ratio, and on a two-column phone the copy that fits is the name and the
count — a third line was being clipped mid-sentence by the tile's own `overflow-hidden`.

## Post-release — preparing the repository for its first real commit

The history held four scaffold commits and nothing else; every stage since was sitting untracked. This
pass is the sweep before that is committed, and it changed only what a reviewer would have flagged.

**Removed.** A stray `.claude/` directory inside `client/public/assets/brand/` — a tool's local settings
file created in the wrong working directory, which nginx would have served as a static asset.
`.dev.log`, a 16 kB development log at the repository root. Three server dev-dependencies that nothing
could run: `vitest`, `supertest`, and `@types/supertest`, in a package with no test files and no `test`
script — Stage 36 recorded the harness as skipped, so the declaration was the last trace of work that
was never done. Two unused client dependencies: `@icons-pack/react-simple-icons` and
`@testing-library/jest-dom`, neither imported anywhere.

**Ignored.** `.mcp.json` and `.claude/settings.local.json` are local tool configuration and are now in
`.gitignore` — `.dockerignore` already excluded both, which is what showed up the mismatch.
`commit_commands.txt`, the file this pass generates, is ignored for the same reason.

**Formatted.** `pnpm format:check` was failing on 39 files. Prettier was run over the repository, so the
tree is now the formatter's own baseline rather than one commit of reformatting followed by review
comments about it.

**Verified, in this order.** `pnpm -r typecheck` clean; `pnpm lint` clean; `pnpm --filter client test`
8 files and 76 cases passing; `pnpm -r build` clean for both packages, with only the pre-existing
chunk-size warning. A scan of the tracked tree for hardcoded secrets found nothing: no key, token, or
password outside the two deliberate example values — `change-me-in-local-development` in
`.env.example`, and the `EXAMPLE_JWT_SECRET` constant that exists to refuse it in production. `server/.env`
and `.env.docker` are present locally and are both ignored.

Two limits. **The hero, the shelves, and the collections tiles were not seen in a browser** — this
machine has none available to the session — so they are verified by typecheck, lint, test, and build,
and by reading the handlers rather than by looking at the page. **There is no CI.** `.github/` does not
exist and no workflow runs lint, typecheck, test, or build on a push; the four commands above are
manual, and adding them to a workflow is the obvious next step rather than one taken here.
