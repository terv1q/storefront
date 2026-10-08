/**
 * The brand list, narrowed by a text field that sits above it.
 *
 * A category can carry more brands than a panel has room for, and scrolling a
 * list is a worse way to find a word than typing it. The field narrows what is
 * shown and nothing else: it never reaches the URL, never changes what the
 * listing holds, and is not part of what "clear all" clears. It is a view of the
 * list, not a filter on the catalog, and it is local state for exactly that
 * reason — a shopper who typed "sam" and then scrolled away would not expect to
 * find the catalog still narrowed by it.
 *
 * Only one brand can be chosen at a time, because the listing takes one. The rows
 * are therefore radios rather than checkboxes: a checkbox that silently unticks
 * another is a control that lies about what it does. The first row clears the
 * choice, so the section can be undone without clearing everything else.
 *
 * The counts come from the facet and describe the whole filtered set, not the
 * page on screen; the panel only ever holds one page of it.
 */

import { useId, useState } from 'react';

import type { BrandFacet } from '@/features/products/products.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  brands: readonly BrandFacet[];
  /** The chosen brand slug, or an empty string for all of them. */
  selected: string;
  onChange: (slug: string) => void;
  className?: string;
};

const rowClass =
  'flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 text-sm text-ink-700 hover:bg-ink-100';

export function BrandFilter({ brands, selected, onChange, className }: Props) {
  const [term, setTerm] = useState('');

  // The panel can be on screen twice at once — the column and the drawer — and two
  // radio groups sharing a name are one group to the browser, which would let a
  // click in one untick the other. The field's id follows for the same reason.
  const group = useId();
  const searchId = `${group}-search`;

  const needle = term.trim().toLowerCase();
  const visible =
    needle === '' ? brands : brands.filter((brand) => brand.name.toLowerCase().includes(needle));

  function countOf(slug: string): number | undefined {
    return brands.find((brand) => brand.slug === slug)?.count;
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="sticky top-0 z-base bg-surface pb-2">
        <label className="sr-only" htmlFor={searchId}>
          {strings.filters.brand.search}
        </label>
        <input
          id={searchId}
          type="search"
          value={term}
          placeholder={strings.filters.brand.search}
          onChange={(event) => setTerm(event.target.value)}
          className="w-full min-w-0 rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        />
      </div>

      <ul className="space-y-0.5">
        <li>
          <label className={rowClass}>
            <input
              type="radio"
              name={group}
              value=""
              checked={selected === ''}
              onChange={() => onChange('')}
              className="accent-brand-700"
            />
            <span className="flex-1">{strings.filters.brand.all}</span>
          </label>
        </li>

        {visible.map((brand) => (
          <li key={brand.slug}>
            <label className={rowClass}>
              <input
                type="radio"
                name={group}
                value={brand.slug}
                checked={selected === brand.slug}
                onChange={() => onChange(brand.slug)}
                className="accent-brand-700"
              />
              <span className="flex-1">{brand.name}</span>
              <span className="text-xs text-ink-500">{brand.count}</span>
            </label>
          </li>
        ))}
      </ul>

      {visible.length === 0 ? (
        <p className="px-2 text-sm text-ink-500">{strings.filters.brand.empty}</p>
      ) : null}

      {/* A chosen brand the text field has filtered out stays on the list: a
          control that disappears while it is still filtering the catalog is a
          control the shopper cannot undo. */}
      {needle !== '' && selected !== '' && !visible.some((brand) => brand.slug === selected) ? (
        <label className={cn(rowClass, 'bg-ink-100')}>
          <input
            type="radio"
            name={group}
            value={selected}
            checked
            onChange={() => onChange(selected)}
            className="accent-brand-700"
          />
          <span className="flex-1">{selected}</span>
          <span className="text-xs text-ink-500">{countOf(selected)}</span>
        </label>
      ) : null}
    </div>
  );
}
