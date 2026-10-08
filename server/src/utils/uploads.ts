/**
 * Uploaded review photographs.
 *
 * The API reads JSON and only JSON, with one exception: a review's pictures
 * arrive as a multipart form, because there is no way to send a file inside a
 * JSON document that does not involve base64 and a third more bytes. The
 * exception is this module — one multer instance, mounted on the one route that
 * takes files — rather than a relaxation of the content-type guard.
 *
 * Three things are decided here rather than by the caller:
 *
 * - **What a file is.** The declared media type is checked against a short list,
 *   and the extension is taken from that list and never from the client's
 *   filename. A file called `avatar.png` that arrives as `image/jpeg` is stored
 *   as a JPEG, and a filename with a path in it cannot reach the filesystem.
 * - **Where it goes.** A fresh UUID under `<UPLOAD_DIR>/reviews`, so two
 *   customers uploading the same photograph do not overwrite each other, and no
 *   request can write outside the directory.
 * - **How big.** A ceiling per file and a ceiling per request, both enforced by
 *   multer before the bytes reach the disk; a file that crosses the limit is
 *   discarded rather than left half-written.
 *
 * The stored value is a path, not an absolute URL: the address the file is
 * served from depends on where the API is deployed, and a row holding
 * `http://localhost:4000/...` would be wrong the moment it moved. The client
 * resolves the path against its own API origin.
 */

import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import multer from 'multer';

import { env } from '../config/env.js';
import { ApiError } from './apiError.js';

/** The path uploaded files are served from, and the first segment of a stored URL. */
export const UPLOAD_ROUTE = '/uploads';

/** The subdirectory review photographs live in, inside the upload directory. */
const REVIEWS_SEGMENT = 'reviews';

/** How many photographs one review may carry, and how many one request may send. */
export const MAX_REVIEW_IMAGES = 4;

/** The largest single photograph, and the largest one request's worth of them. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES * MAX_REVIEW_IMAGES;

/**
 * The accepted media types, and the extension each is stored under. A type that
 * is not a key here is refused; the extension is never read from the client.
 */
const EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/** Absolute path of the upload root, resolved once at startup. */
export const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);

/** Where review photographs are written. */
const reviewImageDir = path.join(uploadDir, REVIEWS_SEGMENT);

/**
 * Creates the upload directories if they are not there. Called once while the
 * application is built, so the first upload does not have to think about it.
 */
export function ensureUploadDirs(): void {
  mkdirSync(reviewImageDir, { recursive: true });
}

/** The path a stored file is served from, which is what the database holds. */
export function reviewImageUrl(filename: string): string {
  return `${UPLOAD_ROUTE}/${REVIEWS_SEGMENT}/${filename}`;
}

/** The absolute path of a stored file, for deleting it. */
export function reviewImagePath(filename: string): string {
  return path.join(reviewImageDir, filename);
}

/**
 * The filename inside a stored URL, or `null` when the URL is not one of ours.
 * Used when deleting, where the caller holds the URL rather than the name.
 */
export function reviewImageFilename(url: string): string | null {
  const prefix = `${UPLOAD_ROUTE}/${REVIEWS_SEGMENT}/`;

  if (!url.startsWith(prefix)) {
    return null;
  }

  const filename = url.slice(prefix.length);

  // A stored name is a UUID and an extension. Anything carrying a separator is
  // not one of ours, and joining it to a directory would walk out of it.
  return filename === '' || filename.includes('/') || filename.includes('\\') ? null : filename;
}

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, reviewImageDir);
  },
  filename: (_request, file, callback) => {
    const extension = EXTENSIONS[file.mimetype] ?? '.jpg';

    callback(null, `${randomUUID()}${extension}`);
  },
});

/**
 * The upload middleware for one review's photographs, as
 * `multer.array('images', MAX_REVIEW_IMAGES)`. It reads at most the field it was
 * told to read and discards anything over the limits; the errors it raises are
 * translated in `middleware/error.ts`.
 */
export const reviewImagesUpload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: MAX_REVIEW_IMAGES,
    fields: 4,
  },
  fileFilter: (_request, file, callback) => {
    if (EXTENSIONS[file.mimetype] === undefined) {
      callback(
        new ApiError(415, 'unsupported_media_type', 'Send photographs as JPEG, PNG, or WebP.'),
      );
      return;
    }

    callback(null, true);
  },
}).array('images', MAX_REVIEW_IMAGES);
