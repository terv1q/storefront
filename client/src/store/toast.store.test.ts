/**
 * The notification store.
 *
 * Three things matter and nothing else does: that a burst of notifications does
 * not cover the page it is reporting on, that each one leaves by itself, and
 * that taking one away early removes that one rather than the newest. The store
 * is a module-level singleton, so each test reads and resets the same instance
 * the application would use.
 *
 * Timers are faked throughout, because the whole point of a notification is
 * that it goes away without anybody touching it.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { notify, useToastStore } from './toast.store';

const store = useToastStore;

beforeEach(() => {
  vi.useFakeTimers();
  store.setState({ toasts: [] });
});

afterEach(() => {
  store.getState().clear();
  vi.useRealTimers();
});

describe('the notification store', () => {
  it('keeps the newest three and drops the oldest', () => {
    store.getState().notify('first');
    store.getState().notify('second');
    store.getState().notify('third');
    store.getState().notify('fourth');

    expect(store.getState().toasts.map((toast) => toast.message)).toEqual([
      'second',
      'third',
      'fourth',
    ]);
  });

  it('gives each notification an id of its own, even in the same millisecond', () => {
    const first = store.getState().notify('first');
    const second = store.getState().notify('second');

    expect(first).not.toBe(second);
  });

  it('removes a notification on its own timer', () => {
    store.getState().notify('short', { durationMs: 1000 });

    vi.advanceTimersByTime(999);
    expect(store.getState().toasts).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(store.getState().toasts).toHaveLength(0);
  });

  it('gives an error longer on screen than a confirmation', () => {
    store.getState().notify('confirmed', { tone: 'success' });
    store.getState().notify('failed', { tone: 'error' });

    vi.advanceTimersByTime(4000);
    expect(store.getState().toasts.map((toast) => toast.message)).toEqual(['failed']);

    vi.advanceTimersByTime(2000);
    expect(store.getState().toasts).toHaveLength(0);
  });

  it('takes away the notification it was asked for and not the newest', () => {
    const first = store.getState().notify('first');
    store.getState().notify('second');

    store.getState().dismiss(first);

    expect(store.getState().toasts.map((toast) => toast.message)).toEqual(['second']);
  });

  it('clears everything at once', () => {
    store.getState().notify('first');
    store.getState().notify('second');

    store.getState().clear();

    expect(store.getState().toasts).toHaveLength(0);
  });

  it('notifies from outside a component', () => {
    notify('added to cart', { tone: 'success' });

    expect(store.getState().toasts).toEqual([
      expect.objectContaining({ message: 'added to cart', tone: 'success' }),
    ]);
  });
});
