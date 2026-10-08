/**
 * The modal dialog: a form that asks for something without leaving the page.
 *
 * It is Radix's dialog, which is what the drawer, the filter panel, the gallery's
 * full-screen view, and the notify form are built on as well. The primitive is
 * what supplies the four things a dialog has to do and a hand-written one
 * forgets: Tab stays inside it, Escape closes it, a press on the backdrop closes
 * it, the page behind it cannot scroll, and focus goes back to whatever opened it
 * when it closes.
 *
 * The three callers are an address confirmation, a review form, and the note on
 * an order — all forms, so the dialog is sized for one and scrolls inside itself
 * when the window is shorter than its content. That is what keeps the close
 * button reachable on a phone held sideways.
 *
 * The title is required, and it is the dialog's accessible name: a dialog with no
 * name is announced as "dialog" and nothing else, so a caller that has nothing to
 * put there has nothing to open a dialog for. There is no description element, so
 * the body text is read when the visitor reaches it rather than announced over
 * the title.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  /** The dialog's name. Read as its heading, and as its accessible name. */
  title: string;
  children: ReactNode;
  className?: string;
};

export function Modal({ isOpen, onClose, title, children, className }: Props) {
  return (
    <Dialog.Root
      open={isOpen}
      // Escape, the backdrop, and the close button all arrive here as a request
      // to close; the caller owns whether it agrees.
      onOpenChange={(next) => {
        if (!next) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-modal bg-ink-900/50" />

        <Dialog.Content
          // The form itself is not a description of the dialog, so the body is
          // not announced as one when the dialog opens.
          aria-describedby={undefined}
          className={cn(
            'fixed top-1/2 left-1/2 z-modal flex max-h-[calc(100dvh-2rem)] w-[min(42rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-card bg-surface shadow-overlay',
            className,
          )}
        >
          <div className="flex items-center justify-between gap-4 border-b border-border p-6">
            <Dialog.Title className="text-lg font-semibold text-ink-900">{title}</Dialog.Title>

            <Dialog.Close
              aria-label={strings.actions.close}
              className="grid size-11 shrink-0 place-content-center rounded-full text-ink-600 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:size-9"
            >
              <X aria-hidden="true" size={20} />
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto overscroll-contain p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
