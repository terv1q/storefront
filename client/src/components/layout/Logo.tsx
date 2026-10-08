/**
 * The store mark, linked to the home page.
 *
 * The mark and the wordmark ship as separate files, and the compact header
 * swaps to the mark alone rather than scaling the lockup down, so the logo stays
 * legible at every width.
 *
 * Both files are SVG, so their intrinsic size is known before they load. The
 * width and height attributes below state that size, which lets the browser
 * reserve the box and keeps the header's height from changing when the image
 * arrives — the one shift a sticky header would otherwise pass on to the whole
 * page.
 */

import { Link } from 'react-router-dom';

import { siteConfig } from '@/config/site';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

type Props = {
  /** Uses the square mark instead of the horizontal lockup. */
  compact?: boolean;
  className?: string;
};

export function Logo({ compact = false, className = '' }: Props) {
  return (
    <Link
      to={paths.home}
      aria-label={`${siteConfig.name} — home`}
      className={cn('inline-flex shrink-0 items-center rounded-control', className)}
    >
      {compact ? (
        <img
          src="/assets/brand/logo-mark.svg"
          alt=""
          width={99}
          height={86}
          className="h-8 w-auto"
        />
      ) : (
        <img
          src="/assets/brand/logo-horizontal.svg"
          alt=""
          width={323}
          height={123}
          className="h-7 w-auto"
        />
      )}
      <span className="sr-only">{siteConfig.name}</span>
    </Link>
  );
}
