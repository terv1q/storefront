/**
 * Prisma client for the process.
 *
 * Prisma 7 is engine-free, so the client connects through a driver adapter and
 * receives its connection string here rather than from the schema file. See
 * `prisma.config.ts` for the connection the CLI uses for migrations.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    // Warnings and errors only. Prisma can print every statement it runs, which
    // is a wall of SQL around the one line worth reading, and the slow-query
    // extension below already reports the statements that are actually a
    // problem. `LOG_LEVEL=debug` is how a statement is looked at deliberately.
    log: logger.isDebug ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });
}

/** One client for the whole process. Prisma pools connections internally. */

/**
 * Anything slower than this is written to the server log. Local data is small
 * enough that a query crossing this line usually means a missing index or an
 * unindexed comparison, so the line is worth watching rather than tuning.
 */
const SLOW_QUERY_MS = 200;

const basePrisma = createPrismaClient();

/**
 * Every query the process runs goes through here, so a slow one is reported
 * wherever it came from rather than only from the services that remember to
 * measure themselves.
 */
export const prisma = basePrisma.$extends({
  query: {
    async $allOperations({ operation, model, args, query }) {
      const startedAt = performance.now();
      const result = await query(args);
      const elapsedMs = performance.now() - startedAt;

      if (elapsedMs >= SLOW_QUERY_MS) {
        const target = model === undefined ? 'raw' : model;
        logger.warn(
          `[slow query] ${target}.${operation} took ${Math.round(elapsedMs)} ms` +
            ` (limit ${SLOW_QUERY_MS} ms)`,
        );
      }

      return result;
    },
  },
});

/**
 * The client a transaction callback receives: the same client without the
 * methods that only make sense at the top level. Prisma derives its own
 * `TransactionClient` from the base client, which does not match the extended
 * client this module exports, so the type is derived from the export instead.
 */
export type TransactionClient = Omit<
  typeof prisma,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
>;

/** True when the database answers a trivial query. Never throws. */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
