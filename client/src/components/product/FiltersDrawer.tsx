/**
 * The filter panel as a drawer, for windows too narrow to hold a column.
 *
 * It is the same panel rather than a second one: whatever the column offers, the
 * drawer offers, because both stand in the same place and render the same
 * component. The drawer adds only what a layer over the page needs — a scrim, a
 * close button, a footer, and the behaviour a modal owes the shopper.
 *
 * That behaviour comes from Radix's dialog: Tab stays inside the drawer, Escape
 * closes it, focus returns to the button that opened it, the page behind it
 * cannot scroll, and the rest of the document is hidden from assistive
 * technology while it is open. None of that is reimplemented here, because a
 * focus trap written by hand is a focus trap with a way out.
 *
 * The footer does not apply anything. Every control writes to the URL as it is
 * changed, so by the time the shopper presses the button the listing behind the
 * scrim is already the one they built; the button reports the count and closes.
 * The alternative — a pending copy of the filters applied on close — is the second
 * source of truth this stage exists to avoid.
 *
 * The slide is a motion transform, skipped when the visitor has asked for reduced
 * motion. The drawer still opens and closes; it just does not travel.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many products the filters currently leave, for the footer's button. */
  resultCount: number;
  children: ReactNode;
};

export function FiltersDrawer({ open, onOpenChange, resultCount, children }: Props) {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
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
                  initial={reduceMotion ? false : { x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  className="fixed inset-y-0 left-0 z-drawer flex w-[min(21rem,90vw)] flex-col bg-surface shadow-overlay"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <Dialog.Title className="text-lg font-semibold text-ink-900">
                      {strings.filters.heading}
                    </Dialog.Title>

                    <Dialog.Close
                      aria-label={strings.filters.close}
                      className="rounded-control p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                    >
                      <X aria-hidden="true" size={20} />
                    </Dialog.Close>
                  </div>

                  {/* The panel usually draws its own frame and heading for the
                      column it sits in. Inside the drawer the frame and the
                      header above already say both, so it is asked to skip them
                      and only the clear-all control is left in that row. */}
                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
                    {children}
                  </div>

                  <div className="border-t border-border px-4 py-3">
                    <Dialog.Close className="inline-flex w-full items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                      {strings.filters.showResults(resultCount)}
                    </Dialog.Close>
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
