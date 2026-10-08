/**
 * The form a customer writes a review in, and the one they edit it in.
 *
 * Both are the same form because they are the same act: the words, the rating,
 * and the photographs of one review. The difference is what it opens on — the
 * review that is already there, or an empty one — and what its button says. A
 * second form for editing would be a second place for the field rules to drift.
 *
 * It is a modal rather than a section that unfolds under the list, because a
 * half-filled form that leaves the screen when the customer scrolls back to
 * re-read the product is a form that loses work. `Modal` brings the overlay, the
 * close affordance, and the scroll lock.
 *
 * The rules are written twice on purpose: `zod` refuses a three-character review
 * before a request is made, and the server refuses it again, because a client is
 * not something to be trusted. Both halves of that pair are named here as
 * constants, so the form's counter and the server's limit are the same number.
 *
 * Photographs are uploaded after the review is saved, not with it: the API takes
 * a multipart body on a path that names the review's owner, so the review has to
 * exist first. A photograph that fails to upload leaves the review standing,
 * which is the right way round — the words are the review, the pictures are
 * attached to it.
 */

import { Camera, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';

import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { StarRatingInput } from './StarRatingInput';
import {
  useAddReviewImages,
  useCreateReview,
  useRemoveReviewImage,
  useUpdateReview,
} from '@/features/products/products.queries';
import type { Review } from '@/features/products/products.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { resolveApiAssetUrl } from '@/services/api';
import { isApiError } from '@/types/api';

/** The same floors and ceilings the review endpoint enforces. */
export const REVIEW_TITLE_LIMIT = 120;
export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_LIMIT = 4000;

/** How many photographs one review may carry, and how large each may be. */
export const REVIEW_IMAGE_LIMIT = 4;
export const REVIEW_IMAGE_BYTES = 5 * 1024 * 1024;

/** The image types the server accepts, which are the ones a browser can draw. */
export const REVIEW_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * What the form checks before it sends anything. A rule carries a key rather
 * than a sentence, because the sentence depends on the language being read.
 */
export const reviewFormSchema = z.object({
  rating: z.number().int('rating').min(1, 'rating').max(5, 'rating'),
  title: z.string().trim().max(REVIEW_TITLE_LIMIT, 'title').optional(),
  body: z.string().trim().min(REVIEW_BODY_MIN, 'bodyMin').max(REVIEW_BODY_LIMIT, 'bodyMax'),
});

export type ReviewFormValues = z.infer<typeof reviewFormSchema>;

type FieldName = 'rating' | 'title' | 'body';

type Props = {
  productSlug: string;
  /** The review being edited, or `undefined` when this is a new one. */
  existingReview: Review | undefined;
  open: boolean;
  onClose: () => void;
};

/** Turns the key a broken rule carries into the sentence to show. */
function messageFor(key: string): string {
  const copy = strings.productPage.reviews;

  switch (key) {
    case 'rating':
      return copy.formRatingRequired;
    case 'bodyMin':
      return copy.formBodyMin(REVIEW_BODY_MIN);
    case 'bodyMax':
      return copy.formBodyMax(REVIEW_BODY_LIMIT);
    default:
      return copy.formTitleTooLong(REVIEW_TITLE_LIMIT);
  }
}

/** The empty form's values, which are also what an edit opens on. */
function valuesFor(review: Review | undefined): ReviewFormValues {
  return {
    rating: review?.rating ?? 0,
    title: review?.title ?? '',
    body: review?.body ?? '',
  };
}

export function ReviewForm({ productSlug, existingReview, open, onClose }: Props) {
  const create = useCreateReview();
  const update = useUpdateReview();
  const addImages = useAddReviewImages();
  const removeImage = useRemoveReviewImage();

  const [values, setValues] = useState<ReviewFormValues>(() => valuesFor(existingReview));
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isEditing = existingReview !== undefined;
  const isSubmitting = create.isPending || update.isPending || addImages.isPending;

  // Opening the form starts from what is stored, not from what was last typed
  // into it: a cancelled edit should not reappear the next time it is opened.
  useEffect(() => {
    if (open) {
      setValues(valuesFor(existingReview));
      setErrors({});
      setFiles([]);
      setFileError(null);
      setSubmitError(null);
    }
  }, [open, existingReview]);

  // A preview address is a handle on a file the browser is holding, and it stays
  // open until it is revoked. Releasing the previous list when it changes keeps a
  // long session from holding every photograph ever chosen.
  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const attachedCount = files.length + (existingReview?.images.length ?? 0);

  const onPickFiles = (chosen: FileList | null) => {
    const picked = Array.from(chosen ?? []);

    if (picked.length === 0) {
      return;
    }

    if (picked.length > REVIEW_IMAGE_LIMIT - attachedCount) {
      setFileError(strings.productPage.reviews.photoLimitRejected(REVIEW_IMAGE_LIMIT));
      return;
    }

    const rejected = picked.find(
      (file) => !REVIEW_IMAGE_TYPES.includes(file.type as (typeof REVIEW_IMAGE_TYPES)[number]),
    );

    if (rejected !== undefined) {
      setFileError(strings.productPage.reviews.photoTypeRejected(rejected.name));
      return;
    }

    const oversized = picked.find((file) => file.size > REVIEW_IMAGE_BYTES);

    if (oversized !== undefined) {
      setFileError(strings.productPage.reviews.photoSizeRejected(oversized.name));
      return;
    }

    setFileError(null);
    setFiles((current) => [...current, ...picked]);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const parsed = reviewFormSchema.safeParse(values);

    if (!parsed.success) {
      const found: Partial<Record<FieldName, string>> = {};

      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (field === 'rating' || field === 'title' || field === 'body') {
          found[field] ??= messageFor(issue.message);
        }
      }

      setErrors(found);
      return;
    }

    setErrors({});

    const input = {
      rating: parsed.data.rating,
      // An empty title is no title; the server stores `null` for one.
      title: parsed.data.title === '' ? undefined : parsed.data.title,
      body: parsed.data.body,
    };

    try {
      if (isEditing) {
        await update.mutateAsync({ slug: productSlug, input });
      } else {
        await create.mutateAsync({ slug: productSlug, input });
      }

      if (files.length > 0) {
        await addImages.mutateAsync({ slug: productSlug, files });
      }

      onClose();
    } catch (error) {
      // The one failure worth naming is the one a customer can act on: a review
      // that already exists, which the interface offers as an edit instead.
      setSubmitError(
        isApiError(error) && error.code === 'review_exists'
          ? strings.productPage.reviews.alreadyReviewed
          : strings.productPage.reviews.submitFailed,
      );
    }
  };

  const heading = isEditing
    ? strings.productPage.reviews.formEditHeading
    : strings.productPage.reviews.formCreateHeading;

  return (
    <Modal isOpen={open} onClose={onClose} title={heading}>
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-900">
            {strings.productPage.reviews.formRatingField}
          </span>

          <StarRatingInput
            value={values.rating}
            label={strings.productPage.reviews.formRatingField}
            describedBy={errors.rating === undefined ? undefined : 'review-rating-error'}
            disabled={isSubmitting}
            onChange={(rating) => {
              setValues((current) => ({ ...current, rating }));
              setErrors((current) => ({ ...current, rating: undefined }));
            }}
          />

          {errors.rating === undefined ? null : (
            <p id="review-rating-error" role="alert" className="text-sm text-danger-600">
              {errors.rating}
            </p>
          )}
        </div>

        <Input
          id="review-title"
          label={strings.productPage.reviews.formTitleOptional}
          placeholder={strings.productPage.reviews.formTitlePlaceholder}
          maxLength={REVIEW_TITLE_LIMIT}
          value={values.title ?? ''}
          error={errors.title}
          disabled={isSubmitting}
          onChange={(event) => {
            const title = event.target.value;
            setValues((current) => ({ ...current, title }));
            setErrors((current) => ({ ...current, title: undefined }));
          }}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="review-body" className="text-sm font-medium text-ink-900">
            {strings.productPage.reviews.formBodyField}
          </label>

          <textarea
            id="review-body"
            rows={6}
            maxLength={REVIEW_BODY_LIMIT}
            placeholder={strings.productPage.reviews.formBodyPlaceholder}
            value={values.body}
            disabled={isSubmitting}
            aria-invalid={errors.body !== undefined}
            onChange={(event) => {
              const body = event.target.value;
              setValues((current) => ({ ...current, body }));
              setErrors((current) => ({ ...current, body: undefined }));
            }}
            className={cn(
              'rounded-control border px-3 py-2 text-sm',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
              'disabled:cursor-not-allowed disabled:opacity-50',
              errors.body === undefined ? 'border-border' : 'border-danger-600',
            )}
          />

          <div className="flex items-baseline justify-between gap-3">
            {errors.body === undefined ? (
              <span />
            ) : (
              <p role="alert" className="text-sm text-danger-600">
                {errors.body}
              </p>
            )}

            <p className="text-xs text-ink-500">
              {strings.productPage.reviews.bodyCounter(values.body.length, REVIEW_BODY_LIMIT)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-ink-900">
            {strings.productPage.reviews.photosHeading}
          </span>

          <p className="text-xs text-ink-500">
            {strings.productPage.reviews.photosHint(REVIEW_IMAGE_LIMIT)}
          </p>

          <ul className="flex flex-wrap gap-2">
            {existingReview?.images.map((image, index) => (
              <li key={image.id} className="relative">
                <img
                  src={resolveApiAssetUrl(image.url)}
                  alt={`${strings.productPage.reviews.photosHeading} ${index + 1}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-control border border-border object-cover"
                />

                <button
                  type="button"
                  disabled={removeImage.isPending}
                  aria-label={strings.productPage.reviews.photoRemove(index + 1)}
                  onClick={() => removeImage.mutate({ slug: productSlug, imageId: image.id })}
                  className="absolute -top-2 -right-2 grid h-6 w-6 place-content-center rounded-full border border-border bg-surface text-ink-700 transition-colors hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50"
                >
                  <X aria-hidden="true" size={13} />
                </button>
              </li>
            ))}

            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="relative">
                <img
                  src={previews[index]}
                  alt={`${strings.productPage.reviews.photosHeading} ${index + 1}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-control border border-border object-cover"
                />

                <button
                  type="button"
                  aria-label={strings.productPage.reviews.photoRemove(index + 1)}
                  onClick={() => setFiles((current) => current.filter((_, at) => at !== index))}
                  className="absolute -top-2 -right-2 grid h-6 w-6 place-content-center rounded-full border border-border bg-surface text-ink-700 transition-colors hover:text-danger-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <X aria-hidden="true" size={13} />
                </button>
              </li>
            ))}

            {attachedCount < REVIEW_IMAGE_LIMIT ? (
              <li>
                <label className="grid h-20 w-20 cursor-pointer place-content-center gap-1 rounded-control border border-dashed border-border text-center text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700">
                  <Camera aria-hidden="true" size={18} className="mx-auto" />
                  <span className="text-xs">{strings.productPage.reviews.addPhotos}</span>
                  <input
                    type="file"
                    multiple
                    accept={REVIEW_IMAGE_TYPES.join(',')}
                    className="sr-only"
                    onChange={(event) => {
                      onPickFiles(event.target.files);
                      // Clearing the field lets the same file be chosen again
                      // after a refusal, which is what a customer will do.
                      event.target.value = '';
                    }}
                  />
                </label>
              </li>
            ) : null}
          </ul>

          {fileError === null ? null : (
            <p role="alert" className="text-sm text-danger-600">
              {fileError}
            </p>
          )}

          <p className="text-xs text-ink-500">
            {strings.productPage.reviews.photoCount(attachedCount, REVIEW_IMAGE_LIMIT)}
          </p>
        </div>

        {submitError === null ? null : (
          <p role="alert" className="text-sm text-danger-600">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {strings.productPage.reviews.cancel}
          </Button>

          <Button type="submit" isLoading={isSubmitting} disabled={values.rating === 0}>
            {isSubmitting
              ? strings.productPage.reviews.formSubmitting
              : isEditing
                ? strings.productPage.reviews.formSave
                : strings.productPage.reviews.formSubmit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
