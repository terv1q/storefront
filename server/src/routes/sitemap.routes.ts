/**
 * The two files a crawler asks for by name: `/sitemap.xml` and `/robots.txt`.
 *
 * They are mounted at the site root rather than under `/api` because they are
 * not resources the storefront asks for — they are files a crawler fetches at a
 * fixed address. The reverse proxy in front of this deployment passes both
 * paths through for the same reason.
 *
 * Neither uses the resource envelope: an XML document and a text file have one
 * shape each, and a crawler is not a client reading `{ data }`.
 */

import { Router } from 'express';

import { SITEMAP_CACHE_SECONDS, buildRobots, buildSitemap } from '../services/sitemap.service.js';

export const sitemapRouter = Router();

sitemapRouter.get('/', async (_request, response, next) => {
  try {
    const xml = await buildSitemap();

    response
      .status(200)
      .type('application/xml')
      .set('Cache-Control', `public, max-age=${SITEMAP_CACHE_SECONDS}`)
      .send(xml);
  } catch (error) {
    next(error);
  }
});

/**
 * `robots.txt`, from the same origin as the sitemap above.
 *
 * It lives here rather than in the client's `public` directory, which cannot
 * know the address the deployment is served from. See `buildRobots`.
 */
export const robotsRouter = Router();

robotsRouter.get('/', (_request, response) => {
  response
    .status(200)
    .type('text/plain')
    .set('Cache-Control', `public, max-age=${SITEMAP_CACHE_SECONDS}`)
    .send(buildRobots());
});
