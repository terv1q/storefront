/**
 * Health check. Answers 200 while the database responds and 503 when it does
 * not, so a platform probe can tell a running-but-broken instance from a
 * stopped one. This endpoint deliberately does not use the resource envelope:
 * it is read by probes, not by the storefront.
 */

import { Router } from 'express';

import { checkDatabaseConnection } from '../database/index.js';

export const healthRouter = Router();

healthRouter.get('/', async (_request, response) => {
  const databaseIsUp = await checkDatabaseConnection();

  response.status(databaseIsUp ? 200 : 503).json({
    status: databaseIsUp ? 'ok' : 'degraded',
    database: databaseIsUp ? 'up' : 'down',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});
