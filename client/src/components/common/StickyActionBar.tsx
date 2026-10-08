/**
 * The action bar that follows the thumb down a phone screen.
 *
 * On a narrow window the control that ends a page is often a screen below where
 * the page started: the add-to-cart buttons sit under the gallery and the
 * choices, and the checkout button sits under the basket. This bar carries the
 * same action at the bottom of the window, so the decision and the button that
 * spends it are never more than a thumb apart.
 *
 * Three decisions shape it.
 *
 * **It sits above the bottom navigation, not over it.** The bar's offset is the
 * navigation's own height, so the two stack rather than fight: a bar that
 * covered the navigation would take away the way out of the page it is hurrying
 * the shopper through. That height is fixed by `MobileBottomNav`, which is why
 * that component's row is measured in `rem` rather than left to its content.
 *
 * **It is hidden from assistive technology and from the keyboard.** Every action
 * it offers is already on the page, in the panel or the summary it was copied
 * from. A second control with the same name would make a screen reader read the
 * page twice and give a keyboard user two identical stops; the bar exists for the
 * thumb, so it is marked as decoration for everybody else. Its buttons are taken
 * out of the tab order for the same reason, and left clickable by pointer.
 *
 * **It draws its own spacer.** The bar is out of the flow, so the last row of the
 * page would otherwise sit behind it. The spacer is the bar's height and nothing
 * else — `Layout` already clears the navigation below it.
 *
 * It is only correct where the page also draws the real control, and it is only
 * drawn below the large breakpoint, where the real control is the one that has
 * scrolled away.
 */

import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

/** The bar's own height, and the spacer that stands in for it. */
const BAR_HEIGHT = 'h-16';

/**
 * Where the bar sits: directly on top of the fixed bottom navigation, which is
 * three and a half rem plus whatever the phone reserves for its home indicator.
 * Written without a space around the `+` because a CSS `calc` cannot have one.
 */
const BAR_OFFSET = 'bottom-[calc(3.5rem_+_env(safe-area-inset-bottom))]';

type Props = {
  /** The action. Read by nobody but the eye; see the note above. */
  label: string;
  /** What the action costs, or what it applies to. */
  secondary?: ReactNode;
  disabled?: boolean;
  /** Not reached by a keyboard, but a pointer press still calls it. */
  onClick: () => void;
  className?: string;
};

export function StickyActionBar({ label, secondary, disabled = false, onClick, className }: Props) {
  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-x-0 z-sticky border-t border-border bg-surface/95 backdrop-blur lg:hidden',
          BAR_OFFSET,
          BAR_HEIGHT,
          className,
        )}
      >
        <div className="mx-auto flex h-full max-w-page items-center gap-3 px-page-x">
          {secondary === undefined ? null : (
            <span className="min-w-0 shrink truncate text-base font-semibold text-ink-900">
              {secondary}
            </span>
          )}

          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={onClick}
            className={cn(
              'inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-control px-4 py-2 text-center text-sm leading-tight font-medium transition-colors',
              'bg-brand-700 text-brand-50 hover:bg-brand-600',
              'disabled:cursor-not-allowed disabled:bg-ink-300 disabled:text-ink-600',
            )}
          >
            {label}
          </button>
        </div>
      </div>

      {/* The room the bar would have taken, so the page can still be scrolled to
          its end and read there. Decorative, like the bar itself. */}
      <div aria-hidden="true" className={cn(BAR_HEIGHT, 'lg:hidden')} />
    </>
  );
}
