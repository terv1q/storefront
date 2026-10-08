/**
 * Signing in.
 *
 * One email, one password, and a button. Everything else on the page is there
 * to answer a question the visitor may have while typing: which address was
 * wrong, whether the caps lock is on, whether this is even the right page for
 * somebody without an account yet.
 *
 * The form is validated twice. `loginFormSchema` refuses an empty field or a
 * malformed address before a request is made, so a typo costs nothing; the
 * server refuses it again, and the two answers are placed the same way — under
 * the field they belong to. What the client cannot know is whether the address
 * exists: `401 invalid_credentials` is one message about both fields on purpose,
 * because an API that says "no such address" is an API that tells a stranger
 * which addresses are registered here.
 *
 * Where the visitor goes afterwards is the address they were interrupted on, if
 * a guard sent them here, and the storefront otherwise. It is read through
 * `useReturnUrl`, which refuses anything that is not a path on this store — a
 * return path arrives in a URL, and a URL is something a stranger can write.
 *
 * There is no delay, no captcha, and no second step. The server's own rate
 * limiter answers guessing, and a person who has typed the right password should
 * be inside on the first press.
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
import { loginFormSchema } from '@/features/auth/auth.rules';
import type { LoginFieldName } from '@/features/auth/auth.rules';
import { useAuth } from '@/hooks/useAuth';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { useReturnUrl, registerPathWithReturn } from '@/routes/returnUrl';
import { fieldErrorsOf } from '@/services/fieldErrors';
import { isApiError } from '@/types/api';

export function LoginPage() {
  useSeo({ title: strings.pages.signIn.title, noIndex: true });

  const navigate = useNavigate();
  const auth = useAuth();
  const returnUrl = useReturnUrl();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<LoginFieldName, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  /** Clears one field's message as soon as the visitor starts fixing it. */
  const clearError = (field: LoginFieldName) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const parsed = loginFormSchema.safeParse({ email, password });

    if (!parsed.success) {
      const found: Partial<Record<LoginFieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === 'email' || field === 'password') {
          found[field] ??= authFieldMessage(issue.message);
        }
      }

      setErrors(found);
      return;
    }

    setErrors({});

    try {
      await auth.login({ email: parsed.data.email, password: parsed.data.password });

      // The password is not cleared here: this component is unmounted by the
      // navigation, and the value goes with it.
      navigate(returnUrl, { replace: true });
    } catch (error) {
      setRevealed(false);

      if (isApiError(error) && error.status === 422) {
        const fields = fieldErrorsOf(error);

        setErrors({
          email: fields.email,
          password: fields.password,
        });
        setFailure(Object.keys(fields).length === 0 ? error.message : null);
        return;
      }

      const tooMany =
        isApiError(error) && (error.status === 429 || error.code === 'too_many_login_attempts');

      setFailure(tooMany ? strings.auth.tooManyAttempts : signInFailureMessage(error));
    }
  };

  return (
    <AuthPanel
      title={strings.pages.signIn.title}
      body={strings.auth.signInBody}
      footer={
        <>
          {strings.auth.noAccountYet}{' '}
          <Link to={registerPathWithReturn(returnUrl)}>{strings.account.register}</Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Input
          id="login-email"
          type="email"
          name="email"
          label={strings.auth.emailLabel}
          placeholder={strings.auth.emailPlaceholder}
          autoComplete="email"
          inputMode="email"
          spellCheck={false}
          value={email}
          error={errors.email}
          disabled={auth.isLoggingIn}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError('email');
          }}
        />

        <PasswordField
          label={strings.auth.passwordLabel}
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearError('password');
          }}
          error={errors.password}
          autoComplete="current-password"
          disabled={auth.isLoggingIn}
          revealed={revealed}
          onRevealedChange={setRevealed}
        />

        {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

        <Button type="submit" isLoading={auth.isLoggingIn} className="mt-1 w-full py-2.5">
          {auth.isLoggingIn ? strings.auth.signingIn : strings.account.signIn}
        </Button>
      </form>
    </AuthPanel>
  );
}

/**
 * The sentence for a sign-in that failed for a reason the field messages cannot
 * describe. The three worth naming are the ones a visitor can act on: the
 * password was wrong, the request never arrived, and the server refused for
 * something else.
 */
function signInFailureMessage(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 401) {
      return strings.auth.invalidCredentials;
    }

    if (error.message) {
      return error.message;
    }
  }

  return errorMessageOf(error);
}
