/**
 * The filter panel, rendered.
 *
 * The URL vocabulary has its own tests; these cover the half that only shows up
 * once something is on screen. A panel that renders its sections but wires a
 * control to the wrong change looks correct in a diff and is wrong in the
 * shopper's hands, so each control here is checked for the change it reports
 * rather than for its markup.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_CATALOG_PARAMS } from '@/features/products/catalogParams';
import type { CatalogParams } from '@/features/products/catalogParams';
import type { ProductFacets } from '@/features/products/products.types';

import { ProductFilters } from './ProductFilters';

// The suite does not run with `globals: true`, so the automatic teardown that
// Testing Library installs alongside those globals is not in place. Without this
// every test would render into the same document and the second one would find
// two of everything.
afterEach(cleanup);

const FACETS: ProductFacets = {
  total: 20,
  // Minor units, as the endpoint counts.
  price: { min: 18_900_000, max: 149_000_000 },
  brands: [{ slug: 'ziyo-wear', name: 'Ziyo Wear', logoUrl: null, count: 20 }],
  attributes: [
    {
      name: 'Color',
      label: 'Colour',
      values: [
        { value: 'Black', label: 'Black', count: 10 },
        { value: 'Navy', label: 'Navy', count: 10 },
      ],
    },
  ],
};

function renderPanel(params: Partial<CatalogParams> = {}) {
  const onChange = vi.fn();
  const onClearAll = vi.fn();

  render(
    <ProductFilters
      params={{ ...DEFAULT_CATALOG_PARAMS, ...params }}
      facets={FACETS}
      isLoading={false}
      isError={false}
      errorMessage={null}
      onRetry={() => {}}
      onChange={onChange}
      onClearAll={onClearAll}
    />,
  );

  return { onChange, onClearAll };
}

describe('ProductFilters', () => {
  it('offers the brands and the attributes the facets reported', () => {
    renderPanel();

    expect(screen.getByText('Ziyo Wear')).toBeDefined();
    expect(screen.getByText('Colour')).toBeDefined();
    expect(screen.getByRole('button', { name: /Black/ })).toBeDefined();
  });

  it('reports a chosen brand', async () => {
    const { onChange } = renderPanel();

    await userEvent.click(screen.getByText('Ziyo Wear'));

    expect(onChange).toHaveBeenCalledWith({ brand: 'ziyo-wear' });
  });

  it('reports an attribute the shopper switches on, keeping the others', async () => {
    const { onChange } = renderPanel({ attrs: [{ name: 'Color', value: 'Navy' }] });

    await userEvent.click(screen.getByRole('button', { name: /Black/ }));

    expect(onChange).toHaveBeenCalledWith({
      attrs: [
        { name: 'Color', value: 'Navy' },
        { name: 'Color', value: 'Black' },
      ],
    });
  });

  it('removes an attribute the shopper switches off', async () => {
    const { onChange } = renderPanel({ attrs: [{ name: 'Color', value: 'Navy' }] });

    await userEvent.click(screen.getByRole('button', { name: /Navy/ }));

    expect(onChange).toHaveBeenCalledWith({ attrs: [] });
  });

  it('reports a rating floor', async () => {
    const { onChange } = renderPanel();

    await userEvent.click(screen.getByText('4 stars and up'));

    expect(onChange).toHaveBeenCalledWith({ minRating: 4 });
  });

  it('reports both availability toggles', async () => {
    const { onChange } = renderPanel();

    await userEvent.click(screen.getByText('In stock only'));

    expect(onChange).toHaveBeenCalledWith({ inStock: true });
  });

  it('offers a clear-all only when something is set', () => {
    renderPanel();

    expect(screen.queryByRole('button', { name: 'Clear all filters' })).toBeNull();
  });

  it('clears everything when asked', async () => {
    const { onClearAll } = renderPanel({ minRating: 4, inStock: true });

    await userEvent.click(screen.getByRole('button', { name: 'Clear all filters' }));

    expect(onClearAll).toHaveBeenCalledOnce();
  });

  it('narrows the brand list by the text field without reporting a change', async () => {
    const { onChange } = renderPanel();

    await userEvent.type(screen.getByRole('searchbox'), 'nope');

    expect(screen.queryByText('Ziyo Wear')).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
