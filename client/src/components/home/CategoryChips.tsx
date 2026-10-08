/**
 * The category row.
 *
 * One circular tile per department, in the order the catalog stores them, with
 * the number of products behind each. The list comes from the category tree the
 * header already loads, so the row and the catalog menu cannot disagree about
 * what departments exist.
 *
 * The row scrolls sideways rather than wrapping. Eight departments wrapping onto
 * two lines on a phone would push everything below them off the first screen,
 * and a scroller with snap points is a shape people already know. It is a plain
 * overflow container: this is a short, one-dimensional list with no autoplay and
 * no drag physics, so it does not need a carousel library, and a real scroll
 * container keeps the keyboard, the scrollbar, and the browser's own overscroll
 * behaviour working.
 *
 * Each tile carries the count in its accessible name, because "Kitchen" alone
 * does not say whether the department is worth opening.
 */

import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/common/Skeleton';
import { useCategoryTree } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** The tile a category is drawn as, in its loading and its loaded form. */
const tileClass =
  'group flex w-24 shrink-0 snap-start flex-col items-center gap-2 rounded-card p-2 transition-colors hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:w-28';

export function CategoryChips() {
  const { categories, isLoading, isError } = useCategoryTree();

  // The row is decoration for the page rather than the page's content: when the
  // tree cannot be read, the sections that carry products are still worth
  // showing, so this disappears instead of taking the whole screen over with an
  // error nobody can act on.
  if (isError) {
    return null;
  }

  if (isLoading || !categories) {
    return (
      <div aria-hidden="true" className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex w-24 shrink-0 flex-col items-center gap-2 p-2 sm:w-28">
            <Skeleton variant="avatar" className="size-20 sm:size-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      // `tabIndex` so the scroller itself can be focused and moved with the
      // arrow keys by somebody who is not using a pointer or a trackpad. A
      // labelled, focusable scroller is a region rather than a plain group,
      // which is the name the pattern gives it.
      tabIndex={0}
      role="region"
      aria-label={strings.home.categoryHeading}
      className={cn(
        'flex gap-3 overflow-x-auto pb-2',
        'snap-x snap-mandatory scroll-smooth',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
      )}
    >
      {categories.map((category) => (
        <Link
          key={category.id}
          to={paths.category(category.slug)}
          className={tileClass}
          aria-label={`${category.name} — ${strings.home.categoryCount(category.productCount)}`}
        >
          <span className="grid h-20 w-20 place-content-center overflow-hidden rounded-full border border-border bg-surface-muted transition-transform duration-200 group-hover:scale-105 sm:h-24 sm:w-24">
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt=""
                width={96}
                height={96}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            ) : (
              <span aria-hidden="true" className="text-lg font-semibold text-ink-400">
                {category.name.slice(0, 1)}
              </span>
            )}
          </span>

          <span className="text-center text-sm font-medium text-ink-800">{category.name}</span>
          <span aria-hidden="true" className="-mt-1 text-xs text-ink-500">
            {category.productCount}
          </span>
        </Link>
      ))}
    </div>
  );
}
