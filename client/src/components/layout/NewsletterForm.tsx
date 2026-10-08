/**
 * The newsletter signup in the footer.
 *
 * `novalidate` is set and the email is checked with the schema from
 * `features/newsletter/newsletter.api.ts`, not by the browser, for one reason: the
 * browser's message appears in the browser's language and cannot be styled or read
 * back by a screen reader at a known moment. The message rendered here is the one the
 * form controls.
 *
 * The line under the field is always in the layout — it holds a message, a reserved
 * blank, or a hint — so submitting never pushes the footer down. That is the reason it
 * is a fixed-height block rather than an element that appears.
 *
 * The result is announced through `role="status"` on success and `role="alert"` on
 * failure: a sighted visitor sees the text change, and everyone else needs it said.
 * The address is kept in the field after a success so it can be corrected, and the
 * field is not cleared, because clearing it would erase what the message refers to.
 */

import { LoaderCircle } from 'lucide-react';
import { useId, useState } from 'react';
import type { FormEvent } from 'react';

import { newsletterSchema, subscribeToNewsletter } from '@/features/newsletter/newsletter.api';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Status = 'idle' | 'submitting' | 'saved' | 'known';

export function NewsletterForm() {
  const inputId = useId();
  const messageId = `${inputId}-message`;

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  const submitting = status === 'submitting';

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = newsletterSchema.safeParse({ email });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? strings.errors.invalidEmail);
      setStatus('idle');
      return;
    }

    setError(null);
    setStatus('submitting');

    try {
      const result = await subscribeToNewsletter({ email: parsed.data.email });
      setStatus(result);
    } catch {
      setError(strings.errors.generic);
      setStatus('idle');
    }
  };

  const message =
    error ??
    (status === 'saved'
      ? strings.footer.newsletterSaved
      : status === 'known'
        ? strings.footer.newsletterKnown
        : strings.footer.newsletterHint);

  return (
    <form onSubmit={submit} noValidate className="max-w-sm">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink-900">
        {strings.footer.newsletterLabel}
      </label>

      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          type="email"
          name="email"
          value={email}
          autoComplete="email"
          inputMode="email"
          placeholder={strings.footer.newsletterPlaceholder}
          aria-invalid={error !== null}
          aria-describedby={messageId}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
            setStatus('idle');
          }}
          className={cn(
            'min-w-0 flex-1 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            error !== null && 'border-danger-600',
          )}
        />

        <button
          type="submit"
          disabled={submitting}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50',
            'transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          {submitting ? (
            <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
          ) : null}
          {submitting ? strings.footer.newsletterSubmitting : strings.footer.newsletterSubmit}
        </button>
      </div>

      {/* Fixed height, so a message replaces the hint without moving what is below. */}
      <p
        id={messageId}
        role={error !== null ? 'alert' : 'status'}
        className={cn(
          'mt-2 min-h-5 text-sm',
          error !== null
            ? 'text-danger-600'
            : status === 'saved' || status === 'known'
              ? 'text-success-600'
              : 'text-ink-500',
        )}
      >
        {message}
      </p>
    </form>
  );
}
