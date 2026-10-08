/**
 * One variant attribute — Size, Colour, Storage — as a row of selectable pills.
 *
 * The values are not written down here. They come from the facets endpoint, which
 * reads them from the variants the catalog actually holds, so a category that
 * stops stocking `XL` stops offering it, and an attribute a later stage adds to
 * the schema appears without a change to this file. Each pill carries the count
 * of products behind it, which is what tells a shopper that `XXL` exists but is
 * one product, rather than leaving them to find out by clicking.
 *
 * A value the catalog stores as a colour gets a swatch beside its name. The map
 * below is deliberately short and deliberately not translated: it holds hex
 * values, which are the same in every language, and only the values it recognises
 * — anything else is a labelled pill, which is also the honest rendering for a
 * value nobody anticipated. The label beside the swatch is always shown, so the
 * control does not depend on distinguishing two similar swatches.
 *
 * Selection is multiple, and both the label and `aria-pressed` carry it: a
 * coloured pill is not a state a screen reader can see.
 */

import { Check } from 'lucide-react';

import type { CatalogAttribute } from '@/features/products/catalogParams';
import type { AttributeFacet } from '@/features/products/products.types';
import { isAttributeSelected } from '@/features/products/catalogFilters';
import { cn } from '@/lib/cn';

type Props = {
  attribute: AttributeFacet;
  /** Every attribute currently filtering the listing, across all attributes. */
  selected: readonly CatalogAttribute[];
  onToggle: (value: string) => void;
  className?: string;
};

/**
 * The colours the seed actually uses, plus the ones a clothing catalog usually
 * carries. Keys are lowercase English values, which is what the facets publish.
 */
const SWATCHES: Readonly<Record<string, string>> = {
  black: '#1a1a17',
  white: '#ffffff',
  grey: '#9a9a94',
  gray: '#9a9a94',
  silver: '#cbcbc6',
  navy: '#1e3a8a',
  blue: '#2563eb',
  lightblue: '#93c5fd',
  sand: '#d8c3a5',
  beige: '#e8dcc8',
  brown: '#7c4a21',
  tan: '#c8a165',
  gold: '#c8891b',
  red: '#b3261e',
  burgundy: '#7f1d1d',
  pink: '#ec4899',
  purple: '#7c3aed',
  green: '#157f4a',
  olive: '#6b7a3a',
  yellow: '#eab308',
  orange: '#ea580c',
  transparent: 'transparent',
};

export function AttributeFilter({ attribute, selected, onToggle, className }: Props) {
  return (
    <ul className={cn('flex flex-wrap gap-2', className)}>
      {attribute.values.map((value) => {
        const active = isAttributeSelected(selected, attribute.name, value.value);
        const swatch = SWATCHES[value.value.trim().toLowerCase()];

        return (
          <li key={value.value}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(value.value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                active
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-border bg-surface text-ink-700 hover:border-ink-300 hover:bg-ink-100',
              )}
            >
              {swatch !== undefined ? (
                <span
                  aria-hidden="true"
                  style={{ backgroundColor: swatch }}
                  className="h-3.5 w-3.5 rounded-full border border-border-strong"
                />
              ) : null}

              <span>{value.label}</span>

              <span className={cn('text-xs', active ? 'text-brand-700' : 'text-ink-500')}>
                {value.count}
              </span>

              {active ? <Check aria-hidden="true" size={13} /> : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
