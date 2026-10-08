/**
 * The price control: two bounds, set by typing, dragging, or pressing a preset.
 *
 * Three ways in, one value out. The numeric fields are what a shopper types when
 * they know the number, the pair of sliders is what they use when they do not,
 * and the presets describe the bands the category actually fills — they are
 * derived from the facets' real bounds, so a category from 40 000 to 90 000 gets
 * three useful buttons instead of four that all say the same thing.
 *
 * Everything the shopper does here is held locally and committed through a
 * debounce. Dragging a slider and typing a digit both fire far more often than a
 * request should: without the pause, "250 000" is six requests for six prefixes
 * of a number, and the last of them is the only one anybody wanted. The pause is
 * the same one the search fields use.
 *
 * The URL is still the single source of truth. The local copy exists only for as
 * long as a keystroke is in flight, and when the URL changes from somewhere else
 * — a chip removed, the panel cleared — the fields follow it back.
 */

import { useEffect, useRef, useState } from 'react';

import { DEFAULT_DEBOUNCE_MS, useDebouncedValue } from '@/hooks/useDebouncedValue';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { MINOR_UNITS_PER_UNIT, formatPrice } from '@/utils/formatPrice';

/** The bounds the whole slider spans, in so'm, as the facets reported them. */
export type PriceBounds = { min: number; max: number };

type Props = {
  /** The floor, in so'm, or `null` when the shopper has not set one. */
  minPrice: number | null;
  maxPrice: number | null;
  /** `null` when nothing matches, which is when the control has nothing to span. */
  bounds: PriceBounds | null;
  onChange: (change: { minPrice?: number | null; maxPrice?: number | null }) => void;
  className?: string;
};

/** How many values a preset band is worth splitting the range into. */
const PRESET_COUNT = 3;

const fieldClass =
  'w-full min-w-0 rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const presetClass =
  'rounded-control border border-border px-2.5 py-1.5 text-xs text-ink-700 transition-colors hover:border-ink-300 hover:bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/**
 * The thumb styling, repeated for both engines.
 *
 * The inputs themselves are transparent and drawn over one track, so the thumb
 * is the only part of the native control that shows. It gets its own hit area
 * back with `pointer-events-auto`, because the element around it must not
 * swallow the clicks meant for the other slider.
 */
const sliderClass = cn(
  'pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 appearance-none bg-transparent',
  '[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-brand-700 [&::-webkit-slider-thumb]:bg-surface [&::-webkit-slider-thumb]:shadow-overlay',
  '[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-brand-700 [&::-moz-range-thumb]:bg-surface',
);

/** The field's text for a bound: the number, or nothing at all when unset. */
function toText(amount: number | null): string {
  return amount === null ? '' : String(Math.round(amount));
}

/** What the shopper typed, read as a whole amount of so'm. Anything else is unset. */
function toAmount(text: string): number | null {
  const trimmed = text.trim();

  if (trimmed === '') {
    return null;
  }

  const value = Number.parseInt(trimmed, 10);

  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** A step that gives about a hundred stops across the range, and never zero. */
function stepFor(span: number): number {
  return Math.max(1, Math.round(span / 100));
}

/** A bound in so'm, written the way the cards write money. */
function money(som: number): string {
  return formatPrice(Math.round(som) * MINOR_UNITS_PER_UNIT);
}

/** Preset bands, measured against the range the category really holds. */
function presetsFor(
  bounds: PriceBounds,
): { key: string; label: string; from: number; to: number }[] {
  const span = bounds.max - bounds.min;

  if (span <= 0) {
    return [];
  }

  const size = span / PRESET_COUNT;

  return Array.from({ length: PRESET_COUNT }, (_, index) => {
    const from = Math.round(bounds.min + size * index);
    const to =
      index === PRESET_COUNT - 1
        ? Math.round(bounds.max)
        : Math.round(bounds.min + size * (index + 1));

    const label =
      index === 0
        ? strings.filters.price.under(money(to))
        : index === PRESET_COUNT - 1
          ? strings.filters.price.over(money(from))
          : strings.filters.price.between(money(from), money(to));

    return { key: `${from}-${to}`, label, from, to };
  });
}

export function PriceRangeFilter({ minPrice, maxPrice, bounds, onChange, className }: Props) {
  const [minText, setMinText] = useState(() => toText(minPrice));
  const [maxText, setMaxText] = useState(() => toText(maxPrice));

  const debouncedMin = useDebouncedValue(minText, DEFAULT_DEBOUNCE_MS);
  const debouncedMax = useDebouncedValue(maxText, DEFAULT_DEBOUNCE_MS);

  // The last bounds this control saw, so an echo of its own change is not mistaken
  // for a change made elsewhere and does not overwrite what is half-typed.
  const seen = useRef({ min: minPrice, max: maxPrice });

  useEffect(() => {
    if (seen.current.min === minPrice && seen.current.max === maxPrice) {
      return;
    }

    seen.current = { min: minPrice, max: maxPrice };
    setMinText(toText(minPrice));
    setMaxText(toText(maxPrice));
  }, [minPrice, maxPrice]);

  useEffect(() => {
    let nextMin = toAmount(debouncedMin);
    let nextMax = toAmount(debouncedMax);

    // A floor above a ceiling is not a range. The shopper gets the two numbers
    // the way they meant them rather than an empty listing.
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
    }

    if (nextMin === minPrice && nextMax === maxPrice) {
      return;
    }

    const change: { minPrice?: number | null; maxPrice?: number | null } = {};

    if (nextMin !== minPrice) {
      change.minPrice = nextMin;
    }

    if (nextMax !== maxPrice) {
      change.maxPrice = nextMax;
    }

    seen.current = { min: nextMin, max: nextMax };
    onChange(change);
  }, [debouncedMin, debouncedMax, minPrice, maxPrice, onChange]);

  if (bounds === null || bounds.max <= bounds.min) {
    return (
      <p className={cn('text-sm text-ink-500', className)}>{strings.filters.price.unavailable}</p>
    );
  }

  const span = bounds.max - bounds.min;
  const step = stepFor(span);
  const low = toAmount(minText) ?? bounds.min;
  const high = toAmount(maxText) ?? bounds.max;

  const positionOf = (value: number) =>
    Math.min(100, Math.max(0, ((value - bounds.min) / span) * 100));

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{strings.filters.price.min}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minText}
            placeholder={strings.filters.price.min}
            onChange={(event) => setMinText(event.target.value)}
            className={fieldClass}
          />
        </label>

        <span aria-hidden="true" className="text-ink-400">
          –
        </span>

        <label className="min-w-0 flex-1">
          <span className="sr-only">{strings.filters.price.max}</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxText}
            placeholder={strings.filters.price.max}
            onChange={(event) => setMaxText(event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="relative h-6">
        <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-ink-200" />
        <span
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-600"
          style={{ left: `${positionOf(low)}%`, right: `${100 - positionOf(high)}%` }}
        />

        <input
          type="range"
          aria-label={strings.filters.price.min}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={low}
          onChange={(event) => setMinText(event.target.value)}
          className={sliderClass}
        />

        <input
          type="range"
          aria-label={strings.filters.price.max}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={high}
          onChange={(event) => setMaxText(event.target.value)}
          className={sliderClass}
        />
      </div>

      <div
        role="group"
        aria-label={strings.filters.price.presetsLabel}
        className="flex flex-wrap gap-2"
      >
        {presetsFor(bounds).map((preset) => {
          const active = minPrice === preset.from && maxPrice === preset.to;

          return (
            <button
              key={preset.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setMinText(toText(preset.from));
                setMaxText(toText(preset.to));
              }}
              className={cn(presetClass, active && 'border-brand-600 bg-brand-50 text-brand-800')}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
