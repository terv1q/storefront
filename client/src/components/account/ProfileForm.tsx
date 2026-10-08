/**
 * The account's own details: the name, the phone number, and the address the
 * account is signed in with.
 *
 * The email is drawn but not editable, and the field says so rather than leaving
 * a greyed box to be puzzled over. It is the sign-in identity — the server reads
 * the account from it — and this version has no way to prove that a new address
 * belongs to whoever typed it, so an edit would either have to be trusted or
 * verified, and neither is worth a wrong turn at sign-in.
 *
 * What the form saves is the two names and the phone number. The phone box stays
 * optional here, as it is on the server: it matters on a delivery address, and
 * `AddressForm` is where a number is required.
 */

import { useState } from 'react';
import type { FormEvent } from 'react';

import { accountFieldMessage } from '@/components/account/messages';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Input } from '@/components/common/Input';
import { NAME_MAX_LENGTH, PHONE_MAX_LENGTH } from '@/features/auth/auth.rules';
import { profileFormSchema } from '@/features/account/account.rules';
import type { ProfileFieldName } from '@/features/account/account.rules';
import { useUpdateProfile } from '@/features/account/account.queries';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { fieldErrorsOf } from '@/services/fieldErrors';
import type { User } from '@/types/user';

type Props = {
  user: User;
};

export function ProfileForm({ user }: Props) {
  const update = useUpdateProfile();

  const [values, setValues] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<ProfileFieldName, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const busy = update.isPending;

  const setField = (field: ProfileFieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(null);
    setSaved(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);
    setSaved(false);

    const parsed = profileFormSchema.safeParse(values);

    if (!parsed.success) {
      const found: Partial<Record<ProfileFieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string') {
          found[field as ProfileFieldName] ??= accountFieldMessage(issue.message);
        }
      }

      setErrors(found);
      return;
    }

    setErrors({});

    try {
      const savedUser = await update.mutateAsync(parsed.data);

      // The form is redrawn from what the server stored, so a name it trimmed is
      // shown as it was kept rather than as it was typed.
      setValues({
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        phone: savedUser.phone ?? '',
      });
      setSaved(true);
    } catch (error) {
      const fields = fieldErrorsOf(error);

      if (Object.keys(fields).length > 0) {
        const placed: Partial<Record<ProfileFieldName, string>> = {};

        for (const [field, message] of Object.entries(fields)) {
          placed[field as ProfileFieldName] = message;
        }

        setErrors(placed);
        return;
      }

      setFailure(errorMessageOf(error));
    }
  };

  return (
    <section aria-labelledby="account-profile-heading">
      <h2 id="account-profile-heading" className="text-lg font-semibold text-ink-900">
        {strings.account.profile.heading}
      </h2>
      <p className="mt-1 text-sm text-ink-600">{strings.account.profile.body}</p>

      <form onSubmit={submit} noValidate className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="account-first-name"
            name="firstName"
            label={strings.auth.firstNameLabel}
            autoComplete="given-name"
            maxLength={NAME_MAX_LENGTH}
            value={values.firstName}
            error={errors.firstName}
            disabled={busy}
            onChange={(event) => setField('firstName', event.target.value)}
          />

          <Input
            id="account-last-name"
            name="lastName"
            label={strings.auth.lastNameLabel}
            autoComplete="family-name"
            maxLength={NAME_MAX_LENGTH}
            value={values.lastName}
            error={errors.lastName}
            disabled={busy}
            onChange={(event) => setField('lastName', event.target.value)}
          />
        </div>

        <Input
          id="account-email"
          type="email"
          name="email"
          label={strings.auth.emailLabel}
          autoComplete="email"
          value={user.email}
          readOnly
          disabled
          helperText={strings.account.profile.emailNote}
        />

        <Input
          id="account-phone"
          type="tel"
          name="phone"
          label={strings.auth.phoneLabel}
          placeholder={strings.auth.phonePlaceholder}
          autoComplete="tel"
          inputMode="tel"
          maxLength={PHONE_MAX_LENGTH}
          value={values.phone}
          error={errors.phone}
          disabled={busy}
          helperText={strings.account.profile.phoneNote}
          onChange={(event) => setField('phone', event.target.value)}
        />

        {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={busy}>
            {busy ? strings.account.profile.saving : strings.account.profile.save}
          </Button>

          {/* The save is a status rather than an alert: nothing went wrong, and
              a screen reader should hear that the form was accepted. */}
          <p role="status" aria-live="polite" className="text-sm text-success-600">
            {saved ? strings.account.profile.saved : ''}
          </p>
        </div>
      </form>
    </section>
  );
}
