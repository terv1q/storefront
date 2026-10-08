/**
 * The trail above a page's heading.
 *
 * The last item is the page the visitor is on: it is text, not a link, and it
 * carries `aria-current="page"`. Everything before it is a link. The list is an
 * ordered list because the order is the meaning, and the `<nav>` is labelled so
 * it can be told apart from the header's other navigation.
 *
 * The same trail is published as `BreadcrumbList` structured data, built from
 * the same array, so the visible trail and the machine-readable one cannot
 * disagree. Positions are one-based and include the home entry, as the schema
 * requires.
 *
 * Callers pass the trail without the home entry; it is added here, because every
 * page in the store is under it.
 */

import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { absoluteUrl } from '@/config/seo';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

export type BreadcrumbItem = {
  label: string;
  /** Omitted for the page being viewed, which is not a link. */
  to?: string;
};

type Props = {
  /** The trail below the home entry, in order. */
  items: readonly BreadcrumbItem[];
  className?: string;
};

/** The trail with the home entry, which every page shares. */
function withHome(items: readonly BreadcrumbItem[]): BreadcrumbItem[] {
  return [{ label: strings.breadcrumbs.home, to: paths.home }, ...items];
}

export function Breadcrumbs({ items, className = '' }: Props) {
  if (items.length === 0) {
    return null;
  }

  const trail = withHome(items);

  return (
    <nav aria-label={strings.breadcrumbs.label} className={cn('min-w-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-600">
        {trail.map((item, index) => {
          const last = index === trail.length - 1;

          return (
            <li key={`${item.to ?? 'current'}:${item.label}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight aria-hidden="true" size={14} className="text-ink-400" />
              ) : null}

              {item.to && !last ? (
                <Link to={item.to} className="text-ink-600 no-underline hover:text-ink-900">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-medium text-ink-900">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <script type="application/ld+json">{JSON.stringify(structuredData(trail))}</script>
    </nav>
  );
}

/** The `BreadcrumbList` for a trail, with absolute URLs and one-based positions. */
function structuredData(trail: readonly BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.to ? { item: absoluteUrl(item.to) } : {}),
    })),
  };
}
