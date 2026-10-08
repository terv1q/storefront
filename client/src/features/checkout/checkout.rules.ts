/**
 * What the checkout form accepts, step by step.
 *
 * The rules mirror `POST /api/orders` field for field — the same email, phone,
 * and address limits the server enforces in `routes/order.routes.ts` — so a
 * form is refused here in the shopper's own language before a request is made,
 * and the server refuses it again if the request is hand-written. The two lists
 * are deliberately the same length: a stricter client would block an order the
 * API would have accepted, and a looser one would move the refusal to the end
 * of a form somebody has already filled in.
 *
 * A broken rule carries a key rather than a sentence (`'streetRequired'`),
 * because the sentence depends on the language being read; `messages.ts` turns
 * the key into copy at render time. `auth.rules.ts` does the same for the
 * sign-in forms.
 *
 * The steps are validated one at a time, and only the step being left is
 * checked. A shopper who has not reached the payment step yet should not be
 * told their phone number is wrong.
 */

import { z } from 'zod';

import { EMAIL_MAX_LENGTH, PHONE_MAX_LENGTH, PHONE_PATTERN } from '@/features/auth/auth.rules';
import type { CheckoutInput, CheckoutItemInput } from '@/types/order';

/**
 * The delivery and payment codes the API accepts. They are literals here and
 * not only types because a select needs them at runtime, and they are the same
 * two lists the server writes in `services/order.service.ts` and
 * `config/payments.ts`.
 */
export const DELIVERY_METHODS = ['COURIER', 'PICKUP'] as const;
export const PAYMENT_METHODS = ['CARD', 'CASH'] as const;

/** The longest name the checkout accepts, matching `nameField('name', 120)`. */
export const CUSTOMER_NAME_MAX_LENGTH = 120;
export const COUNTRY_MAX_LENGTH = 60;
export const CITY_MAX_LENGTH = 60;
export const STREET_MAX_LENGTH = 160;
export const POSTAL_CODE_MAX_LENGTH = 20;
export const NOTES_MAX_LENGTH = 500;

/** An optional box: empty means "not given", which is what the API expects. */
function optionalText(maxLength: number, tooLong: string) {
  return z.string().trim().max(maxLength, tooLong);
}

const nameRule = z
  .string()
  .trim()
  .min(1, 'nameRequired')
  .max(CUSTOMER_NAME_MAX_LENGTH, 'nameTooLong');

const emailRule = z
  .string()
  .trim()
  .min(1, 'emailRequired')
  .max(EMAIL_MAX_LENGTH, 'emailTooLong')
  .pipe(z.email('emailInvalid'));

/** The checkout asks for a phone number: it is how a courier reaches the order. */
const phoneRule = z
  .string()
  .trim()
  .min(1, 'phoneRequired')
  .max(PHONE_MAX_LENGTH, 'phoneTooLong')
  .regex(PHONE_PATTERN, 'phoneInvalid');

/** Step 1 — who the order is for. */
export const contactSchema = z.object({
  customerName: nameRule,
  customerEmail: emailRule,
  customerPhone: phoneRule,
});

/** Step 2 — where it goes, and how. */
export const shippingSchema = z.object({
  country: z.string().trim().min(1, 'countryRequired').max(COUNTRY_MAX_LENGTH, 'countryTooLong'),
  city: z.string().trim().min(1, 'cityRequired').max(CITY_MAX_LENGTH, 'cityTooLong'),
  street: z.string().trim().min(1, 'streetRequired').max(STREET_MAX_LENGTH, 'streetTooLong'),
  postalCode: optionalText(POSTAL_CODE_MAX_LENGTH, 'postalCodeTooLong'),
  deliveryMethod: z.enum(DELIVERY_METHODS),
  notes: optionalText(NOTES_MAX_LENGTH, 'notesTooLong'),
});

/** Step 3 — how it is paid. Both codes are simulated by the API. */
export const paymentSchema = z.object({
  paymentMethod: z.enum(PAYMENT_METHODS),
});

/**
 * The whole form. Kept as one object so the fields are one piece of state the
 * page owns and every step edits, rather than four states to keep in step.
 */
export const checkoutFormSchema = contactSchema
  .extend(shippingSchema.shape)
  .extend(paymentSchema.shape);

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;

/** The fields a step owns that are typed into a text box. */
export type CheckoutTextField =
  | 'customerName'
  | 'customerEmail'
  | 'customerPhone'
  | 'country'
  | 'city'
  | 'street'
  | 'postalCode'
  | 'notes';

/** The step being left, which is the only one whose fields are checked. */
export type CheckoutStepKey = 'contact' | 'shipping' | 'payment' | 'review';

/** The order the steps are walked in, which is also the order they are drawn. */
export const CHECKOUT_STEPS = ['contact', 'shipping', 'payment', 'review'] as const;

/** The fields each step owns, so a failure can be placed under the right input. */
export const STEP_FIELDS: Record<CheckoutStepKey, readonly (keyof CheckoutFormValues)[]> = {
  contact: ['customerName', 'customerEmail', 'customerPhone'],
  shipping: ['country', 'city', 'street', 'postalCode', 'deliveryMethod', 'notes'],
  payment: ['paymentMethod'],
  review: [],
};

/** The schema that decides whether a step may be left. */
export const STEP_SCHEMAS = {
  contact: contactSchema,
  shipping: shippingSchema,
  payment: paymentSchema,
  // The review step has nothing to type, so it is always complete: it is the
  // step the order is placed from, and placing it is what checks the whole form.
  review: z.object({}),
} as const;

/** A field message per input, keyed the way the form state is. */
export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

/**
 * The line index a server field name refers to, or `null` when it names
 * something else. The checkout refuses a line with `items.3.quantity`, and the
 * third line of the payload is the third line of the cart — the shopper has to
 * be told which product, not which index.
 */
export function lineIndexOfField(field: string): number | null {
  const match = /^items\.(\d+)\./.exec(field);

  if (match === null) {
    return null;
  }

  const index = Number.parseInt(match[1] ?? '', 10);

  return Number.isInteger(index) ? index : null;
}

/** The typed values the order is placed from, with empty boxes left out. */
export function toCheckoutInput(
  values: CheckoutFormValues,
  items: CheckoutItemInput[],
  promoCode: string | null,
): CheckoutInput {
  return {
    customerName: values.customerName.trim(),
    customerEmail: values.customerEmail.trim(),
    customerPhone: values.customerPhone.trim(),
    country: values.country.trim(),
    city: values.city.trim(),
    street: values.street.trim(),
    postalCode: values.postalCode.trim() === '' ? undefined : values.postalCode.trim(),
    notes: values.notes.trim() === '' ? undefined : values.notes.trim(),
    deliveryMethod: values.deliveryMethod,
    paymentMethod: values.paymentMethod,
    // No promo code means the field is left out of the request rather than sent
    // as `null`. The server takes an absent field as "no code" and `null` as a
    // value it does not recognise, which turned every checkout without a code
    // into a refusal of a code nobody had entered.
    promoCode: promoCode ?? undefined,
    items,
  };
}
