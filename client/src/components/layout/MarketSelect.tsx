/**
 * The region and currency selector.
 *
 * Rendered on the announcement strip and again in the mobile drawer, both
 * reading the same store, so a change made in one is already true in the other.
 * The options are the configured markets; a list of one leaves the control in
 * place but with nothing to switch to, which is the honest state of this catalog.
 */

import { Globe } from 'lucide-react';
import { useId } from 'react';

import { getMarkets } from '@/config/site';
import { useMarketStore } from '@/features/market/market.store';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';

type Props = {
  /** `brand` sits on the announcement strip, `surface` inside a panel. */
  variant?: 'brand' | 'surface';
  className?: string;
};

export function MarketSelect({ variant = 'surface', className = '' }: Props) {
  const code = useMarketStore((state) => state.code);
  const select = useMarketStore((state) => state.select);
  const id = useId();

  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <Globe
        aria-hidden="true"
        size={14}
        className={cn(
          'pointer-events-none absolute left-2',
          variant === 'brand' ? 'text-brand-100' : 'text-ink-500',
        )}
      />

      <label htmlFor={id} className="sr-only">
        {strings.announcement.region}
      </label>

      <select
        id={id}
        value={code}
        onChange={(event) => select(event.target.value)}
        className={cn(
          'rounded-control border py-0.5 pr-1.5 pl-7 text-xs',
          variant === 'brand'
            ? 'border-brand-500 bg-brand-700 text-brand-50'
            : 'border-border bg-surface text-ink-700',
        )}
      >
        {getMarkets().map((market) => (
          <option key={market.code} value={market.code}>
            {market.code} · {market.currencyLabel}
          </option>
        ))}
      </select>
    </div>
  );
}
