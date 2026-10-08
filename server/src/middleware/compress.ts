/**
 * Compresses response bodies.
 *
 * The catalog is text: a product listing, a category tree, a facet count. Those
 * answers are hundreds of kilobytes of repeated JSON keys and repeated category
 * names, which is exactly what a compressor is good at, and they are the ones
 * the home page waits on. Nothing in this process previously set
 * `Content-Encoding`, so every one of them crossed the wire at full size.
 *
 * This is hand-rolled rather than pulled from the `compression` package for the
 * same reason the rate limiter is: `node:zlib` already does the work, and the
 * part that is actually this application's is the decision of whether to bother
 * — which content types, which encodings the caller accepts, and how small a
 * body is too small to be worth a header. That decision is the file.
 *
 * The body is collected and compressed once, at the end of the response. That is
 * deliberate: every handler in this API answers with `res.json` or `res.send`,
 * so there is one body and it arrives in one call. A route that streamed would
 * have already flushed its headers by the time `end` ran, and the check below
 * leaves such a response alone.
 */

import { brotliCompress, gzip, constants as zlibConstants } from 'node:zlib';
import { promisify } from 'node:util';
import type { NextFunction, Request, Response } from 'express';

const compressBrotli = promisify(brotliCompress);
const compressGzip = promisify(gzip);

/**
 * A body smaller than this is not compressed. The saving is a handful of bytes
 * and the header and the decompression cost the client a little, so the honest
 * answer for a short error envelope is to send it as it is.
 */
const MIN_SIZE_BYTES = 1024;

/**
 * The content types worth compressing.
 *
 * Images, fonts, and archives are already compressed, and running them through a
 * compressor costs CPU to make them very slightly larger. `image/svg+xml` is the
 * exception and is on the list: it is XML text that happens to be drawn.
 */
const COMPRESSIBLE_TYPE =
  /^(?:text\/|application\/(?:json|javascript|xml|x-www-form-urlencoded)|image\/svg\+xml)/i;

type Encoding = 'br' | 'gzip';

const CODECS: Record<Encoding, (body: Buffer) => Promise<Buffer>> = {
  br: (body) =>
    compressBrotli(body, {
      // The default quality (11) is a one-shot preset with a long window: it is
      // slow for a per-request cost. 4 is the level a server compressing on the
      // fly wants — near-gzip-9 ratios at a fraction of the time.
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
    }),
  gzip: (body) => compressGzip(body, { level: zlibConstants.Z_BEST_SPEED }),
};

/**
 * The best encoding the caller accepts, or `undefined` if it accepts none.
 *
 * Quality values are honoured: a caller that sends `gzip;q=0` is saying it does
 * not want gzip, and one that sends `br;q=0.5, gzip` prefers gzip. A tie goes to
 * Brotli, which is smaller for the text this API returns. `identity` and `*` are
 * not compressors, so they are not considered — a body left alone is the correct
 * answer for both.
 */
function preferredEncoding(header: string | undefined): Encoding | undefined {
  if (header === undefined || header.length === 0) {
    return undefined;
  }

  let best: { encoding: Encoding; quality: number } | undefined;

  for (const part of header.split(',')) {
    const [rawName, ...parameters] = part.split(';');
    const name = rawName?.trim().toLowerCase();

    if (name !== 'br' && name !== 'gzip') {
      continue;
    }

    let quality = 1;

    for (const parameter of parameters) {
      const [rawKey, rawValue] = parameter.split('=');

      if (rawKey?.trim().toLowerCase() === 'q') {
        const parsed = Number(rawValue);
        quality = Number.isFinite(parsed) ? parsed : 0;
      }
    }

    if (quality <= 0) {
      continue;
    }

    const better =
      best === undefined ||
      quality > best.quality ||
      (quality === best.quality && name === 'br' && best.encoding === 'gzip');

    if (better) {
      best = { encoding: name, quality };
    }
  }

  return best?.encoding;
}

/**
 * Whether this response is one to compress.
 *
 * Anything already encoded, anything whose type is not text, and anything marked
 * `no-transform` is left as it is. A response whose headers have not been sent
 * is the only one that can still be changed, and by the time `end` runs, a
 * handler has set both the status and the type.
 */
function isCompressible(response: Response): boolean {
  if (response.getHeader('Content-Encoding') !== undefined) {
    return false;
  }

  const contentType = response.getHeader('Content-Type');

  if (typeof contentType !== 'string' || !COMPRESSIBLE_TYPE.test(contentType)) {
    return false;
  }

  const cacheControl = response.getHeader('Cache-Control');

  return !(typeof cacheControl === 'string' && cacheControl.includes('no-transform'));
}

/** The bytes `end` was handed, or `undefined` when it was handed nothing. */
function bodyOf(chunk: unknown, encoding: BufferEncoding | undefined): Buffer | undefined {
  if (typeof chunk === 'string') {
    return Buffer.from(chunk, encoding ?? 'utf8');
  }

  if (Buffer.isBuffer(chunk)) {
    return chunk;
  }

  if (ArrayBuffer.isView(chunk)) {
    return Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  }

  return undefined;
}

/** `res.end` accepts an encoding, a callback, or neither, in either order. */
function trailersOf(args: unknown[]): { encoding?: BufferEncoding; callback?: () => void } {
  let encoding: BufferEncoding | undefined;
  let callback: (() => void) | undefined;

  for (const arg of args) {
    if (typeof arg === 'string') {
      encoding = arg as BufferEncoding;
    } else if (typeof arg === 'function') {
      callback = arg as () => void;
    }
  }

  return { encoding, callback };
}

export function compressResponse(request: Request, response: Response, next: NextFunction): void {
  const encoding = preferredEncoding(request.headers['accept-encoding']);

  // No compressor was asked for, and a HEAD response has no body to compress.
  if (encoding === undefined || request.method === 'HEAD') {
    next();
    return;
  }

  const originalEnd = response.end.bind(response);

  response.end = function end(this: Response, chunk?: unknown, ...rest: unknown[]): Response {
    // Only once: a second call must reach the real `end` rather than this one.
    response.end = originalEnd;

    const { encoding: chunkEncoding, callback } = trailersOf(rest);
    const body = bodyOf(chunk, chunkEncoding);

    if (
      body === undefined ||
      body.byteLength < MIN_SIZE_BYTES ||
      response.headersSent ||
      !isCompressible(response)
    ) {
      originalEnd(chunk as never, ...(rest as never[]));
      return response;
    }

    const codec = CODECS[encoding];

    void codec(body)
      .then((compressed) => {
        // A body that did not get smaller is sent as it was: a header promising
        // an encoding is not worth a byte the caller then has to undo.
        if (compressed.byteLength >= body.byteLength) {
          originalEnd(body as never, callback as never);
          return;
        }

        response.setHeader('Content-Encoding', encoding);
        // The length changed, so the one already set — Express writes it for
        // `res.send` — would truncate the response.
        response.removeHeader('Content-Length');
        // The answer depends on what the caller said it accepts, so anything
        // between here and the client has to key its copy on that.
        response.vary('Accept-Encoding');
        originalEnd(compressed as never, callback as never);
      })
      .catch(() => {
        // A compressor that failed is not a failed request: the body the
        // handler produced is still the right answer, so it is sent as it was.
        originalEnd(body as never, callback as never);
      });

    return response;
  } as typeof response.end;

  next();
}
