/**
 * Puts a page of products into the order their ids were asked for.
 *
 * A listing answers in its own order — featured first, or whatever its sort
 * says — because that is what a listing is. A caller that asked for an exact set
 * has an order of its own: the save-for-later list is newest first, and drawing
 * the answer as it arrived would show the shopper their own products shuffled.
 *
 * An id the answer does not hold is dropped rather than drawn as a gap. The
 * listing returns only products that are still on sale, so a missing one is a
 * product that can no longer be bought, and the wishlist's copy of it is the
 * thing that should disappear.
 *
 * Generic over anything with an id, so the same helper serves a page of product
 * summaries and the single-product result the merge reads.
 */
export function orderProductsByIds<T extends { id: string }>(
  products: readonly T[],
  ids: readonly string[],
): T[] {
  const byId = new Map(products.map((product) => [product.id, product]));

  return ids.flatMap((id) => {
    const product = byId.get(id);

    return product === undefined ? [] : [product];
  });
}
