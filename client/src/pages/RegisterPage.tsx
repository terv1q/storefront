/**
 * Creating an account.
 *
 * The form asks for what the account actually needs and nothing more: a name, an
 * address, an optional telephone number, and a password typed twice. There is no
 * marketing checkbox, no company field, and no captcha — none of them would be
 * stored, and every field the server does not want is a field a customer has to
 * read before they can buy something.
 *
 * The password is the one place this form works harder than the server does. It
 * is read as it is typed — length, mixed case, a digit, a symbol — and the meter
 * says which of those is still missing. That is a reading and not a rule: the
 * schema enforces the server's own floor of eight characters, and the meter
 * exists so that the useful choice is the easy one. Confirming the password is
 * checked the same way, under the second field where the mistake was made.
 *
 * A duplicate address is the one refusal that belongs to a field rather than to
 * the form: `409 email_taken` is placed under the email box, with the sign-in
 * link as the way out. Everything else lands as a sentence above the button.
 *
 * On success the visitor is signed in — registration answers with a session —
 * so they continue to wherever a guard interrupted them, as they would after
 * signing in.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AuthPanel } from '@/components/auth/AuthPanel';
import { PasswordField } from '@/components/auth/PasswordField';
import { authFieldMessage } from '@/components/auth/messages';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Input } from '@/components/common/Input';
import { registerFormSchema } from '@/features/auth/auth.rules';
import type { RegisterFieldName } from '@/features/auth/auth.rules';
import { useAuth } from '@/hooks/useAuth';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { loginPathWithReturn, useReturnUrl } from '@/routes/returnUrl';
import { fieldErrorsOf } from '@/services/fieldErrors';
import { isApiError } from '@/types/api';

export function RegisterPage() {
  useSeo({ title: strings.pages.register.title, noIndex: true });

  const navigate = useNavigate();
  const auth = useAuth();
  const returnUrl = useReturnUrl();

  const [values, setValues] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [passwordRevealed, setPasswordRevealed] = useState(false);
  const [confirmRevealed, setConfirmRevealed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<RegisterFieldName, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const busy = auth.isRegistering;

  const setField = (field: keyof typeof values, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const parsed = registerFormSchema.safeParse(values);

    if (!parsed.success) {
      const found: Partial<Record<RegisterFieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string') {
          found[field as RegisterFieldName] ??= authFieldMessage(issue.message);
        }
      }

      setErrors(found);

      // Both password boxes are drawn as plain text again after a refused
      // attempt, so a pair that did not match is not left on the screen.
      if (parsed.error.issues.some((issue) => issue.message === 'passwordMismatch')) {
        setPasswordRevealed(false);
        setConfirmRevealed(false);
      }

      return;
    }

    setErrors({});

    try {
      await auth.register({
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        password: parsed.data.password,
      });

      navigate(returnUrl, { replace: true });
    } catch (error) {
      // A password is not left legible after a refused attempt.
      setPasswordRevealed(false);
      setConfirmRevealed(false);

      if (isApiError(error) && error.code === 'email_taken') {
        setErrors({ email: strings.auth.emailTaken });
        return;
      }

      if (isApiError(error) && error.status === 422) {
        const fields = fieldErrorsOf(error);
        const placed: Partial<Record<RegisterFieldName, string>> = {};

        for (const [field, message] of Object.entries(fields)) {
          placed[field as RegisterFieldName] = message;
        }

        setErrors(placed);
        setFailure(Object.keys(placed).length === 0 ? error.message : null);
        return;
      }

      const tooMany =
        isApiError(error) && (error.status === 429 || error.code === 'too_many_registrations');

      setFailure(
        tooMany
          ? strings.auth.tooManyRegistrations
          : isApiError(error) && error.message
            ? error.message
            : errorMessageOf(error),
      );
    }
  };

  return (
    <AuthPanel
      title={strings.pages.register.title}
      body={strings.auth.registerBody}
      footer={
        <>
          {strings.auth.haveAccount}{' '}
          <Link to={loginPathWithReturn(returnUrl)}>{strings.account.signIn}</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="register-first-name"
            name="firstName"
            label={strings.auth.firstNameLabel}
            autoComplete="given-name"
            maxLength={60}
            value={values.firstName}
            error={errors.firstName}
            disabled={busy}
            onChange={(event) => setField('firstName', event.target.value)}
          />

          <Input
            id="register-last-name"
            name="lastName"
            label={strings.auth.lastNameLabel}
            autoComplete="family-name"
            maxLength={60}
            value={values.lastName}
            error={errors.lastName}
            disabled={busy}
            onChange={(event) => setField('lastName', event.target.value)}
          />
        </div>

        <Input
          id="register-email"
          type="email"
          name="email"
          label={strings.auth.emailLabel}
          placeholder={strings.auth.emailPlaceholder}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          value={values.email}
          error={errors.email}
          disabled={busy}
          onChange={(event) => setField('email', event.target.value)}
        />

        <Input
          id="register-phone"
          type="tel"
          name="phone"
          label={strings.auth.phoneLabel}
          helperText={strings.auth.phoneHelper}
          placeholder={strings.auth.phonePlaceholder}
          autoComplete="tel"
          inputMode="tel"
          value={values.phone}
          error={errors.phone}
          disabled={busy}
          onChange={(event) => setField('phone', event.target.value)}
        />

        <PasswordField
          label={strings.auth.passwordLabel}
          value={values.password}
          onChange={(value) => setField('password', value)}
          error={errors.password}
          autoComplete="new-password"
          placeholder={strings.auth.passwordPlaceholder}
          disabled={busy}
          showStrength
          revealed={passwordRevealed}
          onRevealedChange={setPasswordRevealed}
        />

        <PasswordField
          label={strings.auth.confirmPasswordLabel}
          value={values.confirmPassword}
          onChange={(value) => setField('confirmPassword', value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          disabled={busy}
          revealed={confirmRevealed}
          onRevealedChange={setConfirmRevealed}
        />

        {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

        <Button type="submit" isLoading={busy} className="mt-1 w-full py-2.5">
          {busy ? strings.auth.registering : strings.account.register}
        </Button>

        <p className="text-xs text-ink-500">{strings.auth.registerTerms}</p>
      </form>
    </AuthPanel>
  );
}
