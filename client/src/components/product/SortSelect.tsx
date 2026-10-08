/**
 * The sort menu above a catalog listing.
 *
 * A Radix radio menu, not a `<select>`: the options carry a label and a tick,
 * and the browser's own dropdown is the one control on the page that cannot be
 * styled to match the rest of the catalog. What the primitive brings is the
 * keyboard model — arrow keys move between options, Enter chooses, Escape closes
 * and returns focus to the trigger — and the `menuitemradio` role that tells a
 * screen reader the options are one choice rather than a list of commands.
 *
 * The trigger shows the option in force, so the menu does not have to be opened
 * to answer "how is this sorted?".
 *
 * The option labels are read inside the component, not in a table at the top of
 * the file: `strings` is reassigned when the visitor switches language, and a
 * module-level array would keep the labels of the language the page loaded in.
 */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { ProductSort } from '@/types/product';

type Props = {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
  className?: string;
};

const SORT_ORDER: readonly ProductSort[] = [
  'featured',
  'price_asc',
  'price_desc',
  'rating',
  'newest',
];

/** The label of one sort option, in the language the page is in. */
export function sortLabel(sort: ProductSort): string {
  return {
    featured: strings.catalog.sort.featured,
    price_asc: strings.catalog.sort.priceAsc,
    price_desc: strings.catalog.sort.priceDesc,
    rating: strings.catalog.sort.rating,
    newest: strings.catalog.sort.newest,
  }[sort];
}

export function SortSelect({ value, onChange, className }: Props) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'inline-flex h-11 items-center gap-2 rounded-control border border-border bg-surface px-3 text-sm font-medium text-ink-700 transition-colors sm:h-9',
          'hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
          className,
        )}
      >
        <span className="text-ink-500">{strings.catalog.sortLabel}</span>
        <span aria-hidden="true">·</span>
        <span>{sortLabel(value)}</span>
        <ChevronDown aria-hidden="true" size={16} className="text-ink-500" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className="overlay-panel z-header w-56 overflow-hidden rounded-panel border border-border bg-surface py-1 shadow-overlay"
        >
          <DropdownMenu.RadioGroup
            value={value}
            onValueChange={(next) => onChange(next as ProductSort)}
          >
            {SORT_ORDER.map((sort) => (
              <DropdownMenu.RadioItem
                key={sort}
                value={sort}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 text-sm text-ink-700 outline-none select-none hover:bg-ink-100 hover:text-ink-900 focus:bg-ink-100 focus:text-ink-900"
              >
                <span className="grid h-4 w-4 place-content-center text-brand-700">
                  <DropdownMenu.ItemIndicator>
                    <Check aria-hidden="true" size={14} />
                  </DropdownMenu.ItemIndicator>
                </span>
                {sortLabel(sort)}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
