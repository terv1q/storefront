import { getOgLocale, strings } from '@/i18n/strings';

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim();

/**
 * Site-wide SEO defaults. Pages override the title, description, and image
 * through the useSeo hook; the values here are the fallbacks.
 *
 * The fallback title and description are copy and live in the `i18n` tables, so
 * a crawler that fetches the page in Russian is handed a Russian description
 * rather than an English one under a Russian `lang`. `getSeoDefaults` is what
 * reads them; what is left here is the part that does not translate.
 */
export const seoConfig = {
  siteName: 'Ziyo',
  // Falls back to the current origin so preview and local builds emit usable URLs.
  siteUrl: (configuredSiteUrl || window.location.origin).replace(/\/+$/, ''),
  titleTemplate: '%s | Ziyo',
  defaultImage: '/assets/social/og-image.jpg',
  twitterHandle: '@ziyo',
};

/** The defaults that depend on the language the page is being read in. */
export function getSeoDefaults(): {
  defaultTitle: string;
  defaultDescription: string;
  locale: string;
} {
  return {
    defaultTitle: strings.seo.defaultTitle,
    defaultDescription: strings.seo.defaultDescription,
    locale: getOgLocale(),
  };
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${seoConfig.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}
