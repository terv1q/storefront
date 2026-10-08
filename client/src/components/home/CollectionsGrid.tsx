/**
 * The collections grid: whole departments, drawn as one even row.
 *
 * It looks like the category row and is meant to feel different from it. The row
 * is an index — every department, same size, one line — and this is a
 * recommendation: four departments the store wants at the front, each with a
 * photograph and a product count. The two are fed by the same tree, so they
 * cannot show a department the catalog does not have.
 *
 * Every tile is the same size, in one row of four on a wide screen and two rows
 * of two below that. An earlier version gave the first tile two columns and two
 * rows and filled the space beside it; it read as a mistake more often than as a
 * hierarchy, because the eye could not tell a deliberate lead tile from a tile
 * that had been stretched. Equal tiles have no such question, and the department
 * order carries the preference instead — the first slug in `config/home.ts` is
 * simply the first tile.
 *
 * The department names are preferred in the order that file lists them and the
 * grid takes the ones the catalog actually has, so a department being removed
 * promotes the next one instead of leaving a gap.
 */

import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Skeleton } from '@/components/common/Skeleton';
import { SectionHeading } from '@/components/home/SectionHeading';
import { collectionSlugs } from '@/config/home';
import { findCategory } from '@/features/products/categoryTree';
import { useCategoryTree } from '@/hooks/useProducts';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

/** How many departments the row shows. Four fill one row on a wide screen. */
const SHOWN = 4;

export function CollectionsGrid() {
  const { categories, isLoading, isError } = useCategoryTree();

  if (isError) {
    return null;
  }

  const tree = categories ?? [];
  const collections = collectionSlugs
    .flatMap((slug) => {
      const category = findCategory(tree, slug);

      return category === undefined ? [] : [category];
    })
    .slice(0, SHOWN);

  if (isLoading) {
    return (
      <section aria-labelledby="home-collections-heading">
        <SectionHeading
          id="home-collections-heading"
          title={strings.home.collectionsHeading}
          action={{ label: strings.home.categoryAll, to: paths.search }}
        />
        <div aria-hidden="true" className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: SHOWN }, (_, index) => (
            <Skeleton key={index} className="aspect-[4/5] rounded-panel" />
          ))}
        </div>
      </section>
    );
  }

  if (collections.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="home-collections-heading">
      <SectionHeading
        id="home-collections-heading"
        title={strings.home.collectionsHeading}
        action={{ label: strings.home.categoryAll, to: paths.search }}
      />

      <ul className="mt-6 grid list-none grid-cols-2 gap-4 p-0 lg:grid-cols-4">
        {collections.map((category) => (
          <li key={category.id}>
            <Link
              to={paths.category(category.slug)}
              aria-label={strings.home.collectionOpen(category.name)}
              className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-panel bg-ink-900 p-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-5"
            >
              {category.imageUrl ? (
                <img
                  src={category.imageUrl}
                  alt=""
                  width={800}
                  height={800}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : null}

              {/* The scrim is what keeps the name legible over whatever the
                  photograph happens to be, so it stays even though the rest of
                  the page has no gradients on it. */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-black/70 via-black/25 to-transparent"
              />

              <h3 className="text-base font-semibold sm:text-lg">{category.name}</h3>

              {/* The tile is a fixed ratio, so the copy inside it has to fit that
                  ratio at every width. The description is the part that does not:
                  on a two-column phone grid there is room for the name and the
                  count and nothing else, and a third line would be clipped
                  mid-sentence by the tile's own `overflow-hidden`. */}
              {category.description ? (
                <p className="mt-1 hidden line-clamp-2 text-sm text-white/85 sm:block">
                  {category.description}
                </p>
              ) : null}

              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium">
                {strings.home.categoryCount(category.productCount ?? 0)}
                <ArrowUpRight
                  aria-hidden="true"
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
