/**
 * The language switcher in the header.
 *
 * Three languages are a small enough set to show as a list rather than as a
 * select, and each entry is written in its own language — «Русский»,
 * «Oʻzbekcha», «English» — because the person looking for it may not be able to
 * read the language the page is currently in. A list of the *current* language's
 * names for other languages would be useless to exactly the visitor who needs
 * it, and it would also have to be translated three times.
 *
 * The trigger carries the two-letter code rather than an icon alone, so the
 * current language is readable without opening the menu, and the code is the
 * same in every language, which makes it the one label that does not move when
 * the choice is made.
 *
 * The list is a Radix radio group: the entries are a single choice, and the
 * primitive gives it the semantics and the keyboard handling for one — arrow
 * keys move, the check mark is `aria-checked` rather than a drawing.
 *
 * Choosing an entry calls `setLanguage`, which reassigns the copy tables and
 * notifies `App`, which rebuilds the tree. Nothing is held here: the check mark
 * reads the live language on every render, so it is right whether the change
 * came from this control or from a stored preference on the next load.
 */

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Languages } from 'lucide-react';

import { LANGUAGES, languageEntry } from '@/i18n/languages';
import type { Language } from '@/i18n/languages';
import { setLanguage, strings, useLanguage } from '@/i18n/strings';
import { cn } from '@/lib/cn';

const itemClass =
  'flex w-full cursor-pointer items-center gap-3 rounded-control px-2 py-1.5 text-left text-sm text-ink-700 outline-none select-none hover:bg-ink-100 hover:text-ink-900 focus:bg-ink-100 focus:text-ink-900 data-[state=checked]:text-ink-900';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const language = useLanguage();
  const current = languageEntry(language);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={strings.language.current(current.name)}
        className={cn(
          'inline-flex h-10 items-center gap-1.5 rounded-control px-2 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 data-[state=open]:bg-ink-100 data-[state=open]:text-ink-900',
          className,
        )}
      >
        <Languages aria-hidden="true" size={20} />
        <span className="tabular-nums">{current.short}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          collisionPadding={8}
          className="overlay-panel z-header w-48 rounded-panel border border-border bg-surface p-1 shadow-overlay"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs text-ink-500">
            {strings.language.menuTitle}
          </DropdownMenu.Label>

          <DropdownMenu.RadioGroup
            value={language}
            onValueChange={(value) => setLanguage(value as Language)}
          >
            {LANGUAGES.map((entry) => (
              <DropdownMenu.RadioItem value={entry.code} key={entry.code} className={itemClass}>
                <Check
                  aria-hidden="true"
                  size={16}
                  className={cn(
                    'shrink-0',
                    entry.code === language ? 'text-brand-600' : 'text-transparent',
                  )}
                />
                {entry.name}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
