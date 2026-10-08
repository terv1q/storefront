/**
 * The sitemap, built from the catalog as it stands.
 *
 * A storefront's sitemap is a list of the URLs a search engine is welcome to
 * crawl, and the only two things on this site it should crawl are a product and
 * a category. Both are database rows with a slug, both change while the site is
 * running, and both are switched off rather than deleted — which is exactly why
 * the file is generated on request instead of checked in: a static file in
 * `client/public` cannot know which products are active today, and the one this
 * project shipped with was empty for that reason.
 *
 * What is deliberately absent: anything behind a session (the account, orders,
 * the wishlist), the search page, and the cart. A search engine that indexes
 * `?q=` URLs indexes an unbounded set of pages that are all the same catalog.
 * `robots.txt` already says the same thing, and a sitemap that contradicted it
 * would be arguing with itself.
 *
 * The origin comes from `CLIENT_ORIGIN`, which is the address the storefront is
 * served from and the only place this process is told what it is. When several
 * are listed the first is used, because a sitemap names one origin by
 * definition.
 */

import { allowedOrigins } from '../config/env.js';
import { prisma } from '../database/index.js';

/** How long a crawler may keep this answer. */
export const SITEMAP_CACHE_SECONDS = 3_600;

/** The XML escaping a slug or a URL cannot need but a rule should not assume. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** One `<url>` entry. `lastModified` is omitted when the row has no such column. */
function urlEntry(loc: string, lastModified?: Date): string {
  const lastmod =
    lastModified === undefined ? '' : `<lastmod>${lastModified.toISOString()}</lastmod>`;

  return `  <url><loc>${escapeXml(loc)}</loc>${lastmod}</url>`;
}

/**
 * Renders the sitemap for the current catalog.
 *
 * Two queries, both of them selecting a slug and nothing else — a sitemap does
 * not describe a product, it points at one. Inactive rows are excluded for the
 * same reason the catalog excludes them: a page a shopper cannot open is not a
 * page to submit.
 */
export async function buildSitemap(): Promise<string> {
  const origin = allowedOrigins[0];

  if (origin === undefined) {
    // `env.ts` refuses to start without at least one origin, so this is a type
    // narrowing rather than a state that can be reached.
    throw new Error('CLIENT_ORIGIN must list at least one origin.');
  }

  const base = origin.replace(/\/$/, '');

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: { sortOrder: 'asc' },
    }),
  ]);

  const entries = [
    urlEntry(`${base}/`),
    ...categories.map((category) => urlEntry(`${base}/c/${category.slug}`)),
    ...products.map((product) => urlEntry(`${base}/product/${product.slug}`, product.updatedAt)),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * `robots.txt`, with the sitemap's address filled in from the same origin.
 *
 * It used to be a file in the client's `public` directory, and it carried the
 * placeholder host `ziyo.example` with a comment asking somebody to remember to
 * change it. A deployment that forgot to would advertise a sitemap on a domain
 * it does not own — a mistake with no symptom until a crawler follows it. The
 * two facts in the file that are not rules are the origin and the sitemap path,
 * and both are known to this process.
 *
 * The disallowed paths are the ones behind a session or made of a query string,
 * which is the same set the sitemap leaves out. See `buildSitemap`.
 */
export function buildRobots(): string {
  const origin = allowedOrigins[0];

  if (origin === undefined) {
    throw new Error('CLIENT_ORIGIN must list at least one origin.');
  }

  const base = origin.replace(/\/$/, '');

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /cart',
    'Disallow: /checkout',
    'Disallow: /account',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /search',
    '',
    `Sitemap: ${base}/sitemap.xml`,
    '',
  ].join('\n');
}
