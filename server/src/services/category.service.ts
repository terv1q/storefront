/**
 * Category reads: the whole tree for navigation, and one category with the
 * chain of ancestors that leads to it.
 *
 * `productCount` counts the active products in a category *and in its
 * descendants*. The seed files every product under a leaf, so counting only the
 * category's own rows would report zero for every top-level entry — true of the
 * table, useless in a menu.
 *
 * Dates and money do not appear here, so the shapes go out as they come back
 * from the database.
 *
 * Every read takes a locale. The tree is ordered by the translated name, not the
 * English one, so a Russian menu is alphabetical in Russian instead of following
 * the English alphabet. A category whose translation is missing falls back to
 * English on its own row and does not drag its parent or its children with it:
 * each row resolves its own text, so a half-translated branch reads as a mix of
 * languages rather than as one wrong language.
 */

import { prisma } from '../database/index.js';
import { ApiError } from '../utils/apiError.js';
import { LOCALE_SUFFIX, type CatalogLocale } from '../utils/locale.js';

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
  children: CategoryNode[];
};

export type CategoryDetail = CategoryNode & {
  /** Ancestors from the root down to the category itself, for the breadcrumb. */
  breadcrumbs: CategoryNode[];
};

const CATEGORY_SELECT = {
  id: true,
  name: true,
  nameRu: true,
  nameUz: true,
  slug: true,
  description: true,
  descriptionRu: true,
  descriptionUz: true,
  imageUrl: true,
  parentId: true,
  sortOrder: true,
  isActive: true,
} as const;

type CategoryRow = {
  id: string;
  name: string;
  nameRu: string | null;
  nameUz: string | null;
  slug: string;
  description: string | null;
  descriptionRu: string | null;
  descriptionUz: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

/**
 * Active products per category, rolled up so a parent also carries the totals
 * of everything beneath it.
 */
async function productCountsByCategory(): Promise<Map<string, number>> {
  const rows = await prisma.product.groupBy({
    by: ['categoryId'],
    where: { isActive: true },
    _count: { _all: true },
  });

  const own = new Map<string, number>();

  for (const row of rows) {
    own.set(row.categoryId, row._count._all);
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, parentId: true },
  });

  const childrenOf = new Map<string, string[]>();

  for (const category of categories) {
    if (category.parentId === null) {
      continue;
    }

    const siblings = childrenOf.get(category.parentId) ?? [];
    siblings.push(category.id);
    childrenOf.set(category.parentId, siblings);
  }

  const parentOf = new Map(categories.map((category) => [category.id, category.parentId]));

  // Leaves first, so a parent always sums over finished subtotals. The seed is
  // two levels deep; sorting by depth keeps this correct if it grows.
  const byDepth = [...categories].sort(
    (left, right) => depthOf(parentOf, right.id) - depthOf(parentOf, left.id),
  );

  const totals = new Map<string, number>();

  for (const category of byDepth) {
    const descendants = childrenOf.get(category.id) ?? [];
    const total =
      (own.get(category.id) ?? 0) +
      descendants.reduce((sum, childId) => sum + (totals.get(childId) ?? 0), 0);

    totals.set(category.id, total);
  }

  return totals;
}

/** Distance from the root, used only to order the roll-up. */
function depthOf(parentOf: Map<string, string | null>, id: string): number {
  let depth = 0;
  let current = parentOf.get(id) ?? null;

  while (current !== null && depth <= parentOf.size) {
    depth += 1;
    current = parentOf.get(current) ?? null;
  }

  return depth;
}

function toNode(
  row: CategoryRow,
  productCount: number,
  children: CategoryNode[],
  lang: CatalogLocale,
): CategoryNode {
  const suffix = LOCALE_SUFFIX[lang];

  return {
    id: row.id,
    name: row[`name${suffix}`] ?? row.name,
    slug: row.slug,
    description: row[`description${suffix}`] ?? row.description,
    imageUrl: row.imageUrl,
    parentId: row.parentId,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    productCount,
    children,
  };
}

/**
 * The column the menu is sorted by. Sorting on the translated name is what makes
 * the Russian menu alphabetical in Russian; the English name would order it by a
 * language the shopper cannot see.
 */
function nameOrderBy(lang: CatalogLocale) {
  const suffix = LOCALE_SUFFIX[lang];

  return [{ sortOrder: 'asc' as const }, { [`name${suffix}`]: 'asc' as const }];
}

/** The full active tree, roots first, each with its descendants nested. */
export async function getCategoryTree(lang: CatalogLocale): Promise<CategoryNode[]> {
  const [rows, counts] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: CATEGORY_SELECT,
      orderBy: nameOrderBy(lang),
    }),
    productCountsByCategory(),
  ]);

  const nodesById = new Map<string, CategoryNode>();

  for (const row of rows) {
    nodesById.set(row.id, toNode(row, counts.get(row.id) ?? 0, [], lang));
  }

  const roots: CategoryNode[] = [];

  for (const row of rows) {
    const node = nodesById.get(row.id);

    if (node === undefined) {
      continue;
    }

    const parent = row.parentId === null ? undefined : nodesById.get(row.parentId);

    if (parent === undefined) {
      roots.push(node);
    } else {
      parent.children.push(node);
    }
  }

  return roots;
}

/** One category, its children, its totals, and the path from the root to it. */
export async function getCategoryBySlug(
  slug: string,
  lang: CatalogLocale,
): Promise<CategoryDetail> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    select: CATEGORY_SELECT,
  });

  const target = rows.find((row) => row.slug === slug);

  if (target === undefined) {
    throw ApiError.notFound('This category does not exist.');
  }

  const counts = await productCountsByCategory();
  const byId = new Map(rows.map((row) => [row.id, row]));

  const children = rows
    .filter((row) => row.parentId === target.id)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((row) => toNode(row, counts.get(row.id) ?? 0, [], lang));

  const chain: CategoryRow[] = [];
  let current: CategoryRow | undefined = target;

  while (current !== undefined) {
    chain.unshift(current);
    // Walk up with a visited guard so a cycle in the data cannot hang a request.
    const parentId: string | null = current.parentId;

    if (parentId === null || chain.length > rows.length) {
      break;
    }

    current = byId.get(parentId);
  }

  const detail = toNode(target, counts.get(target.id) ?? 0, children, lang);

  return {
    ...detail,
    breadcrumbs: chain.map((row) => toNode(row, counts.get(row.id) ?? 0, [], lang)),
  };
}
