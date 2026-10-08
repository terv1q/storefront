/**
 * Ordering a fetched page by the ids it was asked for.
 *
 * The listing answers in its own order, so this is the step that puts the
 * shopper's saved products back into the order they saved them in. The case
 * worth testing is the one the catalog creates rather than the client: a product
 * that is no longer on sale does not come back, and the list has to close the
 * gap rather than draw an empty row.
 */

import { describe, expect, it } from 'vitest';

import { orderProductsByIds } from './orderProductsByIds';

const product = (id: string) => ({ id, name: `Product ${id}` });

describe('orderProductsByIds', () => {
  it('returns the products in the order the ids were given', () => {
    const products = [product('c'), product('a'), product('b')];

    expect(orderProductsByIds(products, ['b', 'c', 'a']).map((item) => item.id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('drops ids the answer does not hold', () => {
    const products = [product('a'), product('c')];

    expect(orderProductsByIds(products, ['a', 'b', 'c']).map((item) => item.id)).toEqual([
      'a',
      'c',
    ]);
  });

  it('ignores products no id asked for', () => {
    const products = [product('a'), product('b')];

    expect(orderProductsByIds(products, ['a']).map((item) => item.id)).toEqual(['a']);
  });

  it('answers with nothing when nothing was asked for', () => {
    expect(orderProductsByIds([product('a')], [])).toEqual([]);
  });
});
