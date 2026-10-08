/**
 * The product's pictures.
 *
 * Four ways to look at the same set, for four ways of looking: a main frame with
 * a thumbnail strip under it, a magnifier for a pointer, a swipe for a finger,
 * and a full-screen view for somebody deciding on a detail.
 *
 * The magnifier is a second copy of the picture at twice the size, clipped by the
 * frame and positioned by where the pointer is. It is not drawn at all where the
 * pointer cannot hover, because a magnifier that only exists on a desktop is
 * better absent than broken — a touch screen has no hover to trigger it, and the
 * full-screen view is what serves the same need there.
 *
 * The swipe is a horizontal drag of more than a finger's width. The vertical
 * component is checked first and a mostly-vertical drag is left alone: that
 * gesture is the page scrolling, and a gallery that took it would trap somebody
 * mid-page who was only trying to read on.
 *
 * Arrow keys move the frame when the gallery has focus, the same way the buttons
 * do, and the same keys work inside the full-screen view. That view is Radix's
 * dialog, which supplies the focus trap, the scroll lock, Escape, and the return
 * of focus to the button that opened it.
 *
 * Nothing here switches with the chosen options. Variant rows carry a price
 * difference and a stock count and no picture of their own, so a colour cannot
 * change the frame — see the note in `variantSelection`. The gallery is the
 * product's photographs, which is what is stored.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, TouchEvent } from 'react';

import { Thumbnail } from '@/components/common/Thumbnail';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { ProductImage } from '@/types/product';

/** How far a finger has to move for a swipe to count, in CSS pixels. */
const SWIPE_DISTANCE = 45;

/** The magnifier's scale, and the size of the frame it draws into. */
const ZOOM_SCALE = 2;

const arrowClass =
  'grid h-11 w-11 place-content-center rounded-full border border-border bg-surface/90 text-ink-700 backdrop-blur transition-colors hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

type Props = {
  /** The product's images, already ordered. */
  images: readonly ProductImage[];
  /** The product's name, for the alternative text of every frame. */
  name: string;
};

export function ProductGallery({ images, name }: Props) {
  const hasPointer = useMediaQuery('(hover: hover)');
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  /** Where the pointer is, as a fraction of the frame. `null` when it is not over it. */
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const total = images.length;

  // A different product is a different set of pictures, and frame four of the
  // last one is not frame four of this one.
  useEffect(() => {
    setIndex(0);
  }, [images]);

  const step = useCallback(
    (delta: number) => {
      if (total === 0) {
        return;
      }

      setIndex((current) => (current + delta + total) % total);
    },
    [total],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!hasPointer) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();

    setZoom({
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    });
  };

  const onTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];

    touchStart.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    const touch = event.changedTouches[0];

    touchStart.current = null;

    if (start === null || touch === undefined) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;

    // Mostly vertical: the page is being scrolled, and the gallery keeps its
    // frame.
    if (Math.abs(dx) < SWIPE_DISTANCE || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }

    step(dx < 0 ? 1 : -1);
  };

  if (total === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-card border border-border bg-surface-muted">
        <p className="px-6 text-center text-sm text-ink-500">{strings.productPage.gallery.empty}</p>
      </div>
    );
  }

  const current = images[Math.min(index, total - 1)];
  const zoomed = hasPointer && zoom !== null;

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div
        role="region"
        aria-label={strings.productPage.gallery.label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setZoom(null)}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative overflow-hidden rounded-card border border-border bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <img
          src={current.url}
          alt={current.alt ?? name}
          width={1200}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="aspect-square w-full object-cover"
        />

        {/* The magnifier. Decoration drawn over the picture, so it is hidden
            from assistive technology; the frame it magnifies is what is read. */}
        {zoomed ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{
              backgroundImage: `url(${current.url})`,
              backgroundSize: `${ZOOM_SCALE * 100}%`,
              backgroundPosition: `${zoom.x * 100}% ${zoom.y * 100}%`,
            }}
          />
        ) : null}

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={strings.productPage.gallery.previous}
              className={cn(arrowClass, 'absolute top-1/2 left-3 -translate-y-1/2')}
            >
              <ChevronLeft aria-hidden="true" size={20} />
            </button>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label={strings.productPage.gallery.next}
              className={cn(arrowClass, 'absolute top-1/2 right-3 -translate-y-1/2')}
            >
              <ChevronRight aria-hidden="true" size={20} />
            </button>
          </>
        ) : null}

        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={strings.productPage.gallery.open}
          className={cn(arrowClass, 'absolute top-3 right-3')}
        >
          <Expand aria-hidden="true" size={18} />
        </button>

        {/* What the frame is, and where in the set it is. A live region, so a
            swipe or an arrow key that changed the picture is announced. */}
        <p
          role="status"
          className="absolute bottom-3 left-3 rounded-control bg-ink-900/70 px-2 py-1 text-xs font-medium text-white"
        >
          {strings.productPage.gallery.current(index + 1, total)}
        </p>

        {hasPointer ? (
          <p
            aria-hidden="true"
            className="absolute bottom-3 right-3 hidden items-center gap-1 rounded-control bg-ink-900/70 px-2 py-1 text-xs font-medium text-white lg:flex"
          >
            <ZoomIn aria-hidden="true" size={12} />
            {strings.productPage.gallery.zoomHint}
          </p>
        ) : null}
      </div>

      {total > 1 ? (
        <ul
          aria-label={strings.productPage.gallery.thumbnails}
          className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        >
          {images.map((image, position) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(position)}
                aria-label={strings.productPage.gallery.thumbnail(position + 1, total)}
                aria-current={position === index ? 'true' : undefined}
                className={cn(
                  'block rounded-control border p-0.5 transition-colors',
                  position === index ? 'border-brand-600' : 'border-border hover:border-ink-300',
                )}
              >
                <Thumbnail
                  src={image.url}
                  className="h-16 w-16 rounded-[inherit] sm:h-20 sm:w-20"
                  iconSize={18}
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <Dialog.Portal forceMount>
          <AnimatePresence>
            {lightboxOpen ? (
              <>
                <Dialog.Overlay asChild forceMount>
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-modal bg-ink-900/90"
                  />
                </Dialog.Overlay>

                <Dialog.Content
                  asChild
                  forceMount
                  aria-describedby={undefined}
                  onKeyDown={onKeyDown}
                >
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="fixed inset-0 z-modal grid place-items-center p-4"
                  >
                    <Dialog.Title className="sr-only">
                      {strings.productPage.gallery.label}
                    </Dialog.Title>

                    <img
                      src={current.url}
                      alt={current.alt ?? name}
                      className="max-h-[85vh] max-w-full rounded-panel object-contain"
                    />

                    <Dialog.Close
                      aria-label={strings.productPage.gallery.close}
                      className={cn(arrowClass, 'absolute top-4 right-4')}
                    >
                      <X aria-hidden="true" size={20} />
                    </Dialog.Close>

                    {total > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => step(-1)}
                          aria-label={strings.productPage.gallery.previous}
                          className={cn(arrowClass, 'absolute top-1/2 left-4 -translate-y-1/2')}
                        >
                          <ChevronLeft aria-hidden="true" size={20} />
                        </button>

                        <button
                          type="button"
                          onClick={() => step(1)}
                          aria-label={strings.productPage.gallery.next}
                          className={cn(arrowClass, 'absolute top-1/2 right-4 -translate-y-1/2')}
                        >
                          <ChevronRight aria-hidden="true" size={20} />
                        </button>

                        <p
                          role="status"
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-control bg-surface/90 px-3 py-1 text-xs font-medium text-ink-900"
                        >
                          {strings.productPage.gallery.current(index + 1, total)}
                        </p>
                      </>
                    ) : null}
                  </motion.div>
                </Dialog.Content>
              </>
            ) : null}
          </AnimatePresence>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
