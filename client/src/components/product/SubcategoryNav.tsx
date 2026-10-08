/**
 * The row of categories above a catalog listing.
 *
 * A shopper who lands on *Footwear* needs to see that *Clothing* and *Home* are
 * beside it, and that *Sneakers* and *Boots* are inside it. Which of those two
 * the row shows is decided by `categoryRow` in `features/products/categoryTree`;
 * this component draws whatever row it is handed and marks the one being viewed.
 *
 * The current category is a `<span>` with `aria-current="page"`, not a link to
 * the page the visitor is already on. The row scrolls sideways on a phone rather
 * than wrapping into four lines and pushing the products off the screen.
 */

import { Link } from 'react-router-dom';

import type { CategoryNode } from '@/features/products/products.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

type Props = {
  /** The row to draw, in catalog order. */
  categories: readonly CategoryNode[];
  /** The category being viewed, drawn as the selected one. */
  currentSlug: string;
  className?: string;
};

const pillClass =
  'inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

export function SubcategoryNav({ categories, currentSlug, className }: Props) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <nav aria-labelledby="catalog-subcategories" className={className}>
      <h2 id="catalog-subcategories" className="sr-only">
        {strings.catalog.subcategoriesHeading}
      </h2>

      <ul className="flex list-none gap-2 overflow-x-auto p-0 pb-1">
        {categories.map((category) => {
          const current = category.slug === currentSlug;

          return (
            <li key={category.id}>
              {current ? (
                <span
                  aria-current="page"
                  className={cn(pillClass, 'border-brand-700 bg-brand-700 text-brand-50')}
                >
                  {category.name}
                </span>
              ) : (
                <Link
                  to={paths.category(category.slug)}
                  className={cn(
                    pillClass,
                    'border-border bg-surface text-ink-700 hover:border-ink-300 hover:bg-ink-100',
                  )}
                >
                  {category.name}
                  <span className="text-xs text-ink-500">{category.productCount}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
