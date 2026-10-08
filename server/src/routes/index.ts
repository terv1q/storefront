/**
 * Router for the resource groups the API exposes. The resource routers are
 * mounted here: auth in Stage 8, products and categories in Stage 9, search in
 * Stage 10, orders and wishlist in Stage 11, review votes in Stage 24.
 *
 * The not-found handler is mounted last, so an unknown `/api/…` path — or a
 * known path with a method it does not serve — answers with the standard error
 * envelope instead of falling through to the application's catch-all.
 */

import { Router } from 'express';

import { notFoundHandler } from '../middleware/notFound.js';
import { authRouter } from './auth.routes.js';
import { categoryRouter } from './category.routes.js';
import { deliveryRouter } from './delivery.routes.js';
import { healthRouter } from './health.routes.js';
import { orderRouter } from './order.routes.js';
import { productRouter } from './product.routes.js';
import { promoRouter } from './promo.routes.js';
import { reviewRouter } from './review.routes.js';
import { searchRouter } from './search.routes.js';
import { userRouter } from './user.routes.js';
import { wishlistRouter } from './wishlist.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/delivery', deliveryRouter);
apiRouter.use('/search', searchRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/promos', promoRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/wishlist', wishlistRouter);

apiRouter.use(notFoundHandler);
