/**
 * A horizontal shelf of products.
 *
 * Used three times on the home page — new arrivals, best rated, on sale — and
 * once more by the recommendations section, which passes its own cards rather
 * than products. It is written once because the four shelves differ only in what
 * they ask the API for.
 *
 * The shelf is a plain scroll container. A finger, a trackpad, the wheel, and the
 * keyboard all move it the way those gestures move any scrolling box, and the two
 * arrow buttons move it by a screen for a pointer that would rather not drag.
 *
 * It used to drift on its own and loop forever behind a second copy of every
 * card. That is gone. A shelf that moves while a shopper is reading it cannot be
 * read, and the trick that made the loop appear seamless — rendering the products
 * twice so the wrap always had an identical panel to land on — made every card
 * exist twice in the document for the sake of an animation. The arrows it needed
 * could never disable themselves either, because a shelf with no ends has no last
 * product to arrive at. A shelf that stands still has a first card and a last
 * card, and the arrows now say so.
 *
 * The products are drawn once. The skeletons are the same size as a card, so the
 * shelf does not change height when the products arrive, and the section reserves
 * that height rather than growing into it.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { SectionHeading } from '@/components/home/SectionHeading';
import { ProductCard, ProductCardSkeleton } from '@/components/product/ProductCard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { Product } from '@/types/product';

/** How wide a card is inside the track, and how many fit across a screen. */
const slideClass = 'min-w-0 flex-[0_0_72%] sm:flex-[0_0_42%] lg:flex-[0_0_29%] xl:flex-[0_0_23%]';

/** The scrollbar is hidden: the arrows and the drag are the shelf's own controls. */
const trackClass =
  'flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

const arrowClass =
  'grid h-11 w-11 place-content-center rounded-full border border-border bg-surface sm:h-9 sm:w-9 transition-colors hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const arrowDisabledClass = 'cursor-not-allowed text-ink-300 hover:border-border hover:text-ink-300';

/** How far the arrows move the shelf: one screen, so a press is a page-turn. */
const ARROW_SCREENS = 0.9;

/** Slack in pixels for "the shelf is at this end", which subpixel layout can leave short. */
const EDGE_SLACK = 2;

type RailProps = {
  /** Id the owning section labels itself with, and the heading points at. */
  headingId: string;
  title: string;
  /** One line under the heading, only where it explains where the shelf came from. */
  hint?: string;
  action?: { label: string; to: string };
  /** Announced once while the shelf loads, in place of the empty cards. */
  loadingLabel?: string;
  isLoading?: boolean;
  /** What the shelf shows when the request failed, and how to try it again. */
  errorMessage?: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

export function ProductRail({
  headingId,
  title,
  hint,
  action,
  loadingLabel,
  isLoading = false,
  errorMessage = null,
  onRetry,
  children,
}: RailProps) {
  const track = useRef<HTMLDivElement | null>(null);
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // A shelf with nothing to scroll is at both ends at once, which is what makes
  // both arrows disabled rather than one of them pointing at a card that is
  // already in view.
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const syncEdges = useCallback(() => {
    const node = track.current;

    if (node === null) {
      return;
    }

    const furthest = node.scrollWidth - node.clientWidth;

    setAtStart(node.scrollLeft <= EDGE_SLACK);
    setAtEnd(furthest <= EDGE_SLACK || node.scrollLeft >= furthest - EDGE_SLACK);
  }, []);

  useEffect(() => {
    const node = track.current;

    if (node === null) {
      return;
    }

    node.addEventListener('scroll', syncEdges, { passive: true });

    // The shelf has no width of its own that changes, but the number of cards in
    // it does, so a resize of the box is not enough on its own — the effect below
    // reads the edges again after every render for that half.
    const observer = new ResizeObserver(syncEdges);
    observer.observe(node);

    return () => {
      node.removeEventListener('scroll', syncEdges);
      observer.disconnect();
    };
  }, [syncEdges]);

  // Cards arriving, a breakpoint changing, a language switching: the ends are a
  // fact about the track's content as much as about its box, so they are read
  // again whenever anything under it has been rendered.
  useEffect(syncEdges);

  const turn = (screens: number) => {
    const node = track.current;

    if (node === null) {
      return;
    }

    node.scrollBy({
      left: screens * node.clientWidth * ARROW_SCREENS,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const arrow = (direction: -1 | 1) => {
    const disabled = direction === -1 ? atStart : atEnd;

    return (
      <button
        type="button"
        onClick={() => turn(direction)}
        disabled={disabled}
        aria-label={direction === -1 ? strings.home.railPrevious : strings.home.railNext}
        className={cn(arrowClass, disabled && arrowDisabledClass)}
      >
        {direction === -1 ? (
          <ChevronLeft aria-hidden="true" size={18} />
        ) : (
          <ChevronRight aria-hidden="true" size={18} />
        )}
      </button>
    );
  };

  return (
    <section aria-labelledby={headingId}>
      <SectionHeading id={headingId} title={title} hint={hint} action={action} className="mb-6">
        {/* The arrows sit at the end of the heading row rather than floating over
            the shelf, so they never cover a product and never move as it scrolls. */}
        <div className="flex items-center gap-2">
          {arrow(-1)}
          {arrow(1)}
        </div>
      </SectionHeading>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-card border border-border bg-surface-muted p-6 text-center"
        >
          <p className="text-sm text-ink-600">{errorMessage}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-control border border-ink-900 px-4 py-1.5 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
            >
              {strings.home.retry}
            </button>
          ) : null}
        </div>
      ) : (
        <div
          ref={track}
          // A labelled, focusable scroller, which is the pattern the W3C gives for
          // one: `role="region"` with a name is what makes the tab stop the right
          // kind of thing rather than a mystery stop, and the arrow keys then move
          // the shelf the way they move any scrollable box. This is the same shape
          // the category row uses.
          role="region"
          aria-label={title}
          tabIndex={0}
          className={trackClass}
        >
          {isLoading ? (
            <span role="status" className="sr-only">
              {loadingLabel ?? strings.loading.products}
            </span>
          ) : null}

          {/* `w-full` is what makes the card widths mean anything. A card is
              `flex-[0_0_29%]`, and a percentage flex basis resolves against the
              width of the flex container it sits in — which is this row. A row
              with no width of its own is sized by its content, so the percentage
              had nothing definite to resolve against, the browser fell back to
              the content width, and every card came out as wide as its own
              picture. Giving the row the width of the track makes the basis
              definite again. */}
          <div className="flex w-full shrink-0 gap-4">{children}</div>
        </div>
      )}
    </section>
  );
}

/** One product in a rail. */
export function ProductRailItem({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <div className={slideClass}>
      <ProductCard product={product} priority={priority} />
    </div>
  );
}

/** The shelf's loading state: empty cards the size of the real ones. */
export function ProductRailSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={cn(slideClass)} aria-hidden="true">
          <ProductCardSkeleton />
        </div>
      ))}
    </>
  );
}
