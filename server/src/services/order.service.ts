/**
 * Orders.
 *
 * Two rules shape everything here.
 *
 * Nothing about money or stock comes from the client. A checkout payload names
 * products and quantities; the price, the stock and the totals are read from
 * the database inside the transaction that creates the order. A client that
 * sends its own price has it ignored.
 *
 * Stock is never allowed to go negative, and it is restored exactly once. Both
 * are enforced by conditional single-row updates rather than by reading a value
 * and deciding afterwards: `updateMany` with `stock: { gte: quantity }` either
 * decrements or matches nothing, and cancelling matches only an order that is
 * still `PENDING` or `CONFIRMED`, so a second cancel finds nothing to restore.
 *
 * Money is an integer number of tiyin throughout. 1 so'm is 100 tiyin.
 */

import { Prisma } from '@prisma/client';

import { prisma, type TransactionClient } from '../database/index.js';
import type { Paginated } from '../types/api.js';
import { ApiError } from '../utils/apiError.js';

import { FREE_DELIVERY_FROM } from './delivery.service.js';
import { validatePromoCodeIn } from './promo.service.js';

/** Delivery options a checkout payload may ask for. */
export const DELIVERY_METHODS = ['COURIER', 'PICKUP'] as const;

/**
 * Payment codes, defined in `config/payments.ts` so the delivery policy can
 * publish the same list the checkout accepts. Re-exported here because this is
 * where the routes and the service read them from.
 */
import { PAYMENT_METHODS, type PaymentMethodValue } from '../config/payments.js';

export { PAYMENT_METHODS };
export type { PaymentMethodValue };

export type DeliveryMethodValue = (typeof DELIVERY_METHODS)[number];

/** Statuses an order can still be cancelled from. */
export const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'] as const;

/**
 * Largest value the money columns can hold: `Int` is a 32-bit signed integer,
 * which is 21 474 836 so'm in tiyin. The seed keeps prices well below it, but a
 * basket of several expensive products can still cross the line, so checkout
 * checks the totals before it writes them.
 */
const MAX_MONEY = 2_147_483_647;

/**
 * Flat courier fee, 25 000 so'm. Pickup is free, and a courier order above the
 * free-delivery threshold is free as well — see `FREE_DELIVERY_FROM` in the
 * delivery service, which the cart's progress bar also reads. This is a
 * first-version business rule rather than a configured one; when shipping bands
 * arrive they belong in configuration, not here.
 */
export const COURIER_FEE = 2_500_000;

/** How many times a checkout retries after a write conflict on the order number. */
const CHECKOUT_RETRIES = 3;

export type CheckoutItemInput = {
  productId: string;
  variantId?: string | null | undefined;
  quantity: number;
};

export type CheckoutInput = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  country: string;
  city: string;
  street: string;
  postalCode?: string | undefined;
  notes?: string | undefined;
  deliveryMethod: DeliveryMethodValue;
  paymentMethod: PaymentMethodValue;
  /**
   * A promo code the shopper typed, if any. It is checked inside the same
   * transaction that prices the order, and refused with a 422 under this field
   * when it has stopped working — the discount is never taken from the client.
   */
  promoCode?: string | null | undefined;
  items: CheckoutItemInput[];
};

export type OrderItemDto = {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  productSlug: string | null;
  imageUrl: string | null;
};

export type OrderDto = {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: string;
  subtotal: number;
  discountTotal: number;
  /** The code that was used, or `null`. */
  promoCode: string | null;
  /** Minor units the code took off the subtotal. */
  promoDiscount: number;
  shippingTotal: number;
  total: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingCountry: string;
  shippingCity: string;
  shippingStreet: string;
  shippingPostalCode: string | null;
  notes: string | null;
  deliveryMethod: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemDto[];
};

const ORDER_ITEM_SELECT = {
  id: true,
  orderId: true,
  productId: true,
  name: true,
  unitPrice: true,
  quantity: true,
  lineTotal: true,
  product: {
    select: {
      slug: true,
      images: { select: { url: true }, orderBy: { sortOrder: 'asc' }, take: 1 },
    },
  },
} satisfies Prisma.OrderItemSelect;

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  userId: true,
  status: true,
  subtotal: true,
  discountTotal: true,
  promoCode: true,
  promoDiscount: true,
  shippingTotal: true,
  total: true,
  currency: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  shippingCountry: true,
  shippingCity: true,
  shippingStreet: true,
  shippingPostalCode: true,
  notes: true,
  deliveryMethod: true,
  paymentMethod: true,
  paymentStatus: true,
  createdAt: true,
  updatedAt: true,
  items: { select: ORDER_ITEM_SELECT, orderBy: { id: 'asc' } },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT }>;
type OrderItemRow = Prisma.OrderItemGetPayload<{ select: typeof ORDER_ITEM_SELECT }>;

function toOrderItem(row: OrderItemRow): OrderItemDto {
  const [firstImage] = row.product?.images ?? [];

  return {
    id: row.id,
    orderId: row.orderId,
    productId: row.productId,
    name: row.name,
    unitPrice: row.unitPrice,
    quantity: row.quantity,
    lineTotal: row.lineTotal,
    productSlug: row.product?.slug ?? null,
    imageUrl: firstImage?.url ?? null,
  };
}

function toOrder(row: OrderRow): OrderDto {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    userId: row.userId,
    status: row.status,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    promoCode: row.promoCode,
    promoDiscount: row.promoDiscount,
    shippingTotal: row.shippingTotal,
    total: row.total,
    currency: row.currency,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    shippingCountry: row.shippingCountry,
    shippingCity: row.shippingCity,
    shippingStreet: row.shippingStreet,
    shippingPostalCode: row.shippingPostalCode,
    notes: row.notes,
    deliveryMethod: row.deliveryMethod,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map(toOrderItem),
  };
}

/**
 * The next order number for the current year: `ZY-2026-1005` after `1001` to
 * `1004`. Read inside the transaction, and the transaction is serialisable, so
 * two checkouts cannot pick the same number; if they race anyway the retry in
 * `createOrder` runs the whole checkout again.
 */
function nextOrderNumber(latest: string | null, year: number): string {
  const prefix = `ZY-${year}-`;
  const lastSequence = latest === null ? 1000 : Number.parseInt(latest.slice(prefix.length), 10);
  const nextSequence = Number.isNaN(lastSequence) ? 1000 : lastSequence + 1;

  return `${prefix}${nextSequence}`;
}

/** A field-level checkout failure, shaped like every other 422 the API returns. */
function itemError(index: number, field: string, message: string): ApiError {
  return ApiError.validationFailed({ fields: { [`items.${index}.${field}`]: message } });
}

/**
 * Merges lines that name the same product, summing their quantities. Two lines
 * of three and four are seven of the same thing, and checking each line against
 * stock separately would let a client order more than exists.
 */
function mergeDuplicateLines(items: CheckoutItemInput[]): CheckoutItemInput[] {
  const merged = new Map<string, CheckoutItemInput>();

  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ''}`;
    const existing = merged.get(key);

    if (existing === undefined) {
      merged.set(key, { ...item });
    } else {
      existing.quantity += item.quantity;
    }
  }

  return [...merged.values()];
}

type PreparedLine = {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** What this line saves against the compare-at price, 0 when there is none. */
  discount: number;
};

/**
 * Checks every line against the database and prices it.
 *
 * Product existence, the active flag, the variant's ownership by the product,
 * and available stock are all checked here, and each failure names the line it
 * belongs to so the checkout form can point at the right row.
 */
async function prepareLines(
  tx: TransactionClient,
  items: CheckoutItemInput[],
): Promise<PreparedLine[]> {
  const productIds = [...new Set(items.map((item) => item.productId))];

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      price: true,
      compareAtPrice: true,
      stock: true,
      isActive: true,
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  // A variant reference is accepted so a client can send what the shopper
  // picked, but the order line records the product: `OrderItem` has no variant
  // column. The reference is checked so a payload cannot name a variant that
  // belongs to a different product.
  const variantChecks = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.variantId !== undefined && item.variantId !== null);

  if (variantChecks.length > 0) {
    const variants = await tx.productVariant.findMany({
      where: { id: { in: variantChecks.map(({ item }) => item.variantId as string) } },
      select: { id: true, productId: true },
    });

    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    for (const { item, index } of variantChecks) {
      const variant = variantById.get(item.variantId as string);

      if (variant === undefined) {
        throw itemError(index, 'variantId', 'This option is no longer available.');
      }

      if (variant.productId !== item.productId) {
        throw itemError(index, 'variantId', 'This option does not belong to the chosen product.');
      }
    }
  }

  return items.map((item, index) => {
    const product = byId.get(item.productId);

    if (product === undefined) {
      throw itemError(index, 'productId', 'This product no longer exists.');
    }

    if (!product.isActive) {
      throw itemError(index, 'productId', 'This product is no longer for sale.');
    }

    if (product.stock < item.quantity) {
      throw itemError(
        index,
        'quantity',
        product.stock === 0
          ? 'This product is out of stock.'
          : `Only ${product.stock} left in stock.`,
      );
    }

    const savingPerUnit =
      product.compareAtPrice === null ? 0 : Math.max(0, product.compareAtPrice - product.price);

    const lineTotal = product.price * item.quantity;

    // Money columns are 32-bit integers, so a line has to fit in one. Two of
    // the most expensive products already exceed it, and the client gets a
    // readable reason instead of a database range error.
    if (lineTotal > MAX_MONEY) {
      throw itemError(
        index,
        'quantity',
        'This line is too large to order at once. Reduce the quantity.',
      );
    }

    return {
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity: item.quantity,
      lineTotal,
      discount: savingPerUnit * item.quantity,
    };
  });
}

/** True when a write conflict or a duplicate order number means "run it again". */
function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034 is a serialisation failure or deadlock; P2002 here can only be the
    // order number, because the rest of the insert has no other unique column.
    return error.code === 'P2034' || error.code === 'P2002';
  }

  return false;
}

/**
 * Creates an order for the signed-in customer.
 *
 * The whole checkout is one serialisable transaction: prices and stock are read
 * and re-checked, stock is decremented, the order number is allocated, and the
 * order is written. If anything fails, nothing is left behind — a rejected
 * checkout never takes stock with it.
 */
export async function createOrder(userId: string, input: CheckoutInput): Promise<OrderDto> {
  const items = mergeDuplicateLines(input.items);
  const year = new Date().getFullYear();

  for (let attempt = 1; attempt <= CHECKOUT_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const lines = await prepareLines(tx, items);

          for (const line of lines) {
            // Conditional decrement: it matches only while enough stock is
            // still there, so two checkouts for the last item cannot both win.
            const decremented = await tx.product.updateMany({
              where: { id: line.productId, isActive: true, stock: { gte: line.quantity } },
              data: { stock: { decrement: line.quantity } },
            });

            if (decremented.count === 0) {
              throw itemError(
                items.findIndex((item) => item.productId === line.productId),
                'quantity',
                'This product sold out while you were checking out.',
              );
            }
          }

          const latest = await tx.order.findFirst({
            where: { orderNumber: { startsWith: `ZY-${year}-` } },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
          });

          const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
          const shippingTotal =
            input.deliveryMethod === 'COURIER' && subtotal < FREE_DELIVERY_FROM ? COURIER_FEE : 0;
          const discountTotal = lines.reduce((sum, line) => sum + line.discount, 0);

          // The code is read and priced here rather than trusted from the cart:
          // the shopper's copy of the discount is a sentence on their screen,
          // and this one is what they are charged.
          const promo =
            input.promoCode == null || input.promoCode.trim() === ''
              ? null
              : await validatePromoCodeIn(tx, input.promoCode, subtotal);

          const promoDiscount = promo?.discount ?? 0;

          // Each line fits, but their sum still has to. Checked before anything
          // is written, so an oversized basket fails without taking stock.
          if (Math.max(subtotal, discountTotal) + shippingTotal > MAX_MONEY) {
            throw ApiError.validationFailed({
              fields: {
                items:
                  'This order is too large to place at once. Please split it into smaller orders.',
              },
            });
          }

          const order = await tx.order.create({
            data: {
              orderNumber: nextOrderNumber(latest?.orderNumber ?? null, year),
              userId,
              subtotal,
              // What the shopper saved against the compare-at prices of the
              // day. It is a record of the saving, not a further deduction:
              // `unitPrice` is already the price being charged.
              discountTotal,
              promoCode: promo?.code ?? null,
              promoDiscount,
              shippingTotal,
              total: Math.max(0, subtotal - promoDiscount) + shippingTotal,
              customerName: input.customerName,
              customerEmail: input.customerEmail,
              customerPhone: input.customerPhone,
              shippingCountry: input.country,
              shippingCity: input.city,
              shippingStreet: input.street,
              shippingPostalCode: input.postalCode ?? null,
              notes: input.notes ?? null,
              deliveryMethod: input.deliveryMethod,
              paymentMethod: input.paymentMethod,
              items: {
                create: lines.map((line) => ({
                  productId: line.productId,
                  name: line.name,
                  unitPrice: line.unitPrice,
                  quantity: line.quantity,
                  lineTotal: line.lineTotal,
                })),
              },
            },
            select: ORDER_SELECT,
          });

          return toOrder(order);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (!isRetryable(error) || attempt === CHECKOUT_RETRIES) {
        throw error;
      }
    }
  }

  // The loop returns or throws before this point.
  throw ApiError.conflict('checkout_failed', 'The order could not be placed. Please try again.');
}

/** Orders belonging to one account, newest first. */
export async function listOrders(
  userId: string,
  page: number,
  limit: number,
): Promise<Paginated<OrderDto>> {
  const where = { userId };

  const [rows, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      select: ORDER_SELECT,
      // `id` breaks the tie between two orders placed in the same millisecond,
      // so paging cannot repeat or skip one.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items: rows.map(toOrder),
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * One order. Another account's order answers 404 rather than 403: whether an
 * order exists is not something a stranger should be able to ask.
 */
export async function getOrder(userId: string, orderId: string): Promise<OrderDto> {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: ORDER_SELECT,
  });

  if (order === null) {
    throw ApiError.notFound('This order does not exist.');
  }

  return toOrder(order);
}

/**
 * Cancels an order and puts its stock back.
 *
 * The status change is a conditional update, so exactly one caller can perform
 * it: a second cancel — even one racing the first — matches nothing, and the
 * stock is restored once. Stock goes back to products that still exist; a
 * product deleted since the order was placed has nothing to restore.
 */
export async function cancelOrder(userId: string, orderId: string): Promise<OrderDto> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, paymentStatus: true, items: { select: ORDER_ITEM_SELECT } },
    });

    if (existing === null) {
      throw ApiError.notFound('This order does not exist.');
    }

    const cancelled = await tx.order.updateMany({
      where: { id: orderId, userId, status: { in: [...CANCELLABLE_STATUSES] } },
      data: {
        status: 'CANCELLED',
        // A paid order is refunded when it is cancelled. Payment is simulated
        // in this version, so only an order that was marked paid reaches this.
        ...(existing.paymentStatus === 'PAID' ? { paymentStatus: 'REFUNDED' } : {}),
      },
    });

    if (cancelled.count === 0) {
      throw ApiError.conflict(
        'order_not_cancellable',
        `An order that is ${existing.status.toLowerCase()} can no longer be cancelled.`,
      );
    }

    for (const item of existing.items) {
      if (item.productId === null) {
        continue;
      }

      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: ORDER_SELECT,
    });

    return toOrder(order);
  });
}
