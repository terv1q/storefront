/**
 * The search field, and the panel under it.
 *
 * One component serves every place a shopper can search: the desktop header,
 * the mobile panel, the drawer, and the search page. The places differ in how
 * much room they have, not in how the field behaves, so the scope selector is
 * the only part a caller can leave out.
 *
 * Three things are handled here rather than by a caller.
 *
 * Typing is debounced before it reaches the query layer, so a request is sent
 * for the term the shopper stopped at rather than for every keystroke, and a
 * term shorter than the minimum is never sent at all. The query is keyed by that
 * debounced term and carries an abort signal, so a term that is replaced while
 * its own request is still in flight is cancelled rather than raced: the answer
 * on screen always belongs to the term on screen.
 *
 * Submitted terms are written to the recent-search store, which is what the
 * panel shows when the field is empty. Following a suggestion counts as a
 * search; merely typing does not, or the list would fill with prefixes.
 *
 * The panel is a Radix popover, which supplies the press outside and the Escape
 * that close it. Its automatic focus moves are turned off, because this is not a
 * dialog: the caret belongs in the field, and closing must not move focus.
 */

import * as Popover from '@radix-ui/react-popover';
import { LoaderCircle, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormEvent, KeyboardEvent } from 'react';

import { SearchSuggestions } from '@/components/search/SearchSuggestions';
import { MIN_SEARCH_LENGTH } from '@/features/search/search.constants';
import { useSearchSuggestions } from '@/features/search/search.queries';
import { useRecentSearches } from '@/features/search/recentSearches';
import type { Suggestion } from '@/features/search/search.types';
import { useCategoryTree } from '@/hooks/useProducts';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

/** How long typing has to stop before a suggestion is requested. */
const SUGGESTION_DEBOUNCE_MS = 250;

type Props = {
  className?: string;
  /** Called after a submit or a suggestion is followed, for a mobile panel. */
  onNavigate?: () => void;
  /**
   * Whether the caret is put in the field as soon as it is drawn. The two
   * callers are the two places the field appears on demand — the header panel
   * and the drawer — and both want typing to start without a second press.
   */
  focusOnMount?: boolean;
  inputId?: string;
  /** The term the field starts with. The search page passes the one in the URL. */
  initialTerm?: string;
  /** The mobile drawer has no room for the scope selector. */
  showScope?: boolean;
};

/** Where a suggestion leads. Brands have no page of their own, so they search. */
function suggestionTarget(suggestion: Suggestion): string {
  switch (suggestion.type) {
    case 'product':
      return paths.product(suggestion.slug);
    case 'category':
      return paths.category(suggestion.slug);
    default:
      return `${paths.search}?q=${encodeURIComponent(suggestion.label)}`;
  }
}

export function SearchBar({
  className = '',
  onNavigate,
  focusOnMount = false,
  inputId,
  initialTerm = '',
  showScope = true,
}: Props) {
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialTerm);
  const [scope, setScope] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const listId = useId();
  const scopeId = useId();

  const recent = useRecentSearches((state) => state.terms);
  const remember = useRecentSearches((state) => state.remember);
  const forget = useRecentSearches((state) => state.forget);
  const clearRecent = useRecentSearches((state) => state.clear);

  const debounced = useDebouncedValue(term, SUGGESTION_DEBOUNCE_MS);
  const trimmed = term.trim();
  const searchable = trimmed.length >= MIN_SEARCH_LENGTH;

  /**
   * The caret is placed here rather than through the field's own `autoFocus`
   * attribute. `autoFocus` is a hint for a document that is loading, and both
   * callers draw this field into something that opens afterwards — a popover and
   * a drawer — so the attribute is a promise the browser cannot keep; it also
   * reads, to anybody auditing the page, as the page taking focus on its own.
   * An effect that runs when the field appears is the same move made explicitly,
   * by the component that owns the field, at the moment it is actually on screen.
   */
  useEffect(() => {
    if (focusOnMount) {
      inputRef.current?.focus();
    }
  }, [focusOnMount]);

  // Nothing is requested while the term is too short, and a whitespace-only term
  // never reaches the query layer.
  const suggestions = useSearchSuggestions(open && searchable ? debounced : '');
  const categories = useCategoryTree();

  const items = open && searchable ? (suggestions.data?.items ?? []) : [];
  const searching = searchable && suggestions.isFetching && suggestions.data === undefined;

  // The field is empty, so there is nothing to match and the recent terms are
  // the only useful answer. Both modes share one index space: the arrow keys
  // walk whichever list is on screen.
  const showRecent = trimmed === '' && recent.length > 0;
  const optionCount = searchable ? items.length : recent.length;
  const listVisible = open && (searchable || showRecent);

  // A new term invalidates the highlight that pointed into the old results.
  useEffect(() => {
    setActiveIndex(-1);
  }, [debounced]);

  const close = () => {
    setOpen(false);
    setActiveIndex(-1);
  };

  const submit = (event?: FormEvent) => {
    event?.preventDefault();

    if (trimmed === '') {
      return;
    }

    remember(trimmed);

    const query = `?q=${encodeURIComponent(trimmed)}`;

    navigate(scope === '' ? `${paths.search}${query}` : `${paths.category(scope)}${query}`);
    close();
    onNavigate?.();
  };

  const follow = (suggestion: Suggestion) => {
    remember(trimmed);
    navigate(suggestionTarget(suggestion));
    close();
    onNavigate?.();
  };

  const useTerm = (entry: string) => {
    remember(entry);
    navigate(`${paths.search}?q=${encodeURIComponent(entry)}`);
    close();
    onNavigate?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      // The panel closes first; a second Escape leaves the field.
      if (listVisible) {
        event.preventDefault();
        close();
      }

      return;
    }

    if (!listVisible || optionCount === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % optionCount);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (current <= 0 ? optionCount - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();

      if (searchable) {
        const suggestion = items[activeIndex];

        if (suggestion) {
          follow(suggestion);
        }
      } else {
        const entry = recent[activeIndex];

        if (entry) {
          useTerm(entry);
        }
      }
    }
  };

  const clear = () => {
    setTerm('');
    close();
    inputRef.current?.focus();
  };

  return (
    <Popover.Root open={listVisible} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <Popover.Anchor asChild>
        <div
          className={cn('relative', className)}
          // The field keeps focus while the panel is open, so focus leaving the
          // field is what closes it — not a press outside, which the popover
          // already handles.
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              close();
            }
          }}
        >
          <form role="search" onSubmit={submit} className="flex items-stretch gap-2">
            {showScope ? (
              <>
                <label htmlFor={scopeId} className="sr-only">
                  {strings.search.scope}
                </label>
                <select
                  id={scopeId}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  className="hidden h-10 max-w-40 shrink-0 rounded-control border border-border bg-surface px-2.5 text-sm text-ink-700 sm:block"
                >
                  <option value="">{strings.search.allCategories}</option>
                  {categories.categories?.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </>
            ) : null}

            {/* The icon, the field, and the clear button are one row of flex
                siblings rather than an icon laid over the input. An overlay has
                to be positioned against a padding that only fits one font size,
                so it drifts as soon as the field is drawn anywhere else; in a
                row there is nothing to keep in register, and the text can never
                run under the icon or the button. */}
            <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-control border border-border bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
              <Search aria-hidden="true" size={16} className="shrink-0 text-ink-400" />

              <label htmlFor={inputId ?? generatedId} className="sr-only">
                {strings.search.label}
              </label>

              <input
                ref={inputRef}
                id={inputId ?? generatedId}
                // Not `type="search"`: that makes the browser draw its own clear
                // button inside the field, which lands next to this component's
                // own and gives the shopper two crosses that do the same thing.
                type="text"
                value={term}
                autoComplete="off"
                enterKeyHint="search"
                placeholder={strings.search.placeholder}
                role="combobox"
                aria-expanded={listVisible}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
                }
                onChange={(event) => {
                  setTerm(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={handleKeyDown}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400"
              />

              {trimmed !== '' ? (
                <button
                  type="button"
                  onClick={clear}
                  aria-label={strings.search.clear}
                  className="-mr-1 shrink-0 rounded-control p-1 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
                >
                  <X aria-hidden="true" size={16} />
                </button>
              ) : null}
            </div>

            <button
              type="submit"
              aria-label={strings.search.label}
              className="grid h-10 w-10 shrink-0 place-content-center rounded-control bg-brand-600 text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {searching ? (
                <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
              ) : (
                <Search aria-hidden="true" size={18} />
              )}
            </button>
          </form>
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          id={listId}
          role="listbox"
          aria-label={strings.search.suggestions}
          align="start"
          sideOffset={8}
          collisionPadding={8}
          // Not a dialog: the caret belongs in the field, and closing must not
          // move focus anywhere either. Focus may sit in the field, which is
          // outside the panel, so moving it is not what closes the panel —
          // `onBlurCapture` on the field decides that.
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
          onFocusOutside={(event) => event.preventDefault()}
          /**
           * A press inside the panel must not move focus out of the field.
           *
           * The panel lives in a portal, so a suggestion button is not inside the
           * wrapper that watches for the field losing focus. Pressing one moved
           * the caret to that button, the field's `onBlurCapture` saw focus leave
           * its subtree, and the panel closed on the way down — before the click
           * ever fired. The shopper saw a list that vanished under the cursor and
           * a product that would not open.
           *
           * Cancelling the default of the press keeps the caret in the field and
           * lets the click land. Keyboard use is unaffected: it never relied on
           * the press, and the arrow keys and Enter drive the same handlers.
           */
          onMouseDown={(event) => event.preventDefault()}
          className="overlay-panel z-header overflow-hidden rounded-panel border border-border bg-surface shadow-overlay"
          style={{ width: 'var(--radix-popover-trigger-width)', maxWidth: 'calc(100vw - 2rem)' }}
        >
          <SearchSuggestions
            listId={listId}
            term={trimmed}
            items={items}
            status={
              searching
                ? 'loading'
                : suggestions.isError
                  ? 'error'
                  : suggestions.isSuccess
                    ? 'ready'
                    : 'idle'
            }
            activeIndex={activeIndex}
            onHover={setActiveIndex}
            onSelect={follow}
            onSeeAll={() => submit()}
            recent={recent}
            onUseRecent={useTerm}
            onRemoveRecent={forget}
            onClearRecent={clearRecent}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
