/**
 * The catalog trigger and the overlay it opens.
 *
 * The trigger is a Radix dialog trigger, so `aria-expanded`, `aria-controls`,
 * `aria-haspopup`, the focus trap, the Escape key, the body scroll lock, and the
 * return of focus to the trigger on close all come from the primitive rather
 * than from code here. Being a real button, it also takes the click that Enter
 * and Space produce, so the overlay is reachable without a pointer.
 *
 * The icon is the two lucide glyphs a shopper already reads as "menu" and
 * "close", crossfaded and rotated by the same animation library as the rest of
 * the interface. The swap is skipped when the visitor asked for reduced motion.
 *
 * The overlay is a full-screen panel over a blurred backdrop. It closes on
 * Escape, on a click outside the panel, on its own close button, and on
 * navigation — the last one through the path, because a browser Back or a
 * redirect does not go through a link's handler.
 *
 * The categories come from the Stage 13 query layer, so the overlay shows the
 * real tree. Stage 15 adds the mega menu; the trigger, the overlay behaviour,
 * and the accessibility around them stay as they are.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { LayoutGrid, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Skeleton } from '@/components/common/Skeleton';
import { Thumbnail } from '@/components/common/Thumbnail';
import { useCategoryTree } from '@/hooks/useProducts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

type Props = {
  className?: string;
  /**
   * `header` is the bordered button in the top row. `nav` is the stacked icon
   * and label used by the bottom navigation, which has no room for a border.
   * Only one of the two is ever rendered, since each lives at a different
   * breakpoint, so they do not share state.
   */
  variant?: 'header' | 'nav';
};

const triggerClass = {
  header: 'h-10 border border-border px-3 hover:border-ink-300 hover:bg-ink-100',
  nav: 'flex-1 flex-col gap-1 px-1 py-1 text-xs',
} as const;

/** The label is dropped first when the row runs out of space. */
const labelClass = {
  header: 'hidden sm:inline',
  nav: '',
} as const;

export function HeaderCatalogButton({ className = '', variant = 'header' }: Props) {
  const [open, setOpen] = useState(false);

  const { categories, isLoading, isError, errorMessage } = useCategoryTree();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // A link inside the panel closes it, but a browser Back or a redirect does
  // not go through the link's handler, so the path is watched too.
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={open ? strings.header.closeCatalog : strings.header.openCatalog}
        className={cn(
          'inline-flex items-center gap-2 rounded-control text-sm font-medium text-ink-800 transition-colors',
          triggerClass[variant],
          className,
        )}
      >
        {/* Both glyphs occupy the same cell, so the swap moves nothing. */}
        <span className="relative grid h-4 w-4 shrink-0 place-content-center">
          <AnimatePresence initial={false} mode="wait">
            <motion.span
              key={open ? 'close' : 'open'}
              initial={reduceMotion ? false : { opacity: 0, rotate: open ? -90 : 90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: open ? 90 : -90 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute inset-0 grid place-content-center"
            >
              {open ? (
                <X aria-hidden="true" size={16} />
              ) : (
                <LayoutGrid aria-hidden="true" size={16} />
              )}
            </motion.span>
          </AnimatePresence>
        </span>
        <span className={labelClass[variant]}>{strings.header.catalog}</span>
      </Dialog.Trigger>

      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open ? (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-drawer bg-ink-900/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed inset-0 z-drawer overflow-y-auto overscroll-contain"
                >
                  <div className="mx-auto max-w-page px-page-x py-6">
                    <div className="rounded-panel bg-surface p-6 shadow-overlay">
                      <div className="flex items-start justify-between gap-4">
                        <Dialog.Title className="text-lg">{strings.header.catalog}</Dialog.Title>
                        <Dialog.Close
                          aria-label={strings.header.closeCatalog}
                          className="rounded-control p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                        >
                          <X aria-hidden="true" size={20} />
                        </Dialog.Close>
                      </div>

                      {isLoading ? <CatalogSkeleton /> : null}

                      {isError ? (
                        <ErrorMessage className="mt-4">{errorMessage}</ErrorMessage>
                      ) : null}

                      {categories && categories.length > 0 ? (
                        <nav aria-label={strings.header.catalog} className="mt-4">
                          <ul className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                            {categories.map((category) => (
                              <li key={category.id}>
                                <Link
                                  to={paths.category(category.slug)}
                                  className="flex items-center gap-2 text-sm font-semibold text-ink-900 no-underline hover:underline"
                                >
                                  <Thumbnail
                                    src={category.imageUrl}
                                    className="h-6 w-6 rounded-control"
                                    iconSize={12}
                                  />
                                  {category.name}
                                </Link>

                                {category.children.length > 0 ? (
                                  <ul className="mt-1.5 space-y-1">
                                    {category.children.slice(0, 6).map((child) => (
                                      <li key={child.id}>
                                        <Link
                                          to={paths.category(child.slug)}
                                          className="text-sm text-ink-600 no-underline hover:text-ink-900 hover:underline"
                                        >
                                          {child.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </nav>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Placeholder rows, sized like the real list so nothing moves when it arrives. */
function CatalogSkeleton() {
  return (
    <div aria-hidden="true" className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, column) => (
        <div key={column} className="space-y-2">
          <Skeleton className="h-6 w-32 rounded-control" />
          <Skeleton className="h-4 w-24 rounded-control" />
          <Skeleton className="h-4 w-20 rounded-control" />
        </div>
      ))}
    </div>
  );
}
