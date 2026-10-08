/**
 * Promo codes.
 *
 * A code is a row in `PromoCode`: a percentage or a fixed amount, optionally
 * limited to a window and to a minimum subtotal. Two callers ask about one, and
 * they ask the same question — "what does this code take off this basket?" — so
 * they go through the same function.
 *
 * The first caller is the cart, which wants to show the discount before the
 * shopper commits. Its subtotal comes from the browser, so what it gets is a
 * preview and nothing more: a client can send any number it likes and the worst
 * it can do is see an optimistic sentence on its own screen.
 *
 * The second caller is the checkout transaction, which computes the subtotal
 * from the prices in the database and is the only one whose answer is charged.
 * Both run `pricePromo` against the same row, so the number the shopper was
 * shown and the number they are charged agree whenever the basket did.
 *
 * What the code is worth is never read from the request. `discountValue` is a
 * percentage or an amount from the database, and the result is clamped so it can
 * never exceed the subtotal or push a total below zero.
 */

import type { PromoCode as PromoCodeRow, PromoDiscountType } from '@prisma/client';

import { prisma, type TransactionClient } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';

/** The most a percentage code may take off, as a whole percent. */
const MAX_PERCENT = 100;

/**
 * How a code is compared. A code is something a shopper types, often from a
 * leaflet, so it is matched without regard to case and without the spaces a
 * copy-and-paste brings along.
 */
export function normalisePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

/** What a valid code is worth for one subtotal. */
export type PromoResult = {
  /** The code as it is stored and will be written on the order. */
  code: string;
  discountType: PromoDiscountType;
  /** Whole percent or minor units, as stored. */
  discountValue: number;
  /** Minor units taken off this subtotal. */
  discount: number;
  /** Minor units the basket has to reach, so the cart can say why it stopped. */
  minSubtotal: number;
  /** Ceiling in minor units for a percentage, or `null` for no ceiling. */
  maxDiscount: number | null;
  /**
   * When the code stops working, or `null` for a code with no end date.
   *
   * The whole rule travels with the answer — the type, the value, the minimum,
   * and the ceiling — because the cart keeps the applied code while the shopper
   * goes on editing the basket, and it cannot ask the server about a quantity
   * that has not been settled yet. Those four fields are what let the cart price
   * the discount itself with the same arithmetic. What is charged is still
   * computed from the database at checkout and never from the browser.
   */
  expiresAt: string | null;
};

/** The row a request named, or a 422 on the field the shopper typed into. */
async function findPromoCode(code: string, client: TransactionClient): Promise<PromoCodeRow> {
  const normalised = normalisePromoCode(code);

  const row = await client.promoCode.findUnique({ where: { code: normalised } });

  if (row === null) {
    throw codeError('This code is not recognised.');
  }

  return row;
}

/** A refusal that belongs under the field the shopper typed into. */
function codeError(message: string): ApiError {
  return ApiError.validationFailed({ fields: { promoCode: message } });
}

/**
 * Checks a row against a subtotal and returns what it is worth.
 *
 * The checks run in the order a shopper would ask them: does the code exist, is
 * it switched on, is it in date, is the basket big enough. Each refusal names
 * what is wrong with the code rather than the basket, because that is the only
 * thing the shopper typed.
 */
export function pricePromo(row: PromoCodeRow, subtotal: number, now = new Date()): PromoResult {
  if (!row.isActive) {
    throw codeError('This code is no longer available.');
  }

  if (row.startsAt !== null && row.startsAt > now) {
    throw codeError('This code is not active yet.');
  }

  if (row.expiresAt !== null && row.expiresAt < now) {
    throw codeError('This code has expired.');
  }

  if (subtotal < row.minSubtotal) {
    throw codeError('Your basket is too small for this code.');
  }

  const raw =
    row.discountType === 'PERCENT'
      ? Math.floor((subtotal * Math.min(row.discountValue, MAX_PERCENT)) / 100)
      : row.discountValue;

  const capped = row.maxDiscount === null ? raw : Math.min(raw, row.maxDiscount);
  // A code never takes more than the goods are worth: the shipping fee is not
  // something a discount is allowed to eat into.
  const discount = Math.max(0, Math.min(capped, subtotal));

  return {
    code: row.code,
    discountType: row.discountType,
    discountValue: row.discountValue,
    discount,
    minSubtotal: row.minSubtotal,
    maxDiscount: row.maxDiscount,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

/** The same answer for a code that has only been typed, not yet stored. */
export async function validatePromoCode(code: string, subtotal: number): Promise<PromoResult> {
  return pricePromo(await findPromoCode(code, prisma), subtotal);
}

/**
 * The same answer again, inside the checkout transaction.
 *
 * It reads through the transaction client so the row is the one the order is
 * being written against, and it throws the same 422 the cart would have shown if
 * the code stopped working between the cart and the checkout button.
 */
export async function validatePromoCodeIn(
  tx: TransactionClient,
  code: string,
  subtotal: number,
): Promise<PromoResult> {
  return pricePromo(await findPromoCode(code, tx), subtotal);
}
