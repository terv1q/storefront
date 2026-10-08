import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { absoluteUrl, getSeoDefaults, seoConfig } from '@/config/seo';
import { useLanguage } from '@/i18n/strings';

export type SeoOptions = {
  title?: string;
  description?: string;
  image?: string;
  /** Canonical path, defaults to the current route. */
  path?: string;
  type?: 'website' | 'article' | 'product';
  noIndex?: boolean;
};

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.append(tag);
  }

  tag.setAttribute('content', content);
}

function setCanonical(url: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.append(link);
  }

  link.href = url;
}

/**
 * Applies page metadata to the document head. Existing tags are updated in
 * place, so routes never produce duplicate titles or social tags.
 *
 * The language is a dependency because the fallback title, the fallback
 * description, and `og:locale` are written in it: without it in the list, a
 * visitor who switched language would keep the head tags of the language they
 * arrived in.
 */
export function useSeo({
  title,
  description,
  image,
  path,
  type = 'website',
  noIndex = false,
}: SeoOptions = {}): void {
  const { pathname } = useLocation();
  const language = useLanguage();

  useEffect(() => {
    const defaults = getSeoDefaults();
    const pageTitle = title ? seoConfig.titleTemplate.replace('%s', title) : defaults.defaultTitle;
    const pageDescription = description ?? defaults.defaultDescription;
    const url = absoluteUrl(path ?? pathname);
    const imageUrl = absoluteUrl(image ?? seoConfig.defaultImage);

    document.title = pageTitle;
    // The language the page is actually written in. The document arrives as
    // English — that is what `index.html` says, and it has to say something
    // before any script runs — but this page is drawn in the reader's own
    // language, chosen at runtime. A crawler that reads `lang="en"` off a page
    // whose text is Russian reads the wrong thing about every word on it.
    document.documentElement.lang = language;
    setMeta('name', 'description', pageDescription);
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setCanonical(url);

    setMeta('property', 'og:type', type);
    setMeta('property', 'og:site_name', seoConfig.siteName);
    setMeta('property', 'og:title', pageTitle);
    setMeta('property', 'og:description', pageDescription);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:locale', defaults.locale);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', pageTitle);
    setMeta('name', 'twitter:description', pageDescription);
    setMeta('name', 'twitter:image', imageUrl);
    setMeta('name', 'twitter:site', seoConfig.twitterHandle);
  }, [title, description, image, path, pathname, type, noIndex, language]);
}
