/**
 * The offer row: three narrow cards, one per sale-flavoured department.
 *
 * It replaces a row of dark tiles that carried a badge, a headline, a paragraph,
 * and a call to action each — four lines of copy per tile, all of it saying what
 * the card underneath already said. What is left is an icon, a name, the number
 * of products behind it, and an arrow. The point of the row is to be scanned and
 * clicked, and a paragraph is the one thing scanning cannot do.
 *
 * The name and the count are read from the catalog rather than written here, so
 * a category that has been renamed or emptied changes the row instead of
 * contradicting it, and a category that no longer exists drops out of the row
 * entirely. That is also why the order comes from `config/home.ts` as slugs: the
 * row decides which departments to show, the catalog decides what they are
 * called and how much is in them.
 *
 * The icon and the colour are keyed by the same slug. Both are whole class
 * strings in the record below rather than a colour name the component assembles,
 * because the Tailwind compiler only sees classes it can read as text, and a
 * class built at runtime is a class that is never generated. A slug with no
 * entry falls back to a neutral card rather than an uncoloured one.
 *
 * The whole card is one link and one target. There is no badge and no second
 * button, because a narrow card with two targets in it is a card that is easy to
 * mis-click.
 *
 * The cards arrive one after another, like the hero's tiles, and are skipped
 * entirely when the visitor asked for reduced motion.
 */

import { ArrowRight, BadgePercent, Gift, PackageOpen, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/common/Skeleton';
import { SectionHeading } from '@/components/home/SectionHeading';
import { offerSlugs } from '@/config/home';
import { findCategory } from '@/features/products/categoryTree';
import { useCategoryTree } from '@/hooks/useProducts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** How long each card waits for the one before it. */
const STAGGER_SECONDS = 0.06;

type OfferLook = {
  icon: LucideIcon;
  /** The tinted disc behind the icon. */
  discClass: string;
  /** The border the card takes when the pointer is on it. */
  hoverClass: string;
};

const defaultLook: OfferLook = {
  icon: Tag,
  discClass: 'bg-ink-100 text-ink-600',
  hoverClass: 'hover:border-ink-400',
};

const looks: Record<string, OfferLook> = {
  deals: {
    icon: BadgePercent,
    discClass: 'bg-danger-50 text-danger-600',
    hoverClass: 'hover:border-danger-600',
  },
  clearance: {
    icon: PackageOpen,
    discClass: 'bg-warning-50 text-warning-700',
    hoverClass: 'hover:border-warning-600',
  },
  'bundle-deals': {
    icon: Gift,
    discClass: 'bg-accent-50 text-accent-700',
    hoverClass: 'hover:border-accent-600',
  },
};

export function OfferRow() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { categories, isLoading, isError } = useCategoryTree();

  // A missing tree is not worth a heading with nothing under it; the page
  // carries enough other sections that the row can simply not be there.
  if (isError) {
    return null;
  }

  const tree = categories ?? [];
  const offers = offerSlugs.flatMap((slug) => {
    const category = findCategory(tree, slug);

    return category === undefined ? [] : [{ slug, category }];
  });

  if (!isLoading && offers.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-offers-heading">
      <SectionHeading
        id="home-offers-heading"
        title={strings.home.promoHeading}
        action={{ label: strings.home.promoAll, to: `${paths.search}?onSale=true` }}
        className="mb-6"
      />

      <ul className="grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
        {isLoading
          ? offerSlugs.map((slug) => (
              <li key={slug}>
                <Skeleton className="h-[4.75rem] rounded-panel" />
              </li>
            ))
          : offers.map(({ slug, category }, index) => {
              const look = looks[slug] ?? defaultLook;
              const Icon = look.icon;

              return (
                <motion.li
                  key={category.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    ease: 'easeOut',
                    delay: reduceMotion ? 0 : index * STAGGER_SECONDS,
                  }}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                >
                  <Link
                    to={paths.category(category.slug)}
                    className={cn(
                      'group flex h-full items-center gap-3 rounded-panel border border-border bg-surface p-4 no-underline transition-colors hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                      look.hoverClass,
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        'grid size-10 shrink-0 place-content-center rounded-full',
                        look.discClass,
                      )}
                    >
                      <Icon size={20} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink-900">
                        {category.name}
                      </span>
                      <span className="mt-0.5 block text-sm text-ink-600">
                        {strings.home.categoryCount(category.productCount ?? 0)}
                      </span>
                    </span>

                    <ArrowRight
                      aria-hidden="true"
                      size={18}
                      className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-ink-700"
                    />
                  </Link>
                </motion.li>
              );
            })}
      </ul>
    </section>
  );
}
