/**
 * The body the checkout sends, exercised where it went wrong.
 *
 * `toCheckoutInput` is the boundary between a form and the order endpoint, and
 * the failure it is worth guarding against is not a wrong value but a wrong
 * spelling of absence. The form values that are optional are left out of the
 * request when they are empty, and a `null` where the API expects an omitted or
 * empty string is refused as a value the endpoint does not recognise — which is
 * what happened: with no promo code applied, the checkout sent `promoCode: null`
 * and the server answered `422 {"promoCode":"Invalid input"}`, so an order
 * without a code was refused as if the code were bad.
 *
 * The assertion is therefore about the wire, not about the object: an empty
 * optional field must be `undefined` rather than a value, and `JSON.stringify` —
 * which is what the api client sends — drops exactly `undefined` and nothing
 * else. A `null` survives that round trip and is what the server refused.
 */

import { describe, expect, it } from 'vitest';

import { toCheckoutInput } from './checkout.rules';
import type { CheckoutFormValues } from './checkout.rules';
import type { CheckoutItemInput } from '@/types/order';

/** A complete form, so a test can vary one field and leave the rest valid. */
const form: CheckoutFormValues = {
  customerName: 'Oybek Karimov',
  customerEmail: 'oybek.karimov@ziyo.uz',
  customerPhone: '+998901234567',
  country: 'Uzbekistan',
  city: 'Tashkent',
  street: 'Amir Temur 1',
  postalCode: '',
  notes: '',
  deliveryMethod: 'COURIER',
  paymentMethod: 'CASH',
};

const items: CheckoutItemInput[] = [{ productId: 'product-1', quantity: 2, variantId: null }];

describe('toCheckoutInput', () => {
  it('leaves the promo code undefined when the basket has none', () => {
    expect(toCheckoutInput(form, items, null).promoCode).toBeUndefined();
  });

  it('sends the promo code when one is applied', () => {
    expect(toCheckoutInput(form, items, 'SAVE25K').promoCode).toBe('SAVE25K');
  });

  it('leaves an empty postal code and notes undefined rather than sending them empty', () => {
    const input = toCheckoutInput(form, items, null);

    expect(input.postalCode).toBeUndefined();
    expect(input.notes).toBeUndefined();
  });

  it('keeps a postal code that was filled in, trimmed', () => {
    const input = toCheckoutInput({ ...form, postalCode: ' 100000 ' }, items, null);

    expect(input.postalCode).toBe('100000');
  });

  it('drops the absent fields from the JSON body, and keeps the rest', () => {
    // What the api client actually puts on the wire. The three optional keys
    // exist on the object as `undefined`, which is a key a form can set and not
    // a key `JSON.stringify` will send — the assertion every one of these tests
    // is really about is this one.
    const body = JSON.parse(JSON.stringify(toCheckoutInput(form, items, null))) as Record<
      string,
      unknown
    >;

    expect(Object.keys(body).sort()).toEqual([
      'city',
      'country',
      'customerEmail',
      'customerName',
      'customerPhone',
      'deliveryMethod',
      'items',
      'paymentMethod',
      'street',
    ]);
  });
});
