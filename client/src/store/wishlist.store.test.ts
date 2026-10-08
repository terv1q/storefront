/**
 * The guest wishlist store.
 *
 * What is worth testing is the behaviour the page and every heart depend on:
 * that a product is on the list once however often it is saved, that the newest
 * save is first, and that the list survives a reload. The store is a module-level
 * singleton, so each test builds a fresh one from the module's own factory
 * rather than reaching into the instance the application would use.
 *
 * The last case is the one that is easy to forget: storage is shared with every
 * other page the visitor has open, and a list written by an older version of the
 * app is not a list this version can trust.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STORAGE_KEYS, readWishlist, writeWishlist } from '@/utils/storage';

import { useWishlistStore } from './wishlist.store';

/** The store's own actions, taken from the instance the app uses. */
const store = useWishlistStore;

const FIRST = '2f1b1f0e-6a1e-4f7a-9d5a-1c2b3d4e5f60';
const SECOND = '8b7c6d5e-4f3a-2b1c-9d8e-7f6a5b4c3d20';
const THIRD = 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e50';

beforeEach(() => {
  store.setState({ ids: [] });
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe('the guest wishlist store', () => {
  it('saves a product at the front of the list', () => {
    store.getState().add(FIRST);
    store.getState().add(SECOND);

    expect(store.getState().ids).toEqual([SECOND, FIRST]);
  });

  it('saves a product once however often it is saved', () => {
    store.getState().add(FIRST);
    store.getState().add(FIRST);

    expect(store.getState().ids).toEqual([FIRST]);
  });

  it('toggles a product on and off', () => {
    store.getState().toggle(FIRST);
    expect(store.getState().ids).toEqual([FIRST]);

    store.getState().toggle(FIRST);
    expect(store.getState().ids).toEqual([]);
  });

  it('removes several products in one pass', () => {
    store.getState().add(FIRST);
    store.getState().add(SECOND);
    store.getState().add(THIRD);

    store.getState().removeMany([FIRST, THIRD]);

    expect(store.getState().ids).toEqual([SECOND]);
  });

  it('writes every change through storage, newest first', () => {
    store.getState().add(FIRST);
    store.getState().add(SECOND);

    expect(readWishlist()).toEqual([SECOND, FIRST]);
  });

  it('opens with what a previous visit stored', async () => {
    writeWishlist([FIRST, SECOND]);

    // The list is read once, when the module is first evaluated, so a fresh
    // module is what a page load looks like. This is the only test here that
    // needs one.
    vi.resetModules();
    const fresh = await import('./wishlist.store');

    expect(fresh.useWishlistStore.getState().ids).toEqual([FIRST, SECOND]);
  });

  it('ignores what storage holds when it is not a list of ids', () => {
    window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify([FIRST, 7, null, '']));

    expect(readWishlist()).toEqual([FIRST]);
  });

  it('discards a stored value that is not a list at all', () => {
    window.localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify({ ids: [FIRST] }));

    expect(readWishlist()).toBeNull();
  });

  it('clears the list, in the store and in storage', () => {
    store.getState().add(FIRST);
    store.getState().clear();

    expect(store.getState().ids).toEqual([]);
    expect(readWishlist()).toEqual([]);
  });
});
