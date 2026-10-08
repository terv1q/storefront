/**
 * The cart entry in the header: a button with a count badge and a preview.
 *
 * The preview reads the same Zustand store as the header badge, the bottom
 * navigation, and the cart page, so there is no second copy of the cart to keep
 * in step. It shows the newest lines first, the subtotal the cart page will
 * also show, and the two actions a shopper wants from it — open the cart or go
 * straight to checkout.
 *
 * The preview is a Radix popover, which owns Escape, the click outside, focus
 * management inside the panel, and the return of focus to the trigger. It opens
 * on hover where the pointer can hover and on the trigger's own click
 * everywhere, so the keyboard reaches it without a pointer. On the narrow
 * layout, where there is no room for a preview, the same control navigates to
 * the cart instead.
 *
 * The badge pulses when the count goes up, which is what tells someone who just
 * added something that the count moved. The pulse is skipped when the visitor
 * asked for reduced motion; the number itself is always the answer.
 */

import * as Popover from '@radix-ui/react-popover';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Thumbnail } from '@/components/common/Thumbnail';
import { siteConfig } from '@/config/site';
import { cartItemKey } from '@/features/cart/cart.types';
import { useCart } from '@/hooks/useCart';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';
import { formatPrice } from '@/utils/formatPrice';

/** How long the badge stays highlighted after the count rises. */
const PULSE_MS = 900;

type Props = {
  className?: string;
  /** Renders the button without the preview, for the mobile header. */
  preview?: boolean;
};

export function CartButton({ className = '', preview = true }: Props) {
  const { items, itemCount: count, subtotal, isEmpty } = useCart();
  const [open, setOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  const navigate = useNavigate();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const canHover = useMediaQuery('(hover: hover)');

  const badgeLabel = strings.cart.itemCount(count);

  // The pulse is driven by the count rising, not by the badge rendering: the
  // number is on screen either way, and only a change is worth pointing at.
  const previousCount = useRef(count);

  useEffect(() => {
    const rose = count > previousCount.current;
    previousCount.current = count;

    if (!rose || reduceMotion) {
      return;
    }

    setPulsing(true);

    const timer = window.setTimeout(() => setPulsing(false), PULSE_MS);

    return () => window.clearTimeout(timer);
  }, [count, reduceMotion]);

  const openOnHover = () => {
    if (!canHover || !preview) {
      return;
    }

    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeOnLeave = () => {
    if (!canHover) {
      return;
    }

    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const button = (
    <button
      type="button"
      aria-label={`${strings.cart.openCart} — ${badgeLabel}`}
      onClick={preview ? undefined : () => navigate(paths.cart)}
      className={cn(
        'relative inline-flex h-10 items-center gap-2 rounded-control px-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900',
        className,
      )}
    >
      <span className="relative">
        <ShoppingCart aria-hidden="true" size={20} />
        {count > 0 ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute -top-1.5 -right-2 grid h-4 min-w-4 place-content-center rounded-full bg-brand-600 px-1 text-[0.625rem] leading-none font-semibold text-white',
              pulsing && 'animate-badge-pulse',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        ) : null}
      </span>
      <span className="hidden lg:inline">{strings.nav.cart}</span>
    </button>
  );

  if (!preview) {
    return button;
  }

  const recent = items.slice(0, siteConfig.cartPreviewCount);
  const hidden = items.length - recent.length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div className="relative" onMouseEnter={openOnHover} onMouseLeave={closeOnLeave}>
        <Popover.Trigger asChild>{button}</Popover.Trigger>
      </div>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={8}
          onMouseEnter={openOnHover}
          onMouseLeave={closeOnLeave}
          aria-label={strings.cart.title}
          className="overlay-panel z-header w-80 overflow-hidden rounded-panel border border-border bg-surface shadow-overlay"
        >
          {isEmpty ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm font-medium text-ink-900">{strings.cart.empty}</p>
              <p className="mt-1 text-xs text-ink-500">{strings.cart.emptyHint}</p>
              <Link
                to={paths.search}
                onClick={() => setOpen(false)}
                className="mt-3 inline-block text-sm font-medium text-brand-700"
              >
                {strings.actions.continueShopping}
              </Link>
            </div>
          ) : (
            <>
              <p className="border-b border-border px-4 py-2 text-xs font-semibold tracking-wide text-ink-500 uppercase">
                {strings.cart.previewTitle}
              </p>

              <ul className="max-h-64 overflow-y-auto">
                {recent.map((item) => (
                  <li
                    key={cartItemKey(item)}
                    className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <Thumbnail src={item.imageUrl} className="h-12 w-12 rounded-control" />

                    <div className="min-w-0 flex-1">
                      <Link
                        to={paths.product(item.slug)}
                        onClick={() => setOpen(false)}
                        className="block truncate text-sm font-medium text-ink-900 no-underline hover:underline"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-ink-500">
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>

                    <p className="shrink-0 text-sm font-semibold text-ink-900">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>

              {hidden > 0 ? (
                <p className="border-b border-border px-4 py-2 text-xs text-ink-500">
                  {strings.cart.moreItems(hidden)}
                </p>
              ) : null}

              <div className="px-4 py-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-ink-600">{strings.cart.subtotal}</span>
                  <span className="text-base font-semibold text-ink-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-500">{strings.cart.shippingNote}</p>

                <div className="mt-3 flex gap-2">
                  <Link
                    to={paths.cart}
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-control border border-border-strong px-3 py-2 text-center text-sm font-medium text-ink-800 no-underline hover:bg-ink-100"
                  >
                    {strings.cart.viewCart}
                  </Link>
                  <Link
                    to={paths.checkout}
                    onClick={() => setOpen(false)}
                    className="flex-1 rounded-control bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white no-underline hover:bg-brand-700"
                  >
                    {strings.cart.checkout}
                  </Link>
                </div>
              </div>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
