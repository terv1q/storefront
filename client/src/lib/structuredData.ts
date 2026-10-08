/**
 * Structured data.
 *
 * The JSON-LD blocks that describe the store to a search engine. They are built
 * here rather than inside the pages that publish them, because the same values —
 * the site URL, the store name, the social accounts, the contact details — are
 * already in `config/site.ts` and `config/seo.ts`, and a second copy of them in a
 * page component is a copy that goes stale when the address changes.
 *
 * Only two shapes live here: the organisation and the site. The shapes that
 * describe a product, a breadcrumb trail, or a review belong to the pages that
 * render that data, and are added there.
 *
 * Every value is read from configuration, so a block can never claim an address,
 * a telephone number, or an account the store does not have. `sameAs` is built
 * from the social block, which is the same list the footer links to.
 */

import { seoConfig } from '@/config/seo';
import { getContactCopy, siteConfig } from '@/config/site';
import { getLanguage } from '@/i18n/strings';
import { paths } from '@/routes/paths';

/**
 * The store itself.
 *
 * `logo` and `url` are absolute, because a search engine reads this block
 * outside the page it came from: a relative path would be resolved against
 * whatever it is being read from, which is not this site.
 */
export function organizationSchema(): Record<string, unknown> {
  const contact = getContactCopy();

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/assets/brand/logo-horizontal.svg`,
    email: siteConfig.supportEmail,
    telephone: siteConfig.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: contact.address,
      addressCountry: 'UZ',
    },
    openingHours: contact.hours,
    sameAs: Object.values(siteConfig.social),
  };
}

/**
 * The site, and the one thing a search engine can do to it: search it.
 *
 * The search target is built from the same route and the same parameter the
 * search box uses, so a result that arrives through this template lands on a
 * page that understands its query.
 */
export function websiteSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: seoConfig.siteUrl,
    inLanguage: getLanguage(),
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${seoConfig.siteUrl}${paths.search}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
