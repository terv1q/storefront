/**
 * Reading the category tree.
 *
 * Two sections of the home page name a category by slug in `config/home.ts` and
 * need the category's name, illustration, and product total to draw it. The
 * endpoints to do that are `GET /api/categories` and `GET /api/categories/:slug`,
 * and opening a request per named category would be four requests where the page
 * already holds one tree covering all of them.
 *
 * The lookup descends, because the slugs the home page names are not all at the
 * top level: clearance and bundles are children of deals. A search that only
 * looked at the roots would silently drop two tiles out of three, which is the
 * sort of failure that looks like an empty catalog rather than a bug.
 */

import type { CategoryNode } from '@/features/products/products.types';

/** One node by slug, or `undefined` when the catalog does not have it. */
export function findCategory(
  nodes: readonly CategoryNode[],
  slug: string,
): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.slug === slug) {
      return node;
    }

    const found = findCategory(node.children, slug);

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

/** The node one level up from a slug, or `undefined` at the top level. */
export function findParent(nodes: readonly CategoryNode[], slug: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.children.some((child) => child.slug === slug)) {
      return node;
    }

    const found = findParent(node.children, slug);

    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

/**
 * The chain of categories from the top level down to a slug, root first.
 *
 * The product page needs the shelf it is on as a trail rather than as a row, and
 * the product endpoint answers with the product's own category and not its
 * ancestors. Walking the tree is what turns the one into the other, and it is the
 * same tree the header already holds for its catalog menu.
 *
 * An empty array means the slug is not in the tree at all — a category that has
 * been deactivated while a product still names it — which a caller reads as "draw
 * what you have" rather than as an error.
 */
export function findTrail(nodes: readonly CategoryNode[], slug: string): CategoryNode[] {
  for (const node of nodes) {
    if (node.slug === slug) {
      return [node];
    }

    const below = findTrail(node.children, slug);

    if (below.length > 0) {
      return [node, ...below];
    }
  }

  return [];
}

/**
 * The row of categories the visitor is currently moving along.
 *
 * A category page shows the shelf it sits on, not the shelf inside it: someone
 * browsing footwear wants to see clothing next to it, and the subcategories of
 * footwear are what they see after they arrive. So a top-level category shows
 * its own children, and anything below shows its siblings. The category itself
 * is in the row either way, which is what gives the row a selected item.
 */
export function categoryRow(nodes: readonly CategoryNode[], slug: string): readonly CategoryNode[] {
  const parent = findParent(nodes, slug);

  if (parent !== undefined) {
    return parent.children;
  }

  return findCategory(nodes, slug)?.children ?? [];
}
