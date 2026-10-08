/**
 * The saved delivery addresses.
 *
 * An address saved here is what the checkout offers to fill in next time, so the
 * list is drawn as the checkout will read it: the default one first, marked, with
 * the rest under it. The marker is not decoration — it is the answer to "which one
 * will be used", and it is drawn from the row the server flagged rather than from
 * a local guess.
 *
 * Adding and editing use one form, because they ask for the same fields and the
 * only difference is whether the address already exists. It opens in place rather
 * than in a modal: the list behind it is what the visitor is choosing between, and
 * a dialog would hide it.
 *
 * "Make default" sends the whole address with `isDefault` set, which is what the
 * update route takes anyway, and the list is refetched afterwards because setting
 * a default clears the flag on every other row and only the server knows which
 * rows those were.
 */

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { accountFieldMessage } from '@/components/account/messages';
import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ErrorState } from '@/components/common/ErrorState';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { PHONE_MAX_LENGTH } from '@/features/auth/auth.rules';
import {
  ADDRESS_LIMITS,
  addressFormSchema,
  toAddressInput,
} from '@/features/account/account.rules';
import type { AddressFieldName, AddressFormValues } from '@/features/account/account.rules';
import { useAddresses, useRemoveAddress, useSaveAddress } from '@/features/account/account.queries';
import { errorMessageOf } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { fieldErrorsOf } from '@/services/fieldErrors';
import type { Address, AddressInput } from '@/types/user';

const BLANK: AddressFormValues = {
  label: '',
  fullName: '',
  phone: '',
  country: '',
  city: '',
  street: '',
  postalCode: '',
};

/** A stored address as the form's values, for editing. */
function toFormValues(address: Address): AddressFormValues {
  return {
    label: address.label ?? '',
    fullName: address.fullName,
    phone: address.phone,
    country: address.country,
    city: address.city,
    street: address.street,
    postalCode: address.postalCode ?? '',
  };
}

/** A whole address as the API takes it, for the "make default" action. */
function toInput(address: Address, isDefault: boolean): AddressInput {
  return {
    label: address.label ?? undefined,
    fullName: address.fullName,
    phone: address.phone,
    country: address.country,
    city: address.city,
    street: address.street,
    postalCode: address.postalCode ?? undefined,
    isDefault,
  };
}

export function AddressForm() {
  const addresses = useAddresses();
  const save = useSaveAddress();
  const remove = useRemoveAddress();

  /** Which address the form is editing, `'new'` while adding, or nothing. */
  const [editing, setEditing] = useState<Address | 'new' | null>(null);
  const [removing, setRemoving] = useState<Address | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const list = addresses.data ?? [];

  const makeDefault = async (address: Address) => {
    setFailure(null);

    try {
      await save.mutateAsync({ id: address.id, ...toInput(address, true) });
    } catch (error) {
      setFailure(errorMessageOf(error));
    }
  };

  const confirmRemove = async () => {
    if (removing === null) {
      return;
    }

    setFailure(null);

    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
    } catch (error) {
      setRemoving(null);
      setFailure(errorMessageOf(error));
    }
  };

  return (
    <section aria-labelledby="account-address-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="account-address-heading" className="text-lg font-semibold text-ink-900">
            {strings.account.address.heading}
          </h2>
          <p className="mt-1 text-sm text-ink-600">{strings.account.address.body}</p>
        </div>

        {editing === null ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFailure(null);
              setEditing('new');
            }}
          >
            <Plus aria-hidden="true" size={16} />
            {strings.account.address.add}
          </Button>
        ) : null}
      </div>

      {failure === null ? null : <ErrorMessage className="mt-4">{failure}</ErrorMessage>}

      {addresses.isPending ? (
        <p className="mt-5 text-sm text-ink-600">{strings.account.address.loading}</p>
      ) : addresses.isError ? (
        <ErrorState
          className="mt-5"
          title={strings.account.address.loadFailed}
          body={errorMessageOf(addresses.error)}
          onRetry={() => void addresses.refetch()}
        />
      ) : list.length === 0 && editing === null ? (
        <p className="mt-5 rounded-card border border-border bg-surface-muted p-4 text-sm text-ink-600">
          {strings.account.address.empty}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {list.map((address) => (
            <li
              key={address.id}
              className={cn(
                'rounded-card border p-4',
                address.isDefault ? 'border-brand-700 bg-brand-50/40' : 'border-border',
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-ink-900">
                    {address.label ?? strings.account.address.untitled}
                    {address.isDefault ? (
                      <span className="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-medium text-white">
                        {strings.account.address.defaultBadge}
                      </span>
                    ) : null}
                  </span>

                  <span className="text-sm text-ink-600">
                    {address.fullName}, {address.phone}
                  </span>
                  <span className="text-sm text-ink-600">
                    {address.street}, {address.city}, {address.country}
                    {address.postalCode === null ? '' : `, ${address.postalCode}`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {address.isDefault ? null : (
                    <Button
                      type="button"
                      variant="outline"
                      className="px-3 py-1.5"
                      disabled={save.isPending}
                      onClick={() => void makeDefault(address)}
                    >
                      {strings.account.address.makeDefault}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    className="px-3 py-1.5"
                    onClick={() => {
                      setFailure(null);
                      setEditing(address);
                    }}
                  >
                    <Pencil aria-hidden="true" size={14} />
                    {strings.account.address.edit}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="border-danger-600 px-3 py-1.5 text-danger-600 hover:bg-danger-50"
                    onClick={() => setRemoving(address)}
                  >
                    <Trash2 aria-hidden="true" size={14} />
                    {strings.account.address.remove}
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing === null ? null : (
        <AddressEditor
          // A fresh editor per address, so the fields start from the row that was
          // opened rather than from whatever the last one left behind.
          key={editing === 'new' ? 'new' : editing.id}
          address={editing === 'new' ? null : editing}
          defaultChecked={editing === 'new' ? list.length === 0 : editing.isDefault}
          onCancel={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}

      <Modal
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        title={strings.account.address.removeConfirmTitle}
        className="max-w-md"
      >
        <p className="text-sm text-ink-600">{strings.account.address.removeConfirmBody}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
          <Button
            type="button"
            isLoading={remove.isPending}
            className="bg-danger-600 text-white hover:brightness-110 focus-visible:outline-danger-600"
            onClick={() => void confirmRemove()}
          >
            {strings.account.address.removeConfirm}
          </Button>

          <Button type="button" variant="outline" onClick={() => setRemoving(null)}>
            {strings.account.address.removeKeep}
          </Button>
        </div>
      </Modal>
    </section>
  );
}

type EditorProps = {
  /** The address being changed, or `null` while adding one. */
  address: Address | null;
  defaultChecked: boolean;
  onCancel: () => void;
  onSaved: () => void;
};

function AddressEditor({ address, defaultChecked, onCancel, onSaved }: EditorProps) {
  const save = useSaveAddress();

  const [values, setValues] = useState(address === null ? BLANK : toFormValues(address));
  const [isDefault, setIsDefault] = useState(defaultChecked);
  const [errors, setErrors] = useState<Partial<Record<AddressFieldName, string>>>({});
  const [failure, setFailure] = useState<string | null>(null);

  const busy = save.isPending;

  const setField = (field: AddressFieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFailure(null);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFailure(null);

    const parsed = addressFormSchema.safeParse(values);

    if (!parsed.success) {
      const found: Partial<Record<AddressFieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (typeof field === 'string') {
          found[field as AddressFieldName] ??= accountFieldMessage(issue.message);
        }
      }

      setErrors(found);
      return;
    }

    setErrors({});

    try {
      const input = toAddressInput(parsed.data, isDefault);

      await save.mutateAsync(address === null ? input : { ...input, id: address.id });

      onSaved();
    } catch (error) {
      const fields = fieldErrorsOf(error);
      const placed: Partial<Record<AddressFieldName, string>> = {};

      for (const [field, message] of Object.entries(fields)) {
        placed[field as AddressFieldName] = message;
      }

      if (Object.keys(placed).length > 0) {
        setErrors(placed);
        return;
      }

      setFailure(errorMessageOf(error));
    }
  };

  const messageFor = (field: AddressFieldName): string | undefined => errors[field];

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label={
        address === null ? strings.account.address.addHeading : strings.account.address.editHeading
      }
      className="mt-5 flex flex-col gap-4 rounded-card border border-border bg-surface-muted p-4"
    >
      <h3 className="text-base font-semibold text-ink-900">
        {address === null
          ? strings.account.address.addHeading
          : strings.account.address.editHeading}
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="address-label"
          name="label"
          label={strings.account.address.labelLabel}
          helperText={strings.account.address.labelHelper}
          maxLength={ADDRESS_LIMITS.label}
          value={values.label}
          error={messageFor('label')}
          disabled={busy}
          onChange={(event) => setField('label', event.target.value)}
        />

        <Input
          id="address-full-name"
          name="fullName"
          label={strings.account.address.fullNameLabel}
          autoComplete="name"
          maxLength={ADDRESS_LIMITS.fullName}
          value={values.fullName}
          error={messageFor('fullName')}
          disabled={busy}
          onChange={(event) => setField('fullName', event.target.value)}
        />
      </div>

      <Input
        id="address-phone"
        type="tel"
        name="phone"
        label={strings.account.address.phoneLabel}
        placeholder={strings.auth.phonePlaceholder}
        autoComplete="tel"
        inputMode="tel"
        maxLength={PHONE_MAX_LENGTH}
        value={values.phone}
        error={messageFor('phone')}
        disabled={busy}
        onChange={(event) => setField('phone', event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="address-country"
          name="country"
          label={strings.account.address.countryLabel}
          autoComplete="country-name"
          maxLength={ADDRESS_LIMITS.country}
          value={values.country}
          error={messageFor('country')}
          disabled={busy}
          onChange={(event) => setField('country', event.target.value)}
        />

        <Input
          id="address-city"
          name="city"
          label={strings.account.address.cityLabel}
          autoComplete="address-level2"
          maxLength={ADDRESS_LIMITS.city}
          value={values.city}
          error={messageFor('city')}
          disabled={busy}
          onChange={(event) => setField('city', event.target.value)}
        />
      </div>

      <Input
        id="address-street"
        name="street"
        label={strings.account.address.streetLabel}
        autoComplete="street-address"
        maxLength={ADDRESS_LIMITS.street}
        value={values.street}
        error={messageFor('street')}
        disabled={busy}
        onChange={(event) => setField('street', event.target.value)}
      />

      <Input
        id="address-postal-code"
        name="postalCode"
        label={strings.account.address.postalCodeLabel}
        inputMode="numeric"
        autoComplete="postal-code"
        maxLength={ADDRESS_LIMITS.postalCode}
        value={values.postalCode}
        error={messageFor('postalCode')}
        disabled={busy}
        onChange={(event) => setField('postalCode', event.target.value)}
      />

      <label className="flex items-start gap-3 text-sm text-ink-900">
        <input
          type="checkbox"
          name="isDefault"
          checked={isDefault}
          disabled={busy}
          onChange={(event) => setIsDefault(event.target.checked)}
          className="mt-0.5 size-4 accent-brand-700"
        />
        <span className="flex flex-col gap-0.5">
          {strings.account.address.isDefaultLabel}
          <span className="text-xs text-ink-500">{strings.account.address.isDefaultHelper}</span>
        </span>
      </label>

      {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

      <div className="flex items-center gap-2">
        <Button type="submit" isLoading={busy}>
          {busy ? strings.account.address.saving : strings.account.address.save}
        </Button>

        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          {strings.account.address.cancel}
        </Button>
      </div>
    </form>
  );
}
