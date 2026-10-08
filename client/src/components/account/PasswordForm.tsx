/**
 * Changing the password.
 *
 * Three boxes: the one in use, the new one, and the new one again. The current
 * password is asked for because the token alone should not be enough to take an
 * account over — a borrowed laptop with a live session would otherwise be enough
 * to lock the owner out.
 *
 * The current password is checked for being present and not for being right.
 * Whether it is right is a question only the server can answer, and answering it
 * here would let somebody test a guess without a request.
 *
 * A wrong current password comes back as a field message under the box it was
 * typed in, and it is deliberately not a `401`: the session is fine and one box
 * is not, and a `401` would make the client drop a session that is still valid.
 * The token this session holds stays valid after a change — there is no session
 * table to revoke it in — and the copy says so rather than implying the change
 * signed the other devices out.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';

import { accountFieldMessage } from '@/components/account/messages';
import { PasswordField } from '@/components/auth/PasswordField';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { passwordFormSchema } from '@/features/account/account.rules';
import type { PasswordFieldName } from '@/features/account/account.rules';
import { useChangePassword } from '@/features/account/account.queries';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { fieldErrorsOf } from '@/services/fieldErrors';
import { isApiError } from '@/types/api';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export function PasswordForm() {
  const change = useChangePassword();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<PasswordFieldName, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const busy = change.isPending;

  /** Hides every box again, which is what a refused attempt deserves. */
  const hideAll = () => {
    setRevealed({ currentPassword: false, newPassword: false, confirmPassword: false });
  };

  const setField = (field: PasswordFieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(null);
    setSaved(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setSaved(false);

    const parsed = passwordFormSchema.safeParse(values);

    if (!parsed.success) {
      const found: Partial<Record<PasswordFieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string') {
          found[field as PasswordFieldName] ??= accountFieldMessage(issue.message);
        }
      }

      setErrors(found);

      if (parsed.error.issues.some((issue) => issue.message === 'passwordMismatch')) {
        hideAll();
      }

      return;
    }

    setErrors({});

    try {
      await change.mutateAsync({
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
      });

      setValues(EMPTY);
      hideAll();
      setSaved(true);
    } catch (error) {
      hideAll();

      if (isApiError(error) && error.status === 422) {
        const fields = fieldErrorsOf(error);
        const placed: Partial<Record<PasswordFieldName, string>> = {};

        for (const [field, message] of Object.entries(fields)) {
          placed[field as PasswordFieldName] = message;
        }

        setErrors(placed);
        setFailure(Object.keys(placed).length === 0 ? error.message : null);
        return;
      }

      setFailure(errorMessageOf(error));
    }
  };

  return (
    <section aria-labelledby="account-password-heading">
      <h2 id="account-password-heading" className="text-lg font-semibold text-ink-900">
        {strings.account.password.heading}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{strings.account.password.body}</p>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <PasswordField
          label={strings.account.password.currentLabel}
          value={values.currentPassword}
          onChange={(value) => setField('currentPassword', value)}
          error={errors.currentPassword}
          autoComplete="current-password"
          hint={null}
          disabled={busy}
          revealed={revealed.currentPassword}
          onRevealedChange={(value) =>
            setRevealed((current) => ({ ...current, currentPassword: value }))
          }
        />

        <PasswordField
          label={strings.account.password.newLabel}
          value={values.newPassword}
          onChange={(value) => setField('newPassword', value)}
          error={errors.newPassword}
          autoComplete="new-password"
          placeholder={strings.auth.passwordPlaceholder}
          disabled={busy}
          showStrength
          revealed={revealed.newPassword}
          onRevealedChange={(value) =>
            setRevealed((current) => ({ ...current, newPassword: value }))
          }
        />

        <PasswordField
          label={strings.auth.confirmPasswordLabel}
          value={values.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          hint={null}
          disabled={busy}
          revealed={revealed.confirmPassword}
          onRevealedChange={(value) =>
            setRevealed((current) => ({ ...current, confirmPassword: value }))
          }
        />

        {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={busy}>
            {busy ? strings.account.password.changing : strings.account.password.change}
          </Button>

          <p role="status" aria-live="polite" className="text-sm text-success-600">
            {saved ? strings.account.password.changed : ''}
          </p>
        </div>

        <p className="text-xs text-ink-500">{strings.account.password.note}</p>
      </form>
    </section>
  );
}
