/**
 * Review votes.
 *
 * A vote is about a review rather than about a product, so it is addressed by
 * the review's own id and lives outside the catalog router. The whole router
 * sits behind `requireAuth`: an opinion about somebody's review is attached to
 * the account that holds it, and a visitor with no account would have nowhere to
 * keep one.
 *
 * A vote is a small, repeatable action — a customer may change their mind three
 * times — so the limit is generous and per account.
 */

import { Router } from 'express';
import { z } from 'zod';

import { voteReviewHandler } from '../controllers/review.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

/** How many votes one account may cast in one window, and how long a window is. */
const VOTE_LIMIT = { windowMs: 15 * 60 * 1000, max: 60 } as const;

const reviewIdParamsSchema = z.object({
  reviewId: z.uuid('Choose a valid review.'),
});

/**
 * `1` is helpful, `-1` is not, and `0` withdraws a vote that was already cast —
 * which is why zero is a value here rather than the absence of a body.
 */
const voteBodySchema = z.object({
  value: z.union(
    [z.literal(-1), z.literal(0), z.literal(1)],
    'Vote helpful, unhelpful, or take the vote back.',
  ),
});

const voteLimiter = rateLimit({
  name: 'reviews:vote',
  windowMs: VOTE_LIMIT.windowMs,
  max: VOTE_LIMIT.max,
  code: 'too_many_votes',
  message: 'That is a lot of votes in a short time. Please try again shortly.',
  key: (request) => request.user?.id,
});

export const reviewRouter = Router();

reviewRouter.use(requireAuth);

reviewRouter.post(
  '/:reviewId/vote',
  voteLimiter,
  validate({ params: reviewIdParamsSchema, body: voteBodySchema }),
  voteReviewHandler,
);
