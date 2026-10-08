/**
 * The "notify me" dialog on a sold-out card.
 *
 * A sold-out card has no action to offer, so this is what takes the place of the
 * one it is missing: an address, and a promise to write when the product returns.
 * The dialog is opened by the card and owns everything after that — the field, the
 * validation, the request, and the three answers it can give.
 *
 * The address is not tied to an account on purpose. A shopper who finds a product
 * sold out is usually not signed in, and asking them to register before they can be
 * told about the one thing they came for is how the request never gets made. So the
 * request is sent without a token, and the server accepts it from anybody.
 *
 * The email is checked here as well as on the server. This side exists so the
 * message appears in the interface language, beside the field it belongs to, the
 * moment it is needed; the server's copy stays authoritative, and its message is
 * what is shown when it is the one that refuses.
 *
 * Escape, the close button, and a click outside all dismiss it, and focus returns
 * to the button that opened it. That is Radix's dialog, not a copy of it.
 */

import * as Dialog from '@radix-ui/react-dialog';
import { LoaderCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { useStockNotify } from '@/features/products/products.queries';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

/**
 * The client's copy of `emailField` in `server/src/utils/validation.ts`: same
 * trim, same length bound, same email check. It carries no messages of its own —
 * the wording lives in the interface's string table and is chosen when an issue
 * is reported, so it follows a language switch and is never read from a module
 * that was built in the language the page loaded in.
 */
export const stockNotifySchema = z.object({
  email: z.string().trim().min(1).max(254).pipe(z.email()),
});

/**
 * What the field says about the issue Zod reported.
 *
 * Only two things can be wrong with an address here: it is missing, or it is not
 * an address — an over-long one is, for this purpose, not an address.
 */
function emailMessage(issue: z.core.$ZodIssue | undefined): string {
  return issue?.code === 'too_small' ? strings.errors.requiredField : strings.errors.invalidEmail;
}

type Status = 'idle' | 'submitting' | 'done';

type Props = {
  /** The product being watched. The name is what the body sentence refers to. */
  product: { slug: string; name: string };
};

export function NotifyMeDialog({ product }: Props) {
  const fieldId = useId();
  const messageId = `${fieldId}-message`;
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const fieldRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');

  const notify = useStockNotify();
  const submitting = status === 'submitting';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = stockNotifySchema.safeParse({ email });

    if (!parsed.success) {
      setError(emailMessage(parsed.error.issues[0]));
      return;
    }

    setError(null);
    setStatus('submitting');

    try {
      await notify.mutateAsync({ slug: product.slug, email: parsed.data.email });
      setStatus('done');
    } catch (failure) {
      // The server's message when it sent one, the generic line when it did not.
      setError(failure instanceof Error ? failure.message : strings.product.notifyFailed);
      setStatus('idle');
    }
  };

  const message = error ?? (status === 'done' ? strings.product.notifySuccess : null);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);

        // A reopened dialog starts clean: the address from last time is not what
        // this visit is asking about, and the confirmation is no longer news.
        if (!next) {
          setStatus('idle');
          setError(null);
        }
      }}
    >
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex w-full items-center justify-center gap-2 rounded-control border border-ink-900 px-3 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-ink-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {strings.product.notifyMe}
        </button>
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
                  className="fixed inset-0 z-modal bg-ink-900/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>

              <Dialog.Content
                asChild
                forceMount
                aria-describedby={undefined}
                // The dialog exists for one field, so the field is where the
                // caret belongs. Radix would otherwise put focus on the first
                // focusable thing it finds, which is the close button in the
                // corner — a control that dismisses the dialog the visitor just
                // asked for.
                onOpenAutoFocus={(event) => {
                  event.preventDefault();
                  fieldRef.current?.focus();
                }}
              >
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="fixed top-1/2 left-1/2 z-modal w-[min(24rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border bg-surface p-5 shadow-overlay"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Dialog.Title className="text-lg font-semibold text-ink-900">
                      {strings.product.notifyTitle}
                    </Dialog.Title>

                    <Dialog.Close
                      aria-label={strings.product.notifyClose}
                      className="-mt-1 -mr-1 rounded-control p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                    >
                      <X aria-hidden="true" size={20} />
                    </Dialog.Close>
                  </div>

                  <p className="mt-2 text-sm text-ink-600">
                    {strings.product.notifyBody(product.name)}
                  </p>

                  <form onSubmit={submit} noValidate className="mt-4">
                    <label htmlFor={fieldId} className="block text-sm font-medium text-ink-900">
                      {strings.product.notifyLabel}
                    </label>

                    <input
                      id={fieldId}
                      ref={fieldRef}
                      type="email"
                      name="email"
                      value={email}
                      autoComplete="email"
                      inputMode="email"
                      placeholder={strings.product.notifyPlaceholder}
                      aria-invalid={error !== null}
                      aria-describedby={messageId}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setError(null);
                        setStatus('idle');
                      }}
                      className={cn(
                        'mt-2 w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                        error !== null && 'border-danger-600',
                      )}
                    />

                    {/* Held open whether or not it has something to say, so the
                        button below does not move when a message arrives. */}
                    <p
                      id={messageId}
                      role={error !== null ? 'alert' : 'status'}
                      className={cn(
                        'mt-2 min-h-5 text-sm',
                        error !== null
                          ? 'text-danger-600'
                          : status === 'done'
                            ? 'text-success-600'
                            : 'text-ink-500',
                      )}
                    >
                      {message}
                    </p>

                    <button
                      type="submit"
                      disabled={submitting || status === 'done'}
                      className={cn(
                        'mt-3 inline-flex w-full items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2.5 text-sm font-medium text-brand-50',
                        'transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                        'disabled:cursor-not-allowed disabled:opacity-60',
                      )}
                    >
                      {submitting ? (
                        <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
                      ) : null}
                      {submitting ? strings.product.notifySubmitting : strings.product.notifySubmit}
                    </button>
                  </form>
                </motion.div>
              </Dialog.Content>
            </>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
