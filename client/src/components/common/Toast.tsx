/**
 * Where notifications appear.
 *
 * One fixed corner, mounted once in the layout, so a notification from the
 * product grid and one from the account page are read in the same place and no
 * page has to make room for its own. It sits above the mobile bottom navigation,
 * which is fixed and would otherwise cover it.
 *
 * The region is a single live region rather than one per notification: a screen
 * reader listening to the region reads each sentence as it is added, and a
 * `role="alert"` on every toast would interrupt for a cart confirmation as loudly
 * as for a failed connection. Adding and removing notifications animates in and
 * out with the reduced-motion rules the stylesheet already applies to
 * transitions.
 *
 * The close button is the only control, and it is per notification: dismissing
 * one says nothing about the others, which may be describing something else.
 */

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { useToastStore } from '@/store/toast.store';
import type { ToastTone } from '@/store/toast.store';

/** How each tone is drawn: the icon, the frame, and the icon's colour. */
const TONE_STYLES: Record<ToastTone, { frame: string; icon: string; Icon: typeof Info }> = {
  success: {
    frame: 'border-success-600/40 bg-success-50',
    icon: 'text-success-600',
    Icon: CircleCheck,
  },
  info: { frame: 'border-border bg-surface', icon: 'text-ink-600', Icon: Info },
  error: { frame: 'border-danger-600/40 bg-danger-50', icon: 'text-danger-600', Icon: CircleAlert },
};

export function ToastViewport() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={strings.toast.regionLabel}
      // `pointer-events-none` on the region, `auto` on each notification: the
      // region is a column down the corner of the screen, and it must not
      // swallow a click on the page underneath it.
      className="pointer-events-none fixed inset-x-4 bottom-20 z-toast flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end lg:bottom-4"
    >
      {toasts.map((toast) => {
        const { frame, icon, Icon } = TONE_STYLES[toast.tone];

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border p-3 shadow-card',
              'transition-[opacity,transform] duration-200',
              frame,
            )}
          >
            <Icon aria-hidden="true" size={18} className={cn('mt-0.5 shrink-0', icon)} />

            <p className="min-w-0 flex-1 text-sm text-ink-900">{toast.message}</p>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={strings.toast.dismiss}
              className="-m-1 grid size-7 shrink-0 place-content-center rounded-control text-ink-500 transition-colors hover:bg-surface-muted hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
