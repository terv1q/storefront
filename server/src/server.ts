/**
 * Process entry point: start the HTTP server, then shut down cleanly on a
 * signal, an uncaught exception, or an unhandled rejection.
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './database/index.js';
import { logger } from './utils/logger.js';

/** How long a shutdown may take before the process is forced to exit. */
const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * How long an idle keep-alive connection is held open.
 *
 * A connection that has answered and is waiting for the next request on it
 * costs a file descriptor and a slot in the connection table to do nothing. Five
 * seconds covers the gap between a page's own requests — the browser opens the
 * socket for the document and reuses it for the ones the page then makes — and
 * closes it before an idle visitor's tab accumulates sockets on the server.
 */
const KEEP_ALIVE_TIMEOUT_MS = 5_000;

/**
 * How long a client has to finish sending its request headers.
 *
 * A request slower than this is not a slow client, it is one holding a socket
 * open on purpose: the cheapest way to exhaust a server is to open many
 * connections and never finish the request line on any of them. Node's default
 * is a minute, which is longer than this API needs to answer anything. It must
 * stay above the keep-alive timeout, because Node applies the header timeout to
 * the same socket and a lower value would cut off a connection that is being
 * reused exactly as intended.
 */
const HEADERS_TIMEOUT_MS = 20_000;

/**
 * How long a request may take in total before the connection is closed.
 *
 * This is the backstop, not the goal: every handler here answers from one query
 * and a slow one is a database problem, which the health check and the request
 * log will both report before this fires. It exists so that a request stuck in a
 * handler cannot hold the process open forever.
 */
const REQUEST_TIMEOUT_MS = 30_000;

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`Ziyo API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

server.keepAliveTimeout = KEEP_ALIVE_TIMEOUT_MS;
server.headersTimeout = HEADERS_TIMEOUT_MS;
server.requestTimeout = REQUEST_TIMEOUT_MS;

let isShuttingDown = false;

async function shutdown(reason: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info(`Shutting down: ${reason}`);

  // A hung connection must not keep the process alive forever.
  const forceExit = setTimeout(() => {
    logger.error(`Shutdown exceeded ${SHUTDOWN_TIMEOUT_MS} ms, exiting anyway.`);
    process.exit(exitCode === 0 ? 1 : exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  try {
    await prisma.$disconnect();
  } catch (error) {
    logger.error('Failed to disconnect from the database.', error);
  }

  clearTimeout(forceExit);
  process.exit(exitCode);
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception.', error);
  void shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection.', reason);
  void shutdown('unhandledRejection', 1);
});
