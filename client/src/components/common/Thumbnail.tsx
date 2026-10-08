/**
 * A fixed-size image box that never changes size.
 *
 * Catalog images are the usual source of layout shift: until one loads, the
 * space it will occupy is unknown, so everything under it moves down when it
 * arrives. The box here has its size from CSS regardless of the image, and the
 * image fills it, so the surrounding layout is settled before the bytes are.
 *
 * A source that fails to load — a deleted asset, a blocked request, a URL the
 * catalog no longer serves — leaves the same box holding a muted placeholder
 * rather than a broken-image icon or a collapsed row. The component tracks that
 * itself, because nothing above it can know an image failed.
 */

import { ImageOff } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

type Props = {
  src?: string | null;
  /** Empty when the image repeats a name that is already next to it. */
  alt?: string;
  className?: string;
  /** Sizing of the placeholder icon, not of the box. */
  iconSize?: number;
};

export function Thumbnail({ src, alt = '', className = '', iconSize = 16 }: Props) {
  const [failed, setFailed] = useState(false);

  // A new source is a new attempt: without this, one failure would mark every
  // later image in the same reused slot as broken.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  const box = cn('grid shrink-0 place-content-center overflow-hidden bg-ink-100', className);

  if (!src || failed) {
    return (
      <span className={box} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
        <ImageOff aria-hidden="true" size={iconSize} className="text-ink-400" />
      </span>
    );
  }

  return (
    <span className={box}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
