/**
 * Wishlist.
 *
 * A wishlist holds products, not variants, and one account can hold a product
 * once — the table has a unique key on the pair, so adding something twice
 * updates nothing rather than creating a second row.
 *
 * The list is returned with the same product shape the catalog uses, mapped by
 * `listProductsByIds`, so a wishlist card and a catalog card are the same
 * object. A product that has been switched off drops out of the list: it cannot
 * be bought, so offering it as something to come back for would be a lie.
 *
 * The list is read in the language the account is browsing in, so a wishlist
 * card carries the same name the catalogue card of the same product carries.
 */

import { Prisma } from '@prisma/client';

import { prisma } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';
import type { CatalogLocale } from '../utils/locale.js';
import { listProductsByIds, type ProductSummary } from './product.service.js';

export type WishlistEntryDto = {
  id: string;
  createdAt: string;
  product: ProductSummary;
};

export type AddResult = {
  entry: WishlistEntryDto;
  /** False when the product was already on the list. */
  created: boolean;
};

async function toEntries(
  rows: { id: string; productId: string; createdAt: Date }[],
  lang: CatalogLocale,
): Promise<WishlistEntryDto[]> {
  const products = await listProductsByIds(
    rows.map((row) => row.productId),
    lang,
  );
  const byId = new Map(products.map((product) => [product.id, product]));

  return rows.flatMap((row) => {
    const product = byId.get(row.productId);

    return product === undefined
      ? []
      : [{ id: row.id, createdAt: row.createdAt.toISOString(), product }];
  });
}

/** The same mapping for a single row, for the two paths that return one entry. */
async function toEntry(
  row: {
    id: string;
    productId: string;
    createdAt: Date;
  },
  lang: CatalogLocale,
): Promise<WishlistEntryDto> {
  const [entry] = await toEntries([row], lang);

  if (entry === undefined) {
    throw ApiError.notFound('This product does not exist.');
  }

  return entry;
}

/** The account's wishlist, most recently added first. */
export async function listWishlist(
  userId: string,
  lang: CatalogLocale,
): Promise<WishlistEntryDto[]> {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId },
    select: { id: true, productId: true, createdAt: true },
    // `id` breaks the tie between two items saved in the same millisecond.
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return toEntries(rows, lang);
}

/**
 * Adds a product to the wishlist. Adding something already saved is not an
 * error: the client sends the request without checking first, and the answer
 * says which of the two happened.
 */
export async function addToWishlist(
  userId: string,
  productId: string,
  lang: CatalogLocale,
): Promise<AddResult> {
  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true },
    select: { id: true },
  });

  if (product === null) {
    throw ApiError.notFound('This product does not exist.');
  }

  try {
    const created = await prisma.wishlistItem.create({
      data: { userId, productId },
      select: { id: true, productId: true, createdAt: true },
    });

    return { entry: await toEntry(created, lang), created: true };
  } catch (error) {
    // P2002 is the unique key on (userId, productId): someone saved it twice,
    // or two requests for the same product raced.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const existing = await prisma.wishlistItem.findUniqueOrThrow({
        where: { userId_productId: { userId, productId } },
        select: { id: true, productId: true, createdAt: true },
      });

      return { entry: await toEntry(existing, lang), created: false };
    }

    throw error;
  }
}

/** Removes a product from the wishlist. Removing what is not there is a 404. */
export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const removed = await prisma.wishlistItem.deleteMany({ where: { userId, productId } });

  if (removed.count === 0) {
    throw ApiError.notFound('This product is not on your wishlist.');
  }
}
