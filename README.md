# Ziyo Storefront

Ziyo is a small ecommerce storefront: category browsing, search, a detailed product page, a
client-side cart, and a simple checkout. This repository is the pnpm monorepo holding both the
React storefront and the Express API.

## Layout

```
client/   React 19 + TypeScript + Vite (Tailwind 4, React Router 7, TanStack Query, Zustand)
server/   Node.js + Express 5 + TypeScript, Prisma 7, PostgreSQL
```

`client/src/` holds the routes, components, and the fetch-based API client. `server/src/` holds the
env validation, the Prisma client, the Express app, and the route modules. `server/prisma/` holds the
schema, the migrations, the seed data, and the asset generator.

## Requirements

- Node.js 20 or newer (developed on Node 24)
- pnpm 10
- PostgreSQL 16 or newer, running locally (developed on PostgreSQL 18)

## Setup

```bash
pnpm install
cp .env.example server/.env    # the server reads DATABASE_URL and the auth secrets from here
```

`server/.env` must point `DATABASE_URL` at a database the server can write to:

```
DATABASE_URL=postgresql://storefront:storefront@localhost:5432/storefront?schema=public
```

Create the role and database once, if they do not exist yet:

```bash
psql -U postgres -c "CREATE ROLE storefront LOGIN PASSWORD 'storefront' CREATEDB;"
psql -U postgres -c "CREATE DATABASE storefront OWNER storefront;"
```

Then apply the schema and load the sample data:

```bash
pnpm --filter server prisma:migrate   # prisma migrate dev
pnpm --filter server prisma:seed      # prisma db seed -> tsx prisma/seed.ts
```

## Development

```bash
pnpm dev          # client on http://localhost:5173, server on http://localhost:4000
pnpm typecheck    # tsc for both packages, including server/prisma
pnpm lint         # ESLint at the workspace root
pnpm format:check # Prettier check; pnpm format writes
pnpm build        # tsc + vite build for the client, tsc for the server
pnpm test         # Vitest in the client package; the API has no suite yet
```

## Running it with Docker

The whole stack — database, migrations, API, web server — is described in `docker-compose.yml` and
needs nothing installed but Docker.

```bash
cp .env.docker.example .env.docker      # then fill in POSTGRES_PASSWORD and JWT_SECRET
docker compose --env-file .env.docker up --build
```

The storefront is then on `http://localhost:8080`. `.env.docker` is ignored by git; the two required
values have no default, and the compose file refuses to start without them.

What starts, in order: `postgres` (waits until `pg_isready` answers), `migrate` (applies every pending
migration and exits), `server` (starts only once the migration container has exited successfully), and
`client`. Two named volumes hold what has to outlive a container: `pgdata` for the database and
`uploads` for review photographs.

Two more services exist behind a profile, because neither is something a stack should do on its own:

```bash
docker compose --env-file .env.docker --profile tools run --rm seed   # load the sample catalog
docker compose --env-file .env.docker --profile tools up -d adminer   # inspect the database
```

Adminer answers on `http://localhost:8081`; the seed refuses to run against a database that already
holds orders, in the sense that it is a deliberate command rather than something `up` decides to do.

Commands worth knowing:

| Command                                                  | What it does                                                        |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| `docker compose --env-file .env.docker up --build`       | Build both images and start the stack                               |
| `docker compose --env-file .env.docker build server`     | Build the API image alone (installs, compiles, prunes)              |
| `docker compose --env-file .env.docker build client`     | Build the storefront image alone (compiles, then serves with nginx) |
| `docker compose --env-file .env.docker run --rm migrate` | Apply migrations again, without starting the rest                   |
| `docker compose --env-file .env.docker logs -f server`   | Follow the API log                                                  |
| `docker compose --env-file .env.docker down`             | Stop the stack, keeping both volumes                                |
| `docker compose --env-file .env.docker down -v`          | Stop the stack **and delete the database and the photographs**      |

The images are built from the repository root rather than from `server/` or `client/`, because a pnpm
workspace resolves its dependency tree from the lockfile and the workspace file at the top. `.dockerignore`
keeps the build context to the source that is actually needed: no `node_modules` copied from the host,
no `.env`, no build output, no uploaded photographs.

`VITE_API_URL` is a **build argument**, not an environment variable: Vite writes it into the bundle.
The default is `/api`, which is the path nginx serves and proxies itself, so the browser reaches the
API on the same origin it loaded the page from and there is no cross-origin request to configure. A
deployment that keeps the API on its own hostname passes its address when building:

```bash
docker compose --env-file .env.docker build --build-arg VITE_API_URL=https://api.example.com client
```

## Deployment

The production configuration is documented in `.env.production.example`, which is the reference for
every variable the API reads. The two that have no safe default are `DATABASE_URL` and `JWT_SECRET`;
the server refuses to start in production while the secret still holds the value from `.env.example`,
or is shorter than 32 characters.

A release is four steps, in this order:

1. **Build the images.** Both are built from the repository root, as above. Tag them with the commit
   they came from — the tag is what a rollback names.
2. **Apply the migrations.** `prisma migrate deploy`, never `migrate dev`: the deploy form applies the
   migrations in `server/prisma/migrations` and never invents a new one, which is the only form safe to
   run without a person watching. The compose stack does this in the `migrate` service, before the API
   starts. Against a managed database it is one command:

   ```bash
   DATABASE_URL=… pnpm --filter server prisma:migrate:deploy
   ```

3. **Start the new containers** and let the platform route traffic once the health check passes.
4. **Run the smoke path** (below) against the deployed address.

Nothing migrates when the API boots. That is deliberate: a rollback is then a change of image rather
than a change of database, and a container restart cannot quietly alter a schema.

### Health check

`GET /api/health` answers `200` while the database responds and `503` when it does not, so a platform
probe can tell a running-but-broken instance from a stopped one:

```bash
curl -i https://api.example.com/api/health
```

The body names the database state, the uptime in seconds, and the time of the answer. Point the
platform's readiness check here, and check it by hand after every deploy — a green pipeline over a
container that cannot reach its database is the failure this endpoint exists to catch.

### HTTPS and the API address

TLS terminates in front of the API, at the platform's load balancer or at nginx. Two consequences:

- `CLIENT_ORIGIN` must be the `https://` origin the browser uses, because the API compares the
  request's `Origin` against it. A mismatch is a storefront whose every request is refused by CORS.
- `TRUST_PROXY` must be the number of proxies actually in front of the process, so the rate limiter
  counts the visitor rather than the proxy. See the comment on the variable for the three shapes it
  accepts; trusting more hops than exist lets a caller forge its own address.

A certificate is the platform's business or, on a plain server, certbot's:

```bash
certbot --nginx -d shop.example.com -d api.example.com
```

The API itself speaks plain HTTP and expects to be behind something that terminates TLS.

### The database

Two things belong to the deployment rather than to this repository, and both are the difference
between an incident and a bad afternoon:

- **Backups.** Take a nightly `pg_dump` and keep more than one generation, off the machine the database
  runs on:

  ```bash
  pg_dump --format=custom --file=ziyo-$(date +%F).dump "$DATABASE_URL"
  ```

  Then **restore one** into a scratch database and run a migration against it. A backup nobody has
  restored is a file, not a backup.

- **Connection limits.** Each API instance holds a pool, so the ceiling is
  `instances × pool size` and it has to stay under the database's `max_connections`. Postgres reserves
  some connections for superusers and replication; a managed database often caps the number far below
  its default. For more than a couple of instances, put a pooler (PgBouncer) in front and give the API
  a small pool each.

### Rolling back

The code is rolled back by deploying the previous image tag. The database is not rolled back that way,
which is why migrations are written to be additive first: a new column is nullable or has a default,
and the release that starts using it comes after the release that added it. A migration in this
repository follows that rule.

If a release has to be undone after a migration that cannot be left in place:

1. Deploy the previous image. The API tolerates a column it does not know about.
2. Restore the database from the dump taken before the release:

   ```bash
   pg_restore --clean --if-exists --dbname="$DATABASE_URL" ziyo-YYYY-MM-DD.dump
   ```

3. Re-deploy the image that matches the restored schema, and run `prisma migrate status` to confirm
   the database and the migrations agree.

`prisma migrate resolve` marks a migration as applied or rolled back without running it. It is for the
case where a migration failed halfway and has to be recorded by hand; it is not a way to undo one.

### After a deploy

The smoke path, in the order a visitor walks it. It is the same list Stage 39 records, and it takes
about two minutes by hand:

```bash
BASE=https://api.example.com
curl -sf $BASE/api/health                                  # 200, database up
curl -sf "$BASE/api/products?limit=3"                       # the catalog answers with items
curl -sf "$BASE/api/products/facets"                        # the filter counts answer
curl -sf "$BASE/api/categories"                             # the category tree answers
curl -sf "$BASE/api/search?q=phone"                         # search answers
curl -s -o /dev/null -w '%{http_code}\n' $BASE/api/orders   # 401 without a token
```

Then, in a browser: the home page draws its rails, a category page filters, search suggests, a product
page adds to the cart, registration creates an account, checkout places an order, and the order appears
in the account. Each of those exercises a different quarter of the stack, which is why the list is
short and not exhaustive.

The Vite dev server proxies `/api` to the server on port 4000, so the client uses relative URLs.

## API

Every endpoint answers with `{ data, message? }` on success and
`{ error: { code, message, details } }` on failure. A validation failure is a 422 whose
`details.fields` is a `{ field: message }` map.

| Method   | Path                          | Auth   | What it does                                          |
| -------- | ----------------------------- | ------ | ----------------------------------------------------- |
| `GET`    | `/api/health`                 | —      | Reports the process and database status               |
| `POST`   | `/api/auth/register`          | —      | Creates an account and returns a session              |
| `POST`   | `/api/auth/login`             | —      | Exchanges credentials for a session                   |
| `GET`    | `/api/auth/me`                | Bearer | Returns the signed-in account                         |
| `GET`    | `/api/products`               | —      | Paginated product list with filters and sorting       |
| `GET`    | `/api/products/featured`      | —      | The featured row on the home page                     |
| `GET`    | `/api/products/:slug`         | —      | One product with images, variants, specs, and brand   |
| `GET`    | `/api/products/:slug/related` | —      | Products from the same category, then the same brand  |
| `GET`    | `/api/products/:slug/reviews` | —      | Paginated approved reviews for one product            |
| `GET`    | `/api/categories`             | —      | The category tree, nested, with product counts        |
| `GET`    | `/api/categories/:slug`       | —      | One category with its children and breadcrumbs        |
| `GET`    | `/api/search`                 | —      | Ranked product search, paginated                      |
| `GET`    | `/api/search/suggestions`     | —      | Up to 8 product, brand, and category suggestions      |
| `POST`   | `/api/orders`                 | Bearer | Places an order from the basket                       |
| `GET`    | `/api/orders`                 | Bearer | The signed-in account's orders, newest first          |
| `GET`    | `/api/orders/:id`             | Bearer | One order belonging to the signed-in account          |
| `POST`   | `/api/orders/:id/cancel`      | Bearer | Cancels a pending or confirmed order, restoring stock |
| `GET`    | `/api/wishlist`               | Bearer | The saved products, newest first                      |
| `POST`   | `/api/wishlist`               | Bearer | Saves a product, or returns the existing entry        |
| `DELETE` | `/api/wishlist/:productId`    | Bearer | Removes a saved product                               |
| `GET`    | `/sitemap.xml`                | —      | The catalog as a sitemap, built from the database     |
| `GET`    | `/robots.txt`                 | —      | Crawler rules, naming this deployment's own origin    |

The last two are not under `/api` and do not use the envelope: they are files a crawler
fetches at a fixed address, so they answer XML and text. Both are generated from the database
and from `CLIENT_ORIGIN`, which is why neither is a file in the client's `public` directory —
a checked-in sitemap can only ever describe the seed it was written against, and a checked-in
`robots.txt` cannot know the address the site is served from.

A session is `{ user, tokens: { accessToken, tokenType, expiresIn } }`. Send the access token as
`Authorization: Bearer <token>`. There is no refresh token in this version: an expired token means
signing in again.

### Product list

`GET /api/products` answers with the standard paginated envelope
`{ items, total, page, pageSize, totalPages }`.

| Parameter   | Values                                                                   |
| ----------- | ------------------------------------------------------------------------ |
| `category`  | Category slug. A top-level slug also returns its subcategories' products |
| `q`         | Matches the name, the short description, or the brand name               |
| `brand`     | Brand slug                                                               |
| `minPrice`  | Lowest price in tiyin                                                    |
| `maxPrice`  | Highest price in tiyin                                                   |
| `minRating` | 0 to 5, fractions allowed                                                |
| `inStock`   | `true` or `false`                                                        |
| `onSale`    | `true` or `false`. True means the compare-at price is above the price    |
| `sort`      | `featured`, `price_asc`, `price_desc`, `rating`, `newest`                |
| `page`      | 1 or higher, default 1                                                   |
| `limit`     | 1 to 60, default 24                                                      |

An empty parameter means the same thing as an absent one, so a filter form can submit its empty
fields. Prices are integer tiyin, as everywhere else. `pageSize` echoes the `limit` that was applied.

### Search

`GET /api/search` answers with the same paginated envelope. It matches a term against the product
name, the short description, and the brand name, and orders the matches by how close they are to the
term, then by rating, then by id — so the same query always returns the same page in the same order.
The `q` parameter and `page` and `limit` behave as above; `sort` is optional and, when given, ranks by
the catalog's own ordering instead of by relevance.

A term shorter than two characters, including an empty one, returns an empty page without querying
the database. A blank `q` is not an error: a shopper who cleared the search box has not made a
mistake.

`GET /api/search/suggestions?q=` answers with `{ items: [ { type, label, slug, imageUrl } ] }`, where
`type` is `product`, `brand`, or `category`, and never more than eight items: up to four products,
then up to two brands, then up to two categories. A product suggestion also carries `price`,
`compareAtPrice`, and `currency`; a brand and a category leave all three absent, because a brand and a
category have no single price and a zero would read as a free item.

Both endpoints are backed by the PostgreSQL `pg_trgm` extension and GIN trigram indexes. The
extension is created by migration `20260918050259_search_trigram_indexes`.

### Orders

All order endpoints need a bearer token and only ever see the signed-in account's own orders. Another
account's order is a 404, not a 403, on both reading and cancelling.

`POST /api/orders` takes the delivery details and a list of lines:

```json
{
  "customerName": "Oybek Karimov",
  "customerEmail": "oybek.karimov@ziyo.uz",
  "customerPhone": "+998 90 123 45 67",
  "country": "Uzbekistan",
  "city": "Tashkent",
  "street": "Amir Temur 1",
  "postalCode": "100000",
  "notes": "Leave at the door",
  "deliveryMethod": "COURIER",
  "paymentMethod": "CASH",
  "items": [{ "productId": "…", "variantId": null, "quantity": 2 }]
}
```

`deliveryMethod` is `COURIER` or `PICKUP` and defaults to `COURIER`; pickup is free and courier
delivery adds a flat 25 000 so'm. `paymentMethod` is `CARD` or `CASH` and defaults to `CARD`. Lines
are validated with the same rules as the checkout form: quantity is 1 to 99, at most 50 lines, and
the same product sent twice is merged into one line.

Prices and stock are never taken from the request. The server reads them and prices the order in the
same transaction that writes it, so a client that sends its own price is simply ignored. A line whose
product is missing, inactive, or short of the requested quantity fails with a 422 naming that line,
for example `items.2.quantity`: `Only 3 left in stock.` A rejected checkout leaves no order behind
and takes no stock.

Stock cannot be oversold: each line is decremented with a conditional update that matches only while
enough stock remains, so two shoppers racing for the last units produce one order and one 422.
Cancelling is allowed while the order is `PENDING` or `CONFIRMED`; it restores the stock exactly once
and answers 409 `order_not_cancellable` otherwise, so a second cancel cannot restore the stock twice.
`GET /api/orders` pages with `page` and `limit` (1 to 50, default 10), newest first.

An order is `{ id, orderNumber, status, subtotal, discountTotal, shippingTotal, total, currency, …,
items: [{ name, unitPrice, quantity, lineTotal, productSlug, imageUrl }] }`. Money is integer tiyin
throughout; `total` is `subtotal + shippingTotal`, and `discountTotal` records what the basket saved
against the compare-at prices — it is already reflected in `unitPrice`, so it is not subtracted
again. `orderNumber` reads `ZY-<year>-<sequence>`, starting at 1001.

### Wishlist

`GET /api/wishlist` returns `{ items: [ { id, createdAt, product } ] }`, newest first, where
`product` is the same summary a catalog card uses. `POST /api/wishlist` takes `{ "productId": "…" }`,
answers 201 with the new entry, and answers 200 with the existing one when the product is already
saved. `DELETE /api/wishlist/:productId` answers 204, or 404 when the product is not on the list.
Adding a product that does not exist or is no longer for sale answers 404, and a product deactivated
after it was saved drops out of the list.

Environment variables the server reads are listed in `.env.example`. `JWT_EXPIRES_IN` accepts a
number of seconds or a value such as `15m`, `12h`, or `7d`. `ADMIN_EMAILS` is a comma-separated
allowlist for admin-only routes and is empty by default. `CLIENT_ORIGIN` is the CORS allowlist and may
list several origins separated by commas; development also accepts any `localhost` or `127.0.0.1`
origin, and a production server refuses to start while `JWT_SECRET` is still the example value.

`LOG_LEVEL` decides how much the server prints, and defaults to `info`. At that level it writes what
somebody has to act on: a boot, a shutdown, a refused request, a failure, a request that took longer
than 500 ms, and any query slower than 200 ms. A request that answered without incident prints
nothing — a log of healthy traffic is a log nobody reads. `LOG_LEVEL=debug` adds every request and
every SQL statement, and `silent` turns the console off entirely, which is what a test run uses.

### Request handling

Every request is checked before it reaches a route.

| Check          | Behaviour                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| Content type   | A body that is not JSON answers `415`. Requests with no body — `GET`, a plain `DELETE` — are untouched |
| Body size      | Bodies above `100kb` answer `413`                                                                      |
| Malformed JSON | A body the parser cannot read answers `400`                                                            |
| Unknown route  | An unknown `/api/…` path, or a known path with an unsupported method, answers `404` as JSON            |
| CORS           | Only the `CLIENT_ORIGIN` origins (plus localhost in development) are allowed                           |
| Rate limit     | Login, registration, and checkout are limited; see below                                               |
| Authentication | Anything under `/api/orders` and `/api/wishlist` needs a bearer token                                  |

Login is limited to 10 attempts per address per 15 minutes, registration to 5, and checkout to 20 per
account. A limited request answers `429` with a `code` of `too_many_login_attempts`,
`too_many_registrations`, or `too_many_orders`, a `Retry-After` header, and `details.retryAfter` in
seconds. Limits are counted in the API process, so they are per instance.

Error responses are the same `{ error: { code, message, details } }` shape everywhere. Only failures
the API raises itself carry a written message; anything unexpected is reduced to a status and a
generic message. A stack trace is attached in development only.

CORS allows `Content-Type` and `Authorization` as request headers, caches preflight responses for a
day in production and ten minutes in development, and does not enable credentials: authentication is a
bearer token, so the browser never needs to send a cookie.

## Client data layer

The client reads the API through one layer of modules, and no page talks to `fetch` or to TanStack
Query directly.

| Module                                | What it holds                                                               |
| ------------------------------------- | --------------------------------------------------------------------------- |
| `client/src/services/api.ts`          | The only `fetch` wrapper: base URL, bearer token, JSON parsing, `ApiError`  |
| `client/src/services/queryKeys.ts`    | Every query key, so a query and its invalidation cannot disagree            |
| `client/src/services/queryOptions.ts` | Freshness per resource, cache lifetime, and the retry policy                |
| `client/src/features/*/*.api.ts`      | One request per endpoint, unwrapping `{ data }` and nothing else            |
| `client/src/features/*/*.queries.ts`  | Query and mutation hooks: keys, cache settings, and invalidations           |
| `client/src/hooks/useProducts.ts`     | The catalog hooks pages consume, with plain loading, error, and empty flags |

Catalog data is cached per resource: a product list stays fresh for two minutes, a product for five,
the featured row and related products for ten, and the category tree for thirty. A failed request is
retried only when it never reached the server or came back as a server error; a `401`, `404`, `409`,
`422`, or `429` is passed straight to the page.

Mutations invalidate what they changed: saving to or removing from the wishlist refetches the
wishlist, and placing an order refetches the wishlist, the order list, and the catalog, because stock
has moved. Signing in seeds the session cache from the response; signing out clears storage and the
whole cache.

`client/src/hooks/useDebouncedValue.ts` is the debounce used by search, and
`client/src/hooks/useMediaQuery.ts` subscribes to a media query for the layout decisions CSS cannot
express.

## Header and navigation

The storefront shell is the announcement strip, a header, the page, the footer, and — below the large
breakpoint — a fixed bottom navigation bar. The desktop header and the mobile header are never
rendered at the same time, so each owns its own open state and neither has to coordinate with the
other.

| Piece                            | What it does                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `layout/AnnouncementBar.tsx`     | Rotating promo messages and the region selector, with a dismissal that a version bump expires |
| `layout/Header.tsx`              | Desktop rows: mark, catalog trigger, search, wishlist, account, cart, then the category bar   |
| `layout/MobileHeader.tsx`        | The same destinations in one compact row, with search as a panel                              |
| `layout/HeaderCatalogButton.tsx` | The catalog trigger and the full-screen overlay it opens                                      |
| `search/SearchBar.tsx`           | The search field and its panel; the header, the drawer, and the search page all render it     |
| `search/SearchSuggestions.tsx`   | The panel itself: products with prices, brand tags, categories, or the recent terms           |
| `layout/AccountMenu.tsx`         | Sign in and register for a guest; account, orders, and sign out for a session                 |
| `layout/CartButton.tsx`          | The count badge and the mini-cart preview                                                     |
| `layout/CategoryNav.tsx`         | The category bar and the mega menu its panels open into                                       |
| `layout/MobileMenu.tsx`          | The slide-in drawer: search, the category accordion, account links, and the region selector   |
| `layout/Breadcrumbs.tsx`         | The trail above a page's heading, with `BreadcrumbList` structured data                       |
| `layout/MarketSelect.tsx`        | The region and currency control, shared by the strip and the drawer                           |
| `layout/MobileBottomNav.tsx`     | Home, catalog, wishlist, cart, and account, with live counts                                  |

The cart lives in one Zustand store, `client/src/features/cart/cart.store.ts`, persisted through
`client/src/utils/storage.ts`. The header badge, the mini-cart, the bottom bar, and the cart page read
the same store through `client/src/hooks/useCart.ts`. The region choice lives in
`client/src/features/market/market.store.ts` for the same reason: it is offered in two places and two
copies would disagree.

### Search

One field serves every place a shopper can search: `client/src/components/search/SearchBar.tsx` is
rendered by the desktop header, the mobile panel, the drawer, and the search page. The drawer is the
only caller that leaves out the scope selector, because it has no room for one.

The panel shows one of two lists and never both. A term long enough to search gets the matches,
grouped into products with a thumbnail and a price, then brand tags, then categories. An empty field
gets the terms this visitor searched before, kept in `client/src/features/search/recentSearches.ts`
and capped at eight, with a control to drop one term and another to clear them all. Terms are written
on submit and on following a suggestion, never on typing alone.

Typing is debounced, and rapid typing is handled twice over: the query is keyed by the term, so a
response that arrives late is cached under the term it belongs to and cannot appear under the term
that replaced it, and the query for the replaced term is cancelled, which aborts the request that was
still in flight. Cancellation leaves the cache entry in place, so returning to a term costs nothing.

Both menus open on hover where the pointer can hover, and always open on click, which is what a button
receives from Enter and Space. Escape closes them, a click outside closes them, focus returns to the
trigger, and the catalog overlay holds Tab inside itself while it is open. Dismissing the announcement
stores the version of the message set rather than a flag, so raising `siteConfig.announcement.version`
brings the strip back without clearing anything else.

### Interface libraries

Four libraries carry the interface work, so a component describes what it is and not how the browser
does it.

| Library                   | Role                                                                        |
| ------------------------- | --------------------------------------------------------------------------- |
| `lucide-react`            | Every icon. No component hand-writes an `<svg>`                             |
| `@radix-ui/*`             | Every overlay: dialogs, dropdown menu, popovers, navigation menu, accordion |
| `motion`                  | Arrivals and departures, imported from `motion/react`                       |
| `clsx` + `tailwind-merge` | Conditional classes, through `client/src/lib/cn.ts`                         |

Focus trapping, Escape handling, scroll lock, focus restoration, and dismissal on an outside press
belong to the primitives rather than to hooks in this project; the drawer and the catalog overlay are
Radix dialogs, the account menu is a dropdown menu, the cart preview, the search suggestions, and the
mobile search panel are popovers, and the category bar is a navigation menu. `client/src/lib/cn.ts`
registers the store's own scale names — `z-header`, `rounded-control`, `max-w-page`, `px-page-x`,
`text-display-sm` — with `extendTailwindMerge`, without which the merge would read them as unknown
classes and keep both sides of a conflict. `.overlay-panel` in `client/src/styles/global.css` makes a
panel grow from the trigger that opened it by reading the transform origin the primitive publishes,
and the global `prefers-reduced-motion` rule removes the travel for anyone who asked for less of it.

## Database commands

All commands run from the repository root through the server package. Prisma 7 does not read `.env`
on its own for a project with a `prisma.config.ts`, so `server/prisma.config.ts` loads it before the
CLI connects; the runtime client gets the same URL through the pg driver adapter.

| Command                                      | What it does                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `pnpm --filter server prisma:migrate`        | `prisma migrate dev` — create and apply a migration from the current schema                      |
| `pnpm --filter server prisma:migrate:deploy` | `prisma migrate deploy` — apply pending migrations without prompting                             |
| `pnpm --filter server prisma:status`         | `prisma migrate status` — show which migrations are applied                                      |
| `pnpm --filter server prisma:seed`           | `prisma db seed` — run `tsx prisma/seed.ts`                                                      |
| `pnpm --filter server prisma:reset`          | `prisma migrate reset` — **drop the schema, re-apply every migration, and run the seed**         |
| `pnpm --filter server prisma:validate`       | `prisma validate`                                                                                |
| `pnpm --filter server prisma:format`         | `prisma format` — rewrite `schema.prisma` in canonical form                                      |
| `pnpm --filter server prisma:generate`       | `prisma generate` — regenerate the typed client after a schema edit                              |
| `pnpm --filter server prisma:photos`         | Download the catalog photography from Wikimedia Commons into `client/public/assets`              |
| `pnpm --filter server prisma:assets`         | Draw the SVG placeholder artwork under `client/public/assets`, as a fallback for `prisma:photos` |

`prisma:reset` destroys local data. It is the intended way to get back to a known state: it drops the
`schema.prisma` objects, replays every migration in `server/prisma/migrations`, and then runs the seed
against the empty schema.

### Catalog photography

The seed stores paths such as `/assets/products/cast-iron-dutch-oven.jpg`; the file behind each path is
put there by `prisma:photos`, which searches Wikimedia Commons for every product, category, and gallery
image and downloads the best photograph it finds. It is resumable, it takes roughly nine minutes for
the full catalog, and it needs no API key:

```bash
pnpm --filter server prisma:photos                 # everything that is missing
pnpm --filter server prisma:photos -- --force      # re-download what is already there
pnpm --filter server prisma:photos -- --only=category --force
pnpm --filter server prisma:photos -- --dry        # search only, write nothing
```

Every download is recorded in `client/public/assets/photos-credits.json` with its author and licence.
Almost everything on Commons is CC BY, CC BY-SA, or public domain; the first two require attribution
wherever the picture appears, so that file is the record a credit line has to be built from rather
than an optional extra. `prisma:assets` draws SVG placeholders for the same paths instead, which is
what an offline machine or a catalog whose new products have not been photographed yet needs;
`ARTWORK_EXTENSION` in `server/prisma/seed-data.ts` decides which of the two the storefront reads.

### Seeded data

The seed is deterministic and idempotent — running it twice leaves the same rows — and it loads:

- 8 top-level categories with 26 subcategories in total
- 6 brands
- 120 products, each with at least one image, and specifications for all of them
- variants for 40 of the products
- 3 accounts (password `ziyo1234`): `oybek.karimov@ziyo.uz`, `nilufar.rashidova@ziyo.uz`,
  `sardor.tursunov@ziyo.uz`
- 4 orders with 10 order items, three of them belonging to Oybek
- 217 reviews on the products with the highest review counts

Money is stored as an integer number of tiyin (1 so'm = 100 tiyin). `server/prisma/seed-data.ts`
holds the catalog in so'm and converts once through `toTiyin`.

Product photographs do not exist in this repository, so `server/prisma/generate-assets.ts` draws one
deterministic SVG per product, category, and brand. Both the seed and the generator read
`seed-data.ts`, which is what keeps the stored paths and the files on disk in step. Replace the SVGs
with real images, keeping the filenames, and nothing else has to change.

## Release note — the first version

Ziyo is a working storefront. Everything a shopper does, from landing on the home page to reading the
order they placed, goes through the real API against a real database; there is no page in it that draws
placeholder data.

**What it does.** A visitor lands on a home page with a hero, category chips, a deals row, and product
rails, and can browse the whole catalogue by category, filter it by price, brand, rating, colour, and
availability, and sort it four ways. Search answers as they type with grouped suggestions, keeps a
local record of what they have looked for, and tolerates a misspelling. A product page carries a
gallery, specifications, reviews with photographs and helpful votes, a size and colour picker where a
product has options, and a "notify me" form for what is out of stock. The cart survives a reload and a
sign-out; the wishlist works before registration and merges into the account at sign-in. Checkout takes
the customer's details, applies a promo code the server prices itself, re-checks stock inside a
transaction, and writes an order the account can then follow through its status. Everything is in Uzbek,
Russian, and English, and everything works on a phone, down to 320 pixels.

**What it is built on.** React 19, TypeScript, Vite, Tailwind 4, TanStack Query, Zustand, and React
Router on the client; Express 5, Prisma 7, and PostgreSQL on the server. The API is documented by its
own README sections above: envelope-shaped responses, per-field validation errors, rate limits per
address and per account, and a shell hardened with helmet, an origin allowlist, a body-size ceiling, and
ownership checks on everything a customer can read. The whole stack runs from one `docker compose up`.
`/sitemap.xml` and `/robots.txt` are generated from the catalog and from the deployment's own origin
rather than checked in as files, and a product page carries `Product` and `BreadcrumbList` structured
data built from what it renders.

**What is deliberately not in it.** Payment: checkout records an order and takes no money, which is what
`paymentMethod` describes rather than does. A refresh token: a session is one signed JWT, and an expired
one is handled by signing in again. A currency switch: the market selector is wired but holds one
market, so every price is UZS. Email: the newsletter form and the stock notification store an address
and send nothing. Bestsellers and flash offers: the catalogue cannot rank by sales, so those two
navigation entries are absent rather than faked.

**How it was checked.** The API was exercised by hand against a running server at every stage, and the
runs are recorded in `CHECKLIST.md` — the ownership checks against a second account, the rate limiters
fired and observed, the validation failures, the production error bodies, the response times, the
bundle sizes. Two things are recorded there as not done: there is **no automated test suite** worth the
name (Stage 36 is deferred in full, with its scope written down), and there is **no browser automation**,
so the keyboard walkthrough, the rendered accessibility audit, and the visual checks are readings of the
source and of the API rather than sessions in a browser.

**Where to go next.** Stage 36 of `CHECKLIST.md` is the harness: Vitest and Supertest on the server with
a test schema, component tests on the client, and Playwright over the purchase flow. It is the first
thing missing, because it is what stops everything above from being verified once and trusted forever.

The mega menu has no brand column and the quick-link row lists no Bestsellers or Weekly Flash Offers,
because the catalog cannot answer either: `/api/products` accepts a brand slug but no endpoint returns
the set of brands, and there is no sales-count sort to rank bestsellers by. Both are one entry in
`client/src/config/navigation.ts` once the data exists.

The region selector is config-driven but not yet a currency switch: `siteConfig.markets` holds one
market, so every price is already in UZS. Adding a second entry to that list is what turns the
selector into a real choice.
