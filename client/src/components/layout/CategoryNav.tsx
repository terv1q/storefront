/**
 * The category bar under the header.
 *
 * The bar is a Radix navigation menu, so moving along it with the arrow keys,
 * opening a panel, stepping into it with Tab, and closing it with Escape all
 * follow the menu pattern the platform expects, including the hover intent that
 * keeps a panel open while the pointer crosses the gap between the trigger and
 * the panel. The content of every panel is rendered into one shared viewport, so
 * only one is ever on screen and the panels cannot overlap each other.
 *
 * The root is left unpositioned on purpose. The viewport is absolutely placed
 * against the nearest positioned ancestor, so the caller decides how wide a
 * panel gets: the header makes its content row the context, and the panels span
 * the content width instead of the width of the trigger that opened them.
 *
 * Everything inside a panel is real catalog data: the columns are the category's
 * own children, and the tile beside them uses the same image the category is
 * published with. No brand column is shown, because the catalog has no endpoint
 * that lists brands — `/api/products` accepts a brand slug but nothing returns
 * the set — and a column of guessed brand names would be worse than no column.
 *
 * The bar is desktop only. Below the large breakpoint the mobile drawer carries
 * the same tree.
 */

import * as NavigationMenu from '@radix-ui/react-navigation-menu';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/common/Skeleton';
import { Thumbnail } from '@/components/common/Thumbnail';
import { useCategoryTree } from '@/hooks/useProducts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** How many children a column shows before the panel would run off the screen. */
const CHILDREN_PER_COLUMN = 8;

export function CategoryNav({ className = '' }: { className?: string }) {
  const { categories, isLoading, isError, errorMessage } = useCategoryTree();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Nothing to browse is not a bar worth showing, and a failed request should
  // not take the header's shape with it.
  if (isError) {
    return (
      <p role="alert" className="sr-only">
        {errorMessage}
      </p>
    );
  }

  if (isLoading) {
    return <CategoryNavSkeleton className={className} />;
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <NavigationMenu.Root
      aria-label={strings.nav.browse}
      delayDuration={120}
      skipDelayDuration={300}
      className={cn(className)}
    >
      <NavigationMenu.List className="flex items-center gap-0.5">
        {categories.map((category) => (
          <NavigationMenu.Item key={category.id}>
            <NavigationMenu.Trigger className="group inline-flex items-center gap-1.5 rounded-control px-2.5 py-2 text-sm font-medium text-ink-700 transition-colors outline-none hover:bg-ink-100 hover:text-ink-900 focus-visible:bg-ink-100 data-[state=open]:bg-ink-100 data-[state=open]:text-ink-900">
              <Thumbnail
                src={category.imageUrl}
                className="h-5 w-5 rounded-control"
                iconSize={12}
              />
              {category.name}
              <ChevronDown
                aria-hidden="true"
                size={14}
                className="text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </NavigationMenu.Trigger>

            <NavigationMenu.Content className="w-full">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_16rem]"
              >
                <div>
                  <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                    {strings.nav.categories}
                  </p>

                  <ul className="mt-3 grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                    {category.children.slice(0, CHILDREN_PER_COLUMN).map((child) => (
                      <li key={child.id}>
                        <Link
                          to={paths.category(child.slug)}
                          className="block rounded-control px-1 py-1 text-sm text-ink-700 no-underline hover:bg-ink-100 hover:text-ink-900 hover:no-underline"
                        >
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={paths.category(category.slug)}
                    className="mt-4 inline-block text-sm font-semibold text-brand-700"
                  >
                    {strings.nav.shopAll(category.name)}
                  </Link>
                </div>

                {/* The tile is the category's own published image, not a promo
                    that has to be kept in step by hand. */}
                <Link
                  to={paths.category(category.slug)}
                  className="group hidden overflow-hidden rounded-panel border border-border no-underline hover:no-underline lg:block"
                >
                  <Thumbnail src={category.imageUrl} className="h-32 w-full" iconSize={24} />
                  <span className="block px-4 py-3 text-sm font-semibold text-ink-900 group-hover:underline">
                    {strings.nav.shopAll(category.name)}
                  </span>
                </Link>
              </motion.div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}

        <NavigationMenu.Indicator className="absolute top-full z-header flex h-2 w-2 justify-center overflow-hidden">
          <span className="h-2 w-2 rotate-45 rounded-tl-sm bg-surface shadow-overlay" />
        </NavigationMenu.Indicator>
      </NavigationMenu.List>

      <div className="absolute top-full left-0 w-full">
        <NavigationMenu.Viewport className="h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-panel border border-border bg-surface shadow-overlay transition-[width,height] duration-200" />
      </div>
    </NavigationMenu.Root>
  );
}

/** Placeholder triggers, sized like the real ones so the header does not move. */
function CategoryNavSkeleton({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-2 py-2', className)}>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton
          key={index}
          className="h-5 rounded-control"
          style={{ width: `${5 + (index % 3) * 1.5}rem` }}
        />
      ))}
    </div>
  );
}
