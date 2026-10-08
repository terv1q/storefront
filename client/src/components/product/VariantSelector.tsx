/**
 * The options of a product.
 *
 * One group per attribute, each a single choice: a size, a colour, a finish. A
 * colour is drawn as a swatch and everything else as a labelled button, because a
 * colour is the one attribute whose value a shopper recognises faster by looking
 * than by reading. The swatch keeps its label in the accessible name, so nothing
 * depends on seeing it.
 *
 * The colour names are the ones the catalog stores, and the map below is a
 * presentation of them rather than a source of truth: a value that is not in it —
 * a colour added to the catalog tomorrow — is drawn as a labelled button, which is
 * the same control the other attributes use. It is not hidden and not guessed at.
 *
 * A value with no stock is disabled and says so, which is what "disabling
 * unavailable variant combinations" means for a catalog that stores options
 * independently: there is no combination row to look up, so availability is asked
 * of the value itself. See the note at the top of `variantSelection`.
 *
 * The choices are a radio group, because that is what they are: one of a set, the
 * arrow keys moving between them. Pressing a chosen value again does nothing —
 * deselecting is not a state a shopper can be in and still buy the product.
 */

import { Check } from 'lucide-react';

import type { VariantGroup, VariantSelection } from '@/features/products/variantSelection';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

/**
 * The catalog's colour values, as colours. Keys are the stored English values, so
 * this is the one place a value becomes a pixel.
 */
const SWATCHES: Record<string, string> = {
  Black: '#1c1917',
  Navy: '#1e293b',
  Sand: '#d8c3a5',
  'Natural Oak': '#d3b78a',
  Walnut: '#6b4a2f',
  'Matte White': '#f5f5f4',
};

type Props = {
  groups: readonly VariantGroup[];
  selection: VariantSelection;
  onSelect: (name: string, variantId: string) => void;
  className?: string;
};

export function VariantSelector({ groups, selection, onSelect, className }: Props) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {groups.map((group) => (
        <div
          key={group.name}
          role="radiogroup"
          aria-label={group.label}
          className="flex flex-col gap-2"
        >
          <p className="text-sm font-medium text-ink-900">{group.label}</p>

          <div className="flex flex-wrap gap-2">
            {group.options.map((option) => {
              const chosen = selection[group.name] === option.variant.id;
              const swatch = SWATCHES[option.variant.value];
              const name = `${group.label}: ${option.label}${
                option.available
                  ? ''
                  : ` — ${strings.productPage.variant.unavailable(option.label)}`
              }`;

              return (
                <button
                  key={option.variant.id}
                  type="button"
                  role="radio"
                  aria-checked={chosen}
                  aria-label={name}
                  title={option.available ? option.label : undefined}
                  disabled={!option.available}
                  onClick={() => onSelect(group.name, option.variant.id)}
                  className={cn(
                    'relative grid place-content-center rounded-control border transition-colors',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                    swatch !== undefined ? 'h-10 w-10 p-0' : 'min-w-11 px-3 py-1.5 text-sm',
                    chosen
                      ? 'border-brand-600 text-ink-900 ring-1 ring-brand-600'
                      : 'border-border text-ink-700 hover:border-ink-300',
                    !option.available &&
                      'cursor-not-allowed border-dashed opacity-45 hover:border-border',
                  )}
                >
                  {swatch !== undefined ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-7 w-7 rounded-full border border-ink-900/15"
                        style={{ backgroundColor: swatch }}
                      />
                      {/* A chosen swatch is marked with a tick as well as a ring,
                          so the state survives a colour named "Matte White". */}
                      {chosen ? (
                        <Check
                          aria-hidden="true"
                          size={14}
                          strokeWidth={3}
                          className="absolute text-ink-900 mix-blend-difference"
                        />
                      ) : null}
                    </>
                  ) : (
                    <>
                      {option.label}
                      {/* A value that cannot be chosen is struck through as well as
                          dimmed: dimming alone is a difference somebody has to notice. */}
                      {!option.available ? (
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-1 top-1/2 h-px bg-current"
                        />
                      ) : null}
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
