/**
 * The panel under a search field.
 *
 * It is a listbox, not a dialog: the caret stays in the field and the arrow keys
 * move a highlight that the field points at through `aria-activedescendant`, so
 * the highlighted row is announced without focus ever leaving the input. Every
 * row is rendered in a flat order — products, then brands, then categories —
 * and that order is the index space the field walks, which is why the groups are
 * drawn in that order rather than the order the sections read best in.
 *
 * The panel shows two different things and never both. A term long enough to
 * search gets the matches, grouped by what they are: products carry a thumbnail
 * and a price, because a shopper recognises a product by its picture and its
 * cost before its name. An empty term gets the terms this visitor searched
 * before, since that is the only useful answer to no question at all.
 *
 * A brand is drawn as a tag rather than a line with a thumbnail. The catalog has
 * no endpoint that lists brands, but a suggestion of that kind carries the brand
 * that matched, so the tag row is real data and not a guess.
 */

import { Clock, Tag, X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Thumbnail } from '@/components/common/Thumbnail';
import type { Suggestion, SuggestionKind } from '@/features/search/search.types';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/utils/formatPrice';

/** A product row and its price: the cost, with the old cost struck through. */
function Price({ suggestion }: { suggestion: Suggestion }) {
  if (suggestion.price === undefined || suggestion.price === null) {
    return null;
  }

  const { price, compareAtPrice, currency } = suggestion;
  const onSale = compareAtPrice !== null && compareAtPrice !== undefined && compareAtPrice > price;
  const options = currency ? { currency } : {};

  return (
    <span className="flex shrink-0 items-baseline gap-2 text-sm">
      <span className={cn('font-medium', onSale ? 'text-danger-600' : 'text-ink-900')}>
        {formatPrice(price, options)}
      </span>
      {onSale ? (
        <span className="text-xs text-ink-500 line-through">
          {formatPrice(compareAtPrice, options)}
        </span>
      ) : null}
    </span>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="py-1">
      <h3 className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">
        {title}
      </h3>
      <ul>{children}</ul>
    </section>
  );
}

/** The class every row shares, so a highlight and a hover look the same. */
const rowClass = 'flex w-full items-center gap-3 px-4 py-2 text-left text-sm';

type OptionProps = {
  id: string;
  index: number;
  active: boolean;
  onHover: (index: number) => void;
  onSelect: () => void;
  children: ReactNode;
};

function Option({ id, index, active, onHover, onSelect, children }: OptionProps) {
  return (
    <li>
      <button
        type="button"
        id={id}
        role="option"
        aria-selected={active}
        onClick={onSelect}
        onMouseEnter={() => onHover(index)}
        className={cn(rowClass, active && 'bg-ink-100')}
      >
        {children}
      </button>
    </li>
  );
}

/**
 * The heading over each group, in the current language.
 *
 * A function and not a constant: `strings` is reassigned in place when the
 * visitor switches language, so a record built at import would keep the headings
 * in whichever language the page loaded in.
 */
function groupTitle(kind: SuggestionKind): string {
  return {
    product: strings.search.products,
    brand: strings.search.brands,
    category: strings.search.categories,
  }[kind];
}

type Props = {
  /** Names the listbox and every option inside it. */
  listId: string;
  /** The term the panel is answering. Empty means the recent searches show. */
  term: string;
  items: readonly Suggestion[];
  status: 'idle' | 'loading' | 'error' | 'ready';
  activeIndex: number;
  onHover: (index: number) => void;
  onSelect: (suggestion: Suggestion) => void;
  onSeeAll: () => void;
  recent: readonly string[];
  onUseRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
};

export function SearchSuggestions({
  listId,
  term,
  items,
  status,
  activeIndex,
  onHover,
  onSelect,
  onSeeAll,
  recent,
  onUseRecent,
  onRemoveRecent,
  onClearRecent,
}: Props) {
  // The groups are drawn in this order and the index is the position in the same
  // walk, so the highlight and the field agree without a second lookup table.
  const groups: { kind: SuggestionKind; items: Suggestion[] }[] = [];
  const offsetByKind = new Map<SuggestionKind, number>();

  items.forEach((suggestion, index) => {
    let group = groups.find((entry) => entry.kind === suggestion.type);

    if (!group) {
      group = { kind: suggestion.type, items: [] };
      groups.push(group);
      offsetByKind.set(suggestion.type, index);
    }

    group.items.push(suggestion);
  });

  if (term === '') {
    if (recent.length === 0) {
      return null;
    }

    return (
      <div className="py-1">
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          <h3 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
            {strings.search.recent}
          </h3>
          <button
            type="button"
            onClick={onClearRecent}
            className="rounded-control px-1 text-xs text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
          >
            {strings.search.clearRecent}
          </button>
        </div>

        <ul>
          {recent.map((entry, index) => (
            <li key={entry} className="group flex items-center">
              <button
                type="button"
                id={`${listId}-option-${index}`}
                role="option"
                aria-selected={activeIndex === index}
                onClick={() => onUseRecent(entry)}
                onMouseEnter={() => onHover(index)}
                className={cn(rowClass, 'flex-1', activeIndex === index && 'bg-ink-100')}
              >
                <Clock aria-hidden="true" size={14} className="text-ink-400" />
                <span className="min-w-0 flex-1 truncate text-ink-800">{entry}</span>
              </button>

              <button
                type="button"
                onClick={() => onRemoveRecent(entry)}
                aria-label={strings.search.removeRecent(entry)}
                className="mr-3 rounded-control p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                <X aria-hidden="true" size={14} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <>
      {status === 'loading' ? (
        <p aria-live="polite" className="px-4 py-3 text-sm text-ink-600">
          {strings.search.searching}
        </p>
      ) : null}

      {status === 'error' ? (
        <p role="alert" className="px-4 py-3 text-sm text-danger-600">
          {strings.errors.network}
        </p>
      ) : null}

      {status === 'ready' && items.length === 0 ? (
        <p className="px-4 py-3 text-sm text-ink-600">{strings.search.noSuggestions(term)}</p>
      ) : null}

      {groups.map((group) =>
        group.kind === 'brand' ? (
          // Brands are the tag row: they carry no image worth a thumbnail and
          // there are never more than two of them.
          <section key={group.kind} className="py-1">
            <h3 className="px-4 pt-2 pb-1 text-xs font-semibold tracking-wide text-ink-500 uppercase">
              {groupTitle(group.kind)}
            </h3>

            <ul className="flex flex-wrap gap-2 px-4 py-1">
              {group.items.map((suggestion, position) => {
                const index = (offsetByKind.get('brand') ?? 0) + position;

                return (
                  <li key={suggestion.slug}>
                    <button
                      type="button"
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      onClick={() => onSelect(suggestion)}
                      onMouseEnter={() => onHover(index)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-control border border-border px-2.5 py-1 text-sm text-ink-700 transition-colors hover:border-brand-500 hover:bg-ink-100 hover:text-ink-900',
                        activeIndex === index && 'border-brand-500 bg-ink-100 text-ink-900',
                      )}
                    >
                      <Tag aria-hidden="true" size={13} className="text-ink-400" />
                      {suggestion.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : (
          <Section key={group.kind} title={groupTitle(group.kind)}>
            {group.items.map((suggestion, position) => {
              const index = (offsetByKind.get(group.kind) ?? 0) + position;

              return (
                <Option
                  key={`${suggestion.type}-${suggestion.slug}`}
                  id={`${listId}-option-${index}`}
                  index={index}
                  active={activeIndex === index}
                  onHover={onHover}
                  onSelect={() => onSelect(suggestion)}
                >
                  <Thumbnail
                    src={suggestion.imageUrl}
                    className="h-8 w-8 rounded-control"
                    iconSize={14}
                  />
                  <span className="min-w-0 flex-1 truncate text-ink-900">{suggestion.label}</span>
                  {suggestion.type === 'product' ? <Price suggestion={suggestion} /> : null}
                </Option>
              );
            })}
          </Section>
        ),
      )}

      {items.length > 0 ? (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full border-t border-border px-4 py-2 text-left text-sm font-medium text-brand-700 transition-colors hover:bg-ink-50"
        >
          {strings.search.viewAllResults(term)}
        </button>
      ) : null}
    </>
  );
}
