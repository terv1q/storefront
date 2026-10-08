/**
 * The two controls above a product's reviews: how they are ordered and which
 * rating they are narrowed to.
 *
 * Both are Radix radio menus rather than `<select>` elements, for the same reason
 * the catalog's sort menu is: a menu can be styled to match the page, and it
 * brings the keyboard model and the `menuitemradio` role with it. The trigger
 * names the choice in force, so the current ordering is readable without opening
 * anything.
 *
 * The options are built inside the component and not in a table above it:
 * `strings` is reassigned when the visitor switches language, and a module-level
 * array would keep the labels of the language the page first loaded in.
 */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, X } from 'lucide-react';

import type { ReviewSort } from '@/features/products/reviews.api';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

const SORT_ORDER: readonly ReviewSort[] = ['newest', 'highest', 'lowest'];

/** The four thresholds a shopper narrows to, and the one that narrows to nothing. */
const RATING_ORDER: readonly (number | null)[] = [null, 5, 4, 3, 2, 1];

type Props = {
  sort: ReviewSort;
  /** One star rating to narrow to, or `null` for all of them. */
  rating: number | null;
  onSortChange: (sort: ReviewSort) => void;
  onRatingChange: (rating: number | null) => void;
  className?: string;
};

function sortLabel(sort: ReviewSort): string {
  return {
    newest: strings.productPage.reviews.sortNewest,
    highest: strings.productPage.reviews.sortHighest,
    lowest: strings.productPage.reviews.sortLowest,
  }[sort];
}

function ratingLabel(rating: number | null): string {
  const copy = strings.productPage.reviews;

  switch (rating) {
    case 5:
      return copy.fiveStars;
    case 4:
      return copy.fourStars;
    case 3:
      return copy.threeStars;
    case 2:
      return copy.twoStars;
    case 1:
      return copy.oneStar;
    default:
      return copy.allRatings;
  }
}

const triggerClass =
  'inline-flex h-11 items-center gap-2 rounded-control border border-border bg-surface px-3 text-sm font-medium text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 sm:h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const contentClass =
  'overlay-panel z-header w-56 overflow-hidden rounded-panel border border-border bg-surface py-1 shadow-overlay';

const itemClass =
  'flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-ink-700 outline-none select-none hover:bg-ink-100 hover:text-ink-900 focus:bg-ink-100 focus:text-ink-900';

function MenuTrigger({ label, value }: { label: string; value: string }) {
  return (
    <DropdownMenu.Trigger className={triggerClass}>
      <span className="text-ink-500">{label}</span>
      <span aria-hidden="true">·</span>
      <span>{value}</span>
      <ChevronDown aria-hidden="true" size={16} className="text-ink-500" />
    </DropdownMenu.Trigger>
  );
}

export function ReviewFilters({ sort, rating, onSortChange, onRatingChange, className }: Props) {
  const isNarrowed = rating !== null || sort !== 'newest';

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <DropdownMenu.Root>
        <MenuTrigger label={strings.productPage.reviews.sortBy} value={sortLabel(sort)} />

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            collisionPadding={8}
            className={contentClass}
          >
            <DropdownMenu.RadioGroup
              value={sort}
              onValueChange={(next) => onSortChange(next as ReviewSort)}
            >
              {SORT_ORDER.map((option) => (
                <DropdownMenu.RadioItem key={option} value={option} className={itemClass}>
                  <span className="grid h-4 w-4 place-content-center text-brand-700">
                    <DropdownMenu.ItemIndicator>
                      <Check aria-hidden="true" size={14} />
                    </DropdownMenu.ItemIndicator>
                  </span>
                  {sortLabel(option)}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <DropdownMenu.Root>
        <MenuTrigger label={strings.productPage.reviews.filterBy} value={ratingLabel(rating)} />

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            collisionPadding={8}
            className={contentClass}
          >
            <DropdownMenu.RadioGroup
              // Radix compares values as strings, so "all" stands in for no rating
              // rather than `null`, which it would treat as a missing value.
              value={rating === null ? 'all' : String(rating)}
              onValueChange={(next) => onRatingChange(next === 'all' ? null : Number(next))}
            >
              {RATING_ORDER.map((option) => (
                <DropdownMenu.RadioItem
                  key={option ?? 'all'}
                  value={option === null ? 'all' : String(option)}
                  className={itemClass}
                >
                  <span className="grid h-4 w-4 place-content-center text-brand-700">
                    <DropdownMenu.ItemIndicator>
                      <Check aria-hidden="true" size={14} />
                    </DropdownMenu.ItemIndicator>
                  </span>
                  {ratingLabel(option)}
                </DropdownMenu.RadioItem>
              ))}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {isNarrowed ? (
        <button
          type="button"
          onClick={() => {
            onSortChange('newest');
            onRatingChange(null);
          }}
          className="inline-flex items-center gap-1 rounded-control px-2 py-1 text-sm text-ink-600 transition-colors hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <X aria-hidden="true" size={14} />
          {strings.productPage.reviews.clearFilters}
        </button>
      ) : null}
    </div>
  );
}
