/**
 * The market the visitor picked.
 *
 * One store rather than a piece of state per component, because the same choice
 * is offered in two places — the announcement strip and the mobile drawer — and
 * two copies would disagree the moment one of them changed. It is persisted
 * through `utils/storage`, and a stored code that is no longer in the configured
 * list is ignored, so removing a market from `config/site.ts` cannot leave a
 * visitor stuck on it.
 *
 * The list holds one market today, so this is the seam a second currency would
 * be added behind rather than a live switch.
 */

import { create } from 'zustand';

import { siteConfig } from '@/config/site';
import { STORAGE_KEYS, readString, removeItem, writeString } from '@/utils/storage';

type MarketState = {
  code: string;
  select: (code: string) => void;
};

/** The default market, or the configured one nearest the stored code. */
function initialCode(): string {
  const stored = readString(STORAGE_KEYS.market);
  const known = siteConfig.markets.some((market) => market.code === stored);

  return known && stored !== null ? stored : siteConfig.markets[0].code;
}

export const useMarketStore = create<MarketState>((set) => ({
  code: initialCode(),

  select: (code) => {
    if (!siteConfig.markets.some((market) => market.code === code)) {
      return;
    }

    // The choice still applies to this session when storage refuses it; the
    // next load falls back to the default.
    if (writeString(STORAGE_KEYS.market, code) === false) {
      removeItem(STORAGE_KEYS.market);
    }

    set({ code });
  },
}));
