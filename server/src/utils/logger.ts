/**
 * Server logging.
 *
 * The server writes down what somebody has to act on: a failure, a warning, the
 * fact that it started, the fact that it is stopping. It does not write down
 * what worked. A request that answered 200 in six milliseconds is not news, and
 * a log full of them is a log nobody reads — which is the same as having no log
 * at all. The busiest part of the server is therefore the quietest: healthy
 * traffic prints nothing, and a request appears here only when it failed or when
 * it took long enough to be worth a look.
 *
 * Every level is one line, with an ISO timestamp, the level, and the message.
 * An error's stack follows its line and only in development, because a stack in
 * a production log is a page of noise around the one sentence that matters, and
 * the sentence is already on the line above it.
 *
 * `LOG_LEVEL` decides what is printed, and the default depends on where the
 * process is running: `info` in development and production, `silent` in test,
 * since a test run's output should be the tests and nothing else.
 */

import { env } from '../config/env.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/** How loud each level is. A message is printed when its level reaches the threshold. */
const SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

/**
 * What gets printed.
 *
 * `debug` is for the traffic that is normally quiet: a request that answered
 * without incident, and the details of an error that was handled. Turning it on
 * is how a problem is chased; leaving it off is how a log stays readable.
 */
const threshold: number = SEVERITY[env.LOG_LEVEL ?? (env.NODE_ENV === 'test' ? 'silent' : 'info')];

/** The constructor behind each level, so a warning stays a warning in the console. */
const WRITERS: Record<Exclude<LogLevel, 'silent'>, (line: string) => void> = {
  debug: (line) => console.log(line),
  info: (line) => console.log(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

/** The message of an unknown throwable, without the surrounding object. */
function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const { message } = error as { message: unknown };

    if (typeof message === 'string') {
      return message;
    }
  }

  return String(error);
}

/**
 * The stack of an unknown throwable, or `undefined` when there is none or when
 * it is not worth printing. A stack belongs to a place to look, and production
 * keeps no source map for one to point at.
 */
function stackOf(error: unknown): string | undefined {
  if (env.NODE_ENV !== 'development' || !(error instanceof Error)) {
    return undefined;
  }

  return error.stack;
}

function write(level: Exclude<LogLevel, 'silent'>, message: string, error?: unknown): void {
  if (SEVERITY[level] < threshold) {
    return;
  }

  const detail = error === undefined ? '' : ` — ${messageOf(error)}`;
  const stack = error === undefined ? undefined : stackOf(error);

  WRITERS[level](
    `${new Date().toISOString()} ${level.toUpperCase()} ${message}${detail}` +
      (stack === undefined ? '' : `\n${stack}`),
  );
}

export const logger = {
  /**
   * Whether the quiet levels are being printed. A caller that has something
   * expensive to record — the statement Prisma is about to run — asks this
   * first rather than paying to build a message nobody will read.
   */
  isDebug: threshold <= SEVERITY.debug,
  /** Traffic and detail. Off unless `LOG_LEVEL=debug`. */
  debug: (message: string, error?: unknown) => write('debug', message, error),
  /** Something happened that is worth knowing: a boot, a shutdown. */
  info: (message: string, error?: unknown) => write('info', message, error),
  /** Something is wrong but the server is still answering. */
  warn: (message: string, error?: unknown) => write('warn', message, error),
  /** Something failed. */
  error: (message: string, error?: unknown) => write('error', message, error),
};
