/**
 * Reviews: reading a product's, writing one's own, and voting on somebody
 * else's.
 *
 * Four rules shape this module, and each of them is a decision rather than an
 * accident:
 *
 * - **A product's rating is derived, never typed.** `Product.rating` and
 *   `Product.reviewCount` are denormalised columns so a catalogue card does not
 *   have to aggregate every review to draw a star; every write below recomputes
 *   both from the approved reviews inside the same transaction as the write
 *   itself. That is what keeps the number on the card and the reviews behind it
 *   from drifting apart, and it is why a review that is created or edited is
 *   never followed by a separate, later job.
 * - **A review is published when it is written.** `Review.isApproved` stays on
 *   the model — the column is what a moderation queue would move — but nothing
 *   in this project reviews what a customer wrote, and a review held for a
 *   moderator who does not exist is a form that silently swallowed what was
 *   typed. New reviews are therefore approved as they are created, and an
 *   operator who adds moderation later changes this one line.
 * - **A verified purchase is the order history's answer, not the client's.**
 *   The badge is computed here, from orders in the `DELIVERED` state, on every
 *   read. A client cannot claim it and a review cannot carry a stale copy of it.
 * - **One review per customer per product**, which the database enforces with a
 *   unique pair and this module answers with a 409 carrying the review that is
 *   already there. That conflict is not an error for a customer to understand:
 *   it is the interface's cue to offer the edit form instead.
 *
 * Photographs are rows pointing at files on disk. The files are written by the
 * upload middleware before these functions run, so a refusal here takes them
 * back off the disk — a request that fails leaves no orphan behind.
 */

import { unlink } from 'node:fs/promises';

import type { Prisma } from '@prisma/client';

import { prisma, type TransactionClient } from '../database/index.js';
import type { AuthUser } from '../middleware/auth.js';
import type { Paginated } from '../types/api.js';
import { ApiError } from '../utils/apiError.js';
import { reviewImageFilename, reviewImagePath, reviewImageUrl } from '../utils/uploads.js';

/** How many reviews a product's page asks for by default. */
export const REVIEWS_LIMIT = 10;

/** How many reviews one customer may write in one window, and how long a window is. */
export const REVIEW_RATE_LIMIT = { windowMs: 60 * 60 * 1000, max: 5 } as const;

/** The orderings the list offers. */
export const REVIEW_SORTS = ['newest', 'highest', 'lowest'] as const;

export type ReviewSort = (typeof REVIEW_SORTS)[number];

/** An uploaded photograph as the client reads it. */
export type ReviewImageDto = {
  id: string;
  /** Path under the API's origin, for example `/uploads/reviews/<uuid>.jpg`. */
  url: string;
  sortOrder: number;
};

/** One review as the client reads it. */
export type ReviewDto = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  /** Display name, which the API adds so the client never sees the account. */
  authorName: string;
  /**
   * True when the author has an order containing this product that has been
   * delivered. Computed per request from the order history.
   */
  isVerifiedPurchase: boolean;
  /** How many customers found it helpful, and how many did not. */
  helpfulYes: number;
  helpfulNo: number;
  /** The viewer's own vote: `1`, `-1`, or `0` for no opinion or nobody signed in. */
  myVote: -1 | 0 | 1;
  images: ReviewImageDto[];
};

/** What the summary block draws. */
export type ReviewSummaryDto = {
  /** The mean of the approved ratings, rounded to one decimal. `0` when there are none. */
  average: number;
  /** How many approved reviews there are. */
  total: number;
  /** How many of them come from a customer whose order was delivered. */
  verified: number;
  /** How many reviews each rating has, from five stars down to one. */
  distribution: { rating: number; count: number }[];
};

/** A page of reviews, with the summary drawn above them. */
export type ReviewPageDto = Paginated<ReviewDto> & {
  /**
   * The whole product's summary, not the filtered page's: a shopper who filtered
   * to one star still needs to see how the rest of the ratings fall, and a
   * distribution computed over the filtered set would show one bar at 100%.
   */
  summary: ReviewSummaryDto;
};

/** What writing a review sends. */
export type ReviewInput = {
  rating: number;
  title?: string | undefined;
  body: string;
};

const REVIEW_SELECT = {
  id: true,
  productId: true,
  userId: true,
  rating: true,
  title: true,
  body: true,
  isApproved: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { firstName: true, lastName: true } },
  images: { select: { id: true, url: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } },
} as const;

type ReviewRow = Prisma.ReviewGetPayload<{ select: typeof REVIEW_SELECT }>;

/** What the counts and the viewer's votes look like by the time a row is drawn. */
type SideData = {
  verified: Set<string>;
  counts: Map<string, { yes: number; no: number }>;
  votes: Map<string, -1 | 1>;
};

/**
 * One row as the client reads it. Written once, because a review is the same
 * object whether it was listed, created, or edited, and three copies of this
 * mapping would be three chances for the shape to drift.
 */
function toReviewDto(row: ReviewRow, side: SideData): ReviewDto {
  const counts = side.counts.get(row.id);

  return {
    id: row.id,
    productId: row.productId,
    userId: row.userId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    isApproved: row.isApproved,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    authorName: `${row.user.firstName} ${row.user.lastName}`,
    isVerifiedPurchase: side.verified.has(row.userId),
    helpfulYes: counts?.yes ?? 0,
    helpfulNo: counts?.no ?? 0,
    myVote: side.votes.get(row.id) ?? 0,
    images: row.images.map((image) => ({
      id: image.id,
      url: image.url,
      sortOrder: image.sortOrder,
    })),
  };
}

/** The product a review belongs to, or a 404. Only a listed product is reviewable. */
async function requireProductId(slug: string): Promise<string> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });

  if (product === null) {
    throw ApiError.notFound('This product does not exist.');
  }

  return product.id;
}

/** Newest first, best first, or worst first. Every one of them breaks ties by date. */
function orderFor(sort: ReviewSort) {
  if (sort === 'highest') {
    return [{ rating: 'desc' as const }, { createdAt: 'desc' as const }, { id: 'asc' as const }];
  }

  if (sort === 'lowest') {
    return [{ rating: 'asc' as const }, { createdAt: 'desc' as const }, { id: 'asc' as const }];
  }

  return [{ createdAt: 'desc' as const }, { id: 'asc' as const }];
}

/**
 * Which of these customers have taken delivery of this product.
 *
 * One query for the whole page rather than one per review: an order line is what
 * makes a purchase real, and the badge is asked of the orders that were
 * delivered, which is the point at which the customer has the thing in hand.
 */
async function verifiedAuthors(productId: string, userIds: string[]): Promise<Set<string>> {
  if (userIds.length === 0) {
    return new Set();
  }

  const orders = await prisma.order.findMany({
    where: {
      status: 'DELIVERED',
      userId: { in: userIds },
      items: { some: { productId } },
    },
    select: { userId: true },
    distinct: ['userId'],
  });

  return new Set(orders.map((order) => order.userId).filter((id): id is string => id !== null));
}

/** Helpful and unhelpful counts for a page of reviews, in one grouped query. */
async function voteCounts(reviewIds: string[]): Promise<Map<string, { yes: number; no: number }>> {
  const counts = new Map<string, { yes: number; no: number }>();

  if (reviewIds.length === 0) {
    return counts;
  }

  const rows = await prisma.reviewVote.groupBy({
    by: ['reviewId', 'value'],
    where: { reviewId: { in: reviewIds } },
    _count: { _all: true },
  });

  for (const row of rows) {
    const entry = counts.get(row.reviewId) ?? { yes: 0, no: 0 };

    if (row.value > 0) {
      entry.yes += row._count._all;
    } else {
      entry.no += row._count._all;
    }

    counts.set(row.reviewId, entry);
  }

  return counts;
}

/** How the signed-in viewer voted on each of a page of reviews. */
async function myVotes(
  userId: string | undefined,
  reviewIds: string[],
): Promise<Map<string, -1 | 1>> {
  const votes = new Map<string, -1 | 1>();

  if (userId === undefined || reviewIds.length === 0) {
    return votes;
  }

  const rows = await prisma.reviewVote.findMany({
    where: { userId, reviewId: { in: reviewIds } },
    select: { reviewId: true, value: true },
  });

  for (const row of rows) {
    votes.set(row.reviewId, row.value > 0 ? 1 : -1);
  }

  return votes;
}

/** Everything a page of rows needs besides the rows themselves. */
async function sideDataFor(
  productId: string,
  rows: readonly ReviewRow[],
  viewerId: string | undefined,
): Promise<SideData> {
  const reviewIds = rows.map((row) => row.id);

  const [verified, counts, votes] = await Promise.all([
    verifiedAuthors(
      productId,
      rows.map((row) => row.userId),
    ),
    voteCounts(reviewIds),
    myVotes(viewerId, reviewIds),
  ]);

  return { verified, counts, votes };
}

/** The same three answers for a single review, which is what a write returns. */
async function sideDataForOne(
  productId: string,
  row: ReviewRow,
  viewerId: string | undefined,
): Promise<SideData> {
  const [verified, counts, votes] = await Promise.all([
    verifiedAuthors(productId, [row.userId]),
    voteCounts([row.id]),
    myVotes(viewerId, [row.id]),
  ]);

  return { verified, counts, votes };
}

/**
 * The product's rating and how many reviews it has, recomputed from the
 * approved rows.
 *
 * Called inside the transaction that changed a review, so the columns and the
 * reviews they describe are never apart. An aggregate over an indexed column is
 * a cheap question; a card that shows a stale average is not.
 */
async function recomputeRating(tx: TransactionClient, productId: string): Promise<void> {
  const aggregate = await tx.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await tx.product.update({
    where: { id: productId },
    data: {
      // Two decimals is more than the interface prints and fewer than the float
      // the average actually is, which keeps the stored number stable.
      rating: Math.round((aggregate._avg.rating ?? 0) * 100) / 100,
      reviewCount: aggregate._count._all,
    },
  });
}

/** The summary block: the average, the total, the verified share, and the bars. */
async function summaryOf(productId: string): Promise<ReviewSummaryDto> {
  const [aggregate, distributionRows, reviewers] = await Promise.all([
    prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ]);

  const counts = new Map(distributionRows.map((row) => [row.rating, row._count._all]));
  const verified = await verifiedAuthors(
    productId,
    reviewers.map((row) => row.userId),
  );

  return {
    average: Math.round((aggregate._avg.rating ?? 0) * 10) / 10,
    total: aggregate._count._all,
    verified: verified.size,
    // Five stars down to one, with a zero for a rating nobody gave: the bars are
    // drawn in this order, and an absent rating is a bar with no length rather
    // than a bar that is missing.
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: counts.get(rating) ?? 0,
    })),
  };
}

export type ListReviewsQuery = {
  page: number;
  limit: number;
  sort: ReviewSort;
  /** One star rating to narrow to, or nothing for all of them. */
  rating?: number | undefined;
  /** The signed-in viewer, which decides which votes come back as their own. */
  viewerId?: string | undefined;
};

/** One page of a product's approved reviews, with the product's summary. */
export async function listProductReviews(
  slug: string,
  query: ListReviewsQuery,
): Promise<ReviewPageDto> {
  const productId = await requireProductId(slug);
  const { page, limit, sort, rating, viewerId } = query;

  const where: Prisma.ReviewWhereInput = {
    productId,
    isApproved: true,
    ...(rating === undefined ? {} : { rating }),
  };

  const [rows, total, summary] = await Promise.all([
    prisma.review.findMany({
      where,
      select: REVIEW_SELECT,
      orderBy: orderFor(sort),
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
    summaryOf(productId),
  ]);

  const side = await sideDataFor(productId, rows, viewerId);

  return {
    items: rows.map((row) => toReviewDto(row, side)),
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
    summary,
  };
}

/**
 * The viewer's own review of a product, or `null` when they have not written
 * one.
 *
 * The interface asks this before it draws the form: a 409 arriving after a
 * customer has typed their review is a bug report in their hands, and "have I
 * reviewed this" is a question the page can ask first.
 */
export async function getOwnReview(userId: string, slug: string): Promise<ReviewDto | null> {
  const productId = await requireProductId(slug);

  const row = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: REVIEW_SELECT,
  });

  if (row === null) {
    return null;
  }

  return toReviewDto(row, await sideDataForOne(productId, row, userId));
}

/**
 * Writes a review, or refuses because one already exists.
 *
 * The refusal carries the review that is there, so the interface can open the
 * edit form on it rather than asking the customer to start again.
 */
export async function createReview(
  user: Pick<AuthUser, 'id'>,
  slug: string,
  input: ReviewInput,
): Promise<ReviewDto> {
  const productId = await requireProductId(slug);

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  });

  if (existing !== null) {
    throw ApiError.conflict(
      'review_exists',
      'You have already reviewed this product. Edit your review instead.',
      { reviewId: existing.id },
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        productId,
        userId: user.id,
        rating: input.rating,
        title: input.title ?? null,
        body: input.body,
        // Nothing moderates what a customer writes here; see the note above.
        isApproved: true,
      },
      select: REVIEW_SELECT,
    });

    await recomputeRating(tx, productId);

    return review;
  });

  return toReviewDto(created, await sideDataForOne(productId, created, user.id));
}

/** Rewrites the viewer's review. A customer who has not written one gets a 404. */
export async function updateReview(
  user: Pick<AuthUser, 'id'>,
  slug: string,
  input: ReviewInput,
): Promise<ReviewDto> {
  const productId = await requireProductId(slug);

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
    select: { id: true },
  });

  if (existing === null) {
    throw ApiError.notFound('You have not reviewed this product.');
  }

  const written = await prisma.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: existing.id },
      data: { rating: input.rating, title: input.title ?? null, body: input.body },
      select: REVIEW_SELECT,
    });

    await recomputeRating(tx, productId);

    return review;
  });

  return toReviewDto(written, await sideDataForOne(productId, written, user.id));
}

/**
 * Records the viewer's opinion of a review: helpful, not helpful, or neither.
 *
 * A vote of `0` withdraws the row rather than storing a third value, because
 * having no opinion and having changed one's mind are the same state. Voting on
 * one's own review is refused: the count is meant to be other customers' answer.
 */
export async function voteOnReview(
  userId: string,
  reviewId: string,
  value: -1 | 0 | 1,
): Promise<{ helpfulYes: number; helpfulNo: number; myVote: -1 | 0 | 1 }> {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, isApproved: true },
    select: { id: true, userId: true },
  });

  if (review === null) {
    throw ApiError.notFound('This review does not exist.');
  }

  if (review.userId === userId) {
    throw ApiError.forbidden('You cannot vote on your own review.');
  }

  if (value === 0) {
    await prisma.reviewVote.deleteMany({ where: { reviewId, userId } });
  } else {
    await prisma.reviewVote.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, value },
      update: { value },
    });
  }

  const counts = await voteCounts([reviewId]);
  const entry = counts.get(reviewId) ?? { yes: 0, no: 0 };

  return { helpfulYes: entry.yes, helpfulNo: entry.no, myVote: value };
}

/** The viewer's own review, with the photographs it already carries. */
async function ownReviewForImages(userId: string, slug: string) {
  const productId = await requireProductId(slug);

  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
    select: { id: true, images: { select: { id: true }, orderBy: { sortOrder: 'asc' } } },
  });

  if (review === null) {
    throw ApiError.notFound('Write your review before adding photographs to it.');
  }

  return review;
}

/**
 * Attaches photographs to the viewer's own review.
 *
 * The files have already been written by the upload middleware when this runs,
 * so a request refused here — no review to attach them to, or no room left for
 * more pictures — has to take its files back off the disk. That is what the
 * catch below does: a refusal leaves nothing behind.
 */
export async function addReviewImages(
  userId: string,
  slug: string,
  files: Express.Multer.File[],
  limit: number,
): Promise<ReviewImageDto[]> {
  const review = await ownReviewForImages(userId, slug);

  if (review.images.length + files.length > limit) {
    throw ApiError.validationFailed({
      fields: { images: `A review can carry at most ${limit} photographs.` },
    });
  }

  try {
    const start = review.images.length;

    await prisma.reviewImage.createMany({
      data: files.map((file, index) => ({
        reviewId: review.id,
        url: reviewImageUrl(file.filename),
        sortOrder: start + index,
      })),
    });
  } catch (error) {
    await discard(files);
    throw error;
  }

  return prisma.reviewImage.findMany({
    where: { reviewId: review.id },
    select: { id: true, url: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
  });
}

/** Removes one of the viewer's own photographs, file and row together. */
export async function removeReviewImage(
  userId: string,
  slug: string,
  imageId: string,
): Promise<void> {
  const review = await ownReviewForImages(userId, slug);

  const image = await prisma.reviewImage.findFirst({
    where: { id: imageId, reviewId: review.id },
    select: { id: true, url: true },
  });

  if (image === null) {
    throw ApiError.notFound('That photograph is not on your review.');
  }

  await prisma.reviewImage.delete({ where: { id: image.id } });

  const filename = reviewImageFilename(image.url);

  if (filename !== null) {
    // A file that is already gone is not a failure; the row it described is.
    await unlink(reviewImagePath(filename)).catch(() => undefined);
  }
}

/** Takes uploaded files back off the disk after a refusal. */
async function discard(files: Express.Multer.File[]): Promise<void> {
  await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
}
