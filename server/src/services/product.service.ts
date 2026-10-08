/**
 * Catalog reads: the product list with its filters, a single product with
 * everything the detail page renders, related products, and reviews.
 *
 * Only the fields the client types declare are selected and returned. Dates
 * leave this module as ISO strings and money leaves it as an integer number of
 * tiyin, exactly as `client/src/types/product.ts` describes them.
 *
 * Every public read filters on `isActive`, so a product that is switched off
 * disappears from lists, from the detail route, and from related products at
 * the same time.
 *
 * Every public read also takes a locale. The translated columns are selected
 * alongside the English ones and mapped back onto the plain field names, so a
 * caller receives `name` and `description` whatever it asked for, and only a
 * hand-edited row can fall back to English. See `utils/locale.ts`.
 */

import type { Prisma } from '@prisma/client';

import { prisma } from '../database/index.js';
import type { Paginated } from '../types/api.js';
import { ApiError } from '../utils/apiError.js';
import { LOCALE_SUFFIX, type CatalogLocale } from '../utils/locale.js';
import type { VariantFilter } from '../utils/queryParams.js';

/** Sort values the list endpoint accepts. Mirrors `ProductSort` on the client. */
export const PRODUCT_SORTS = ['featured', 'price_asc', 'price_desc', 'rating', 'newest'] as const;

export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const DEFAULT_PAGE_SIZE = 24;
/**
 * The largest page the listing will answer with.
 *
 * It is above one screenful on purpose: a phone shows the catalog as a stack of
 * pages grown by a "load more" button, and pressing it asks for the whole stack
 * again in one request rather than for the next page on its own — that is what
 * keeps the products already on screen in place. Five screens is as deep as the
 * button goes; past that the numbered pager takes over.
 */
export const MAX_PAGE_SIZE = 120;

export type ProductListQuery = {
  category?: string | undefined;
  q?: string | undefined;
  brand?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  inStock?: boolean | undefined;
  onSale?: boolean | undefined;
  /** Variant attributes to narrow by, as English name/value pairs. */
  attr?: VariantFilter[] | undefined;
  /**
   * An exact set of products to confine the read to, or nothing at all.
   *
   * Search is what needs it: a scored query in `search.service.ts` decides which
   * products match a term and how well, and every filter the shopper then applies
   * has to narrow that set rather than replace it. Handing the ids back to the
   * ordinary `where` builder is what keeps one description of what a filter means
   * — a brand, a price range, a stock state — instead of a second one written in
   * SQL beside the scored query.
   */
  ids?: string[] | undefined;
  sort?: ProductSort | undefined;
  page: number;
  limit: number;
};

export type ProductImageDto = {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
};

export type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  currency: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  categoryId: string;
  brandId: string | null;
  createdAt: string;
  updatedAt: string;
  image: ProductImageDto | null;
  /**
   * Second image, for the hover swap a card performs. `null` when the product
   * has only one picture, which is a normal state and not a missing field.
   */
  hoverImage: ProductImageDto | null;
  /**
   * Whether the product has options to choose between. A card reads this to
   * decide between adding the product straight to the cart and sending the
   * shopper to the product page to pick one: the base price is a real price,
   * but it is not necessarily the price of the option they wanted.
   */
  hasVariants: boolean;
};

export type ProductVariantDto = {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceDelta: number;
  stock: number;
  sku: string;
};

export type ProductSpecDto = {
  id: string;
  productId: string;
  group: string;
  label: string;
  value: string;
  sortOrder: number;
};

export type ProductDetail = ProductSummary & {
  description: string;
  images: ProductImageDto[];
  variants: ProductVariantDto[];
  specs: ProductSpecDto[];
  category: CategorySummary | null;
  brand: BrandSummary | null;
};

export type CategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type BrandSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

/**
 * List selection. The first image travels with the product so a card never
 * needs a second request, and nothing else about the images does.
 */
const PRODUCT_SUMMARY_SELECT = {
  id: true,
  name: true,
  nameRu: true,
  nameUz: true,
  slug: true,
  shortDescription: true,
  shortDescriptionRu: true,
  shortDescriptionUz: true,
  currency: true,
  price: true,
  compareAtPrice: true,
  sku: true,
  stock: true,
  rating: true,
  reviewCount: true,
  isActive: true,
  isFeatured: true,
  isNew: true,
  categoryId: true,
  brandId: true,
  createdAt: true,
  updatedAt: true,
  images: {
    select: { id: true, productId: true, url: true, alt: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' },
    // Two, not one: a card shows the first and swaps to the second while the
    // pointer is over it, so both have to come back with the list.
    take: 2,
  },
  // The variant count, not the variants: a card only needs to know whether
  // there is a choice to make, and loading every option for every row of a
  // catalog page would be a second collection inside the first.
  _count: { select: { variants: true } },
} satisfies Prisma.ProductSelect;

type ProductSummaryRow = Prisma.ProductGetPayload<{ select: typeof PRODUCT_SUMMARY_SELECT }>;

function toImage(row: {
  id: string;
  productId: string;
  url: string;
  alt: string | null;
  sortOrder: number;
}): ProductImageDto {
  return {
    id: row.id,
    productId: row.productId,
    url: row.url,
    alt: row.alt,
    sortOrder: row.sortOrder,
  };
}

function toProductSummary(row: ProductSummaryRow, lang: CatalogLocale): ProductSummary {
  const [firstImage, secondImage] = row.images;
  const suffix = LOCALE_SUFFIX[lang];

  return {
    id: row.id,
    name: row[`name${suffix}`] ?? row.name,
    slug: row.slug,
    shortDescription: row[`shortDescription${suffix}`] ?? row.shortDescription,
    currency: row.currency,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    sku: row.sku,
    stock: row.stock,
    rating: row.rating,
    reviewCount: row.reviewCount,
    isActive: row.isActive,
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    categoryId: row.categoryId,
    brandId: row.brandId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    image: firstImage === undefined ? null : toImage(firstImage),
    hoverImage: secondImage === undefined ? null : toImage(secondImage),
    hasVariants: row._count.variants > 0,
  };
}

const CATEGORY_SUMMARY_SELECT = {
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
} satisfies Prisma.CategorySelect;

const BRAND_SUMMARY_SELECT = {
  id: true,
  name: true,
  nameRu: true,
  nameUz: true,
  slug: true,
  logoUrl: true,
} satisfies Prisma.BrandSelect;

type CategorySummaryRow = Prisma.CategoryGetPayload<{ select: typeof CATEGORY_SUMMARY_SELECT }>;
type BrandSummaryRow = Prisma.BrandGetPayload<{ select: typeof BRAND_SUMMARY_SELECT }>;

/**
 * A category or brand as it travels alongside a product. The same fallback rule
 * as a product name: the translated column when it exists, the English one
 * otherwise, mapped back onto the plain field name.
 */
export function toCategorySummary(row: CategorySummaryRow, lang: CatalogLocale): CategorySummary {
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
  };
}

export function toBrandSummary(row: BrandSummaryRow, lang: CatalogLocale): BrandSummary {
  const suffix = LOCALE_SUFFIX[lang];

  return {
    id: row.id,
    name: row[`name${suffix}`] ?? row.name,
    slug: row.slug,
    logoUrl: row.logoUrl,
  };
}

function orderByForSort(sort: ProductSort): Prisma.ProductOrderByWithRelationInput[] {
  // Every ordering ends with `id`, so two products with the same price or the
  // same rating keep a stable order across pages instead of drifting.
  switch (sort) {
    case 'price_asc':
      return [{ price: 'asc' }, { id: 'asc' }];
    case 'price_desc':
      return [{ price: 'desc' }, { id: 'asc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewCount: 'desc' }, { id: 'asc' }];
    case 'newest':
      return [{ createdAt: 'desc' }, { id: 'asc' }];
    case 'featured':
    default:
      return [{ isFeatured: 'desc' }, { rating: 'desc' }, { id: 'asc' }];
  }
}

/**
 * Resolves a category slug to itself plus its direct children, so browsing a
 * top-level category such as `clothing` also returns what sits in
 * `mens-clothing`. The seed keeps every product in a leaf category, so without
 * this a top-level listing would be empty.
 */
async function categoryIdsForSlug(slug: string): Promise<string[] | null> {
  const category = await prisma.category.findFirst({
    where: { slug, isActive: true },
    select: { id: true, children: { where: { isActive: true }, select: { id: true } } },
  });

  if (category === null) {
    return null;
  }

  return [category.id, ...category.children.map((child) => child.id)];
}

/**
 * The whole `where` a catalog question resolves to, category and all.
 *
 * The category is the one filter that cannot be answered from the query string
 * alone: a slug has to be looked up before its products can be asked for. That
 * lookup is asynchronous, which is why it lives here rather than inside
 * `buildWhere` — and why the listing and the facets share this instead of each
 * assembling its own, which is how the two would come to disagree about what
 * "in this category" means.
 *
 * `null` means the slug names no active category. The caller answers with an
 * empty set: a stale link should show nothing, not an error.
 */
async function whereForQuery(
  query: Omit<ProductListQuery, 'sort' | 'page' | 'limit'>,
): Promise<Prisma.ProductWhereInput | null> {
  const where = buildWhere(query);

  if (query.category === undefined) {
    return where;
  }

  const categoryIds = await categoryIdsForSlug(query.category);

  if (categoryIds === null) {
    return null;
  }

  where.categoryId = { in: categoryIds };

  return where;
}

function buildWhere(
  query: Omit<ProductListQuery, 'sort' | 'page' | 'limit'>,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { isActive: true };

  if (query.ids !== undefined) {
    // A set decided elsewhere — by the scored search — rather than by a column.
    // Empty means "none of them", which is a filter that matches nothing and
    // exactly what a search whose every match was filtered out should return.
    where.id = { in: query.ids };
  }

  if (query.q !== undefined) {
    // Stage 10 owns real search; this keeps the list endpoint usable with a
    // term so the catalog page and search results share one code path.
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { shortDescription: { contains: query.q, mode: 'insensitive' } },
      { brand: { name: { contains: query.q, mode: 'insensitive' } } },
    ];
  }

  if (query.brand !== undefined) {
    where.brand = { slug: query.brand };
  }

  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    where.price = {
      ...(query.minPrice === undefined ? {} : { gte: query.minPrice }),
      ...(query.maxPrice === undefined ? {} : { lte: query.maxPrice }),
    };
  }

  if (query.minRating !== undefined) {
    where.rating = { gte: query.minRating };
  }

  if (query.inStock === true) {
    where.stock = { gt: 0 };
  }

  if (query.onSale === true) {
    // A discount means the compare-at price is set and above the price. The
    // column-to-column comparison is a Prisma field reference.
    where.compareAtPrice = { gt: prisma.product.fields.price };
  }

  const attributeClauses = attributeWhere(query.attr);

  if (attributeClauses.length > 0) {
    // `AND` rather than assignment: the search term above already owns `OR`,
    // and both can be set on the same request.
    where.AND = attributeClauses;
  }

  return where;
}

/**
 * The attribute half of a `where`.
 *
 * Two values of one attribute are alternatives — a shopper who ticks M and L
 * wants both — while two different attributes must both hold — a shopper who
 * ticks size M and colour Black wants neither on its own. That is why the pairs
 * are grouped by name, and why the groups are separate clauses rather than one
 * list of alternatives.
 *
 * Matching reads the English `name` and `value` columns. Those are the pair the
 * facets endpoint publishes as keys and the pair the panel sends back, so what
 * the shopper sees in translation and what the query matches on cannot drift.
 */
function attributeWhere(attr: VariantFilter[] | undefined): Prisma.ProductWhereInput[] {
  if (attr === undefined || attr.length === 0) {
    return [];
  }

  const byName = new Map<string, string[]>();

  for (const entry of attr) {
    byName.set(entry.name, [...(byName.get(entry.name) ?? []), entry.value]);
  }

  return [...byName].map(([name, values]) => ({
    variants: { some: { name, value: { in: values } } },
  }));
}

export async function listProducts(
  query: ProductListQuery,
  lang: CatalogLocale,
): Promise<Paginated<ProductSummary>> {
  const where = await whereForQuery(query);

  // An unknown category is an empty page rather than a 404: a stale link
  // should show "no products", not an error.
  if (where === null) {
    return { items: [], total: 0, page: query.page, pageSize: query.limit, totalPages: 0 };
  }

  const [rows, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: PRODUCT_SUMMARY_SELECT,
      orderBy: orderByForSort(query.sort ?? 'featured'),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map((row) => toProductSummary(row, lang)),
    total,
    page: query.page,
    pageSize: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

/**
 * The filters a facets request understands.
 *
 * Pagination, ordering, and the attributes themselves are deliberately absent.
 * A facet is a question about the whole filtered set, not about the page of it
 * that happens to be on screen, and the counts it carries are the counts a
 * shopper would get by clearing the attribute filters — so the facets are
 * computed from the set those filters would leave, which is why the attributes are
 * part of the question.
 */
export type ProductFilterQuery = Omit<ProductListQuery, 'attr' | 'sort' | 'page' | 'limit'>;

/** One brand present in a filtered set, with how many products it holds. */
export type BrandFacet = {
  slug: string;
  name: string;
  logoUrl: string | null;
  count: number;
};

/** One value of one variant attribute, with how many products offer it. */
export type AttributeFacetValue = {
  value: string;
  label: string;
  count: number;
};

/** One variant attribute, with its values. */
export type AttributeFacet = {
  name: string;
  label: string;
  values: AttributeFacetValue[];
};

export type ProductFacets = {
  total: number;
  /** Minor units, over the whole filtered set. Null when nothing matches. */
  price: { min: number; max: number } | null;
  brands: BrandFacet[];
  /** Attribute names in the order they should be shown, with translated labels. */
  attributes: AttributeFacet[];
};

/**
 * What the filter panel can offer for a filtered set.
 *
 * Everything here is derived from the database in a handful of grouped queries
 * rather than counted in the client, because the client only ever holds one page
 * of the catalog: a brand list built from twenty-four products would be missing
 * every brand that happens to sit on the next page, and missing in a way that
 * looks like the shop does not stock it.
 *
 * The attribute facet carries two things per value. `value` is the English
 * string the listing is filtered by, and `label` is the same value in the
 * language being read, so the panel can show «Чёрный» while the query still asks
 * for `Black`.
 */
export async function listProductFacets(
  query: ProductFilterQuery,
  lang: CatalogLocale,
): Promise<ProductFacets> {
  const where = await whereForQuery(query);

  if (where === null) {
    return { total: 0, price: null, brands: [], attributes: [] };
  }

  const [aggregate, brandGroups, attributeGroups] = await Promise.all([
    prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
      _count: { _all: true },
    }),
    prisma.product.groupBy({ by: ['brandId'], where, _count: { _all: true } }),
    prisma.productVariant.groupBy({
      by: ['name', 'value'],
      where: { product: where },
      _count: { _all: true },
    }),
  ]);

  const total = aggregate._count._all;
  const cheapest = aggregate._min.price;
  const dearest = aggregate._max.price;

  return {
    total,
    price:
      total === 0 || cheapest === null || dearest === null ? null : { min: cheapest, max: dearest },
    brands: await brandFacets(brandGroups, lang),
    attributes: await attributeFacets(attributeGroups, lang),
  };
}

/** The brands of a filtered set, most stocked first. */
async function brandFacets(
  groups: { brandId: string | null; _count: { _all: number } }[],
  lang: CatalogLocale,
): Promise<BrandFacet[]> {
  const counts = new Map<string, number>();

  for (const group of groups) {
    if (group.brandId !== null) {
      counts.set(group.brandId, group._count._all);
    }
  }

  if (counts.size === 0) {
    return [];
  }

  const rows = await prisma.brand.findMany({
    where: { id: { in: [...counts.keys()] } },
    select: BRAND_SUMMARY_SELECT,
  });

  const suffix = LOCALE_SUFFIX[lang];

  return rows
    .map((row) => ({
      slug: row.slug,
      name: row[`name${suffix}`] ?? row.name,
      logoUrl: row.logoUrl,
      count: counts.get(row.id) ?? 0,
    }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

/**
 * The variant attributes of a filtered set.
 *
 * The counts come from a grouped query over the English columns, and the labels
 * from one further read of the same names. Two flat queries rather than a
 * `groupBy` whose column list changes with the language, which Prisma types as a
 * union it cannot narrow.
 */
async function attributeFacets(
  groups: { name: string; value: string; _count: { _all: number } }[],
  lang: CatalogLocale,
): Promise<AttributeFacet[]> {
  if (groups.length === 0) {
    return [];
  }

  const names = [...new Set(groups.map((group) => group.name))];

  const rows = await prisma.productVariant.findMany({
    where: { name: { in: names } },
    select: {
      name: true,
      nameRu: true,
      nameUz: true,
      value: true,
      valueRu: true,
      valueUz: true,
    },
  });

  const suffix = LOCALE_SUFFIX[lang];
  const nameLabels = new Map<string, string>();
  /** Name to value to label: the same value can be spelled differently under different attributes. */
  const valueLabels = new Map<string, Map<string, string>>();

  for (const row of rows) {
    nameLabels.set(row.name, row[`name${suffix}`] ?? row.name);

    const perName = valueLabels.get(row.name) ?? new Map<string, string>();
    perName.set(row.value, row[`value${suffix}`] ?? row.value);
    valueLabels.set(row.name, perName);
  }

  const facets = new Map<string, AttributeFacet>();

  for (const group of groups) {
    const facet = facets.get(group.name) ?? {
      name: group.name,
      label: nameLabels.get(group.name) ?? group.name,
      values: [],
    };

    facet.values.push({
      value: group.value,
      label: valueLabels.get(group.name)?.get(group.value) ?? group.value,
      count: group._count._all,
    });

    facets.set(group.name, facet);
  }

  return [...facets.values()]
    .map((facet) => ({
      ...facet,
      values: [...facet.values].sort(
        (left, right) => right.count - left.count || left.label.localeCompare(right.label),
      ),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

/**
 * Loads products by id and returns them in the order the ids were given.
 *
 * Search ranks ids in SQL, because relevance depends on how close each match is
 * to the term and Prisma cannot order by that. The rows then come back through
 * the same select and the same mapper as the list endpoint, so a search result
 * and a catalog card are the same object.
 */
export async function listProductsByIds(
  ids: string[],
  lang: CatalogLocale,
): Promise<ProductSummary[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: PRODUCT_SUMMARY_SELECT,
  });

  const byId = new Map(rows.map((row) => [row.id, toProductSummary(row, lang)]));

  return ids.flatMap((id) => {
    const product = byId.get(id);

    return product === undefined ? [] : [product];
  });
}

/**
 * Which of these products the filters keep, in the order they were given.
 *
 * The scored search decides the order — best match first — and the filters decide
 * what survives it, so the order comes in with the ids and is what the answer
 * preserves. Returning ids rather than products is deliberate: the caller wants to
 * count the survivors and take one page of them, and reading twenty-four full
 * products to throw most of them away would be work for nothing.
 */
export async function selectProductIdsInOrder(
  ids: readonly string[],
  query: ProductFilterQuery,
): Promise<string[]> {
  if (ids.length === 0) {
    return [];
  }

  const where = await whereForQuery({ ...query, ids: [...ids] });

  if (where === null) {
    return [];
  }

  const rows = await prisma.product.findMany({ where, select: { id: true } });
  const kept = new Set(rows.map((row) => row.id));

  return ids.filter((id) => kept.has(id));
}

export async function getProductBySlug(slug: string, lang: CatalogLocale): Promise<ProductDetail> {
  const row = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: {
      ...PRODUCT_SUMMARY_SELECT,
      description: true,
      descriptionRu: true,
      descriptionUz: true,
      images: {
        select: { id: true, productId: true, url: true, alt: true, sortOrder: true },
        orderBy: { sortOrder: 'asc' },
      },
      variants: {
        select: {
          id: true,
          productId: true,
          name: true,
          nameRu: true,
          nameUz: true,
          value: true,
          valueRu: true,
          valueUz: true,
          priceDelta: true,
          stock: true,
          sku: true,
        },
        orderBy: [{ name: 'asc' }, { value: 'asc' }],
      },
      specs: {
        select: {
          id: true,
          productId: true,
          group: true,
          groupRu: true,
          groupUz: true,
          label: true,
          labelRu: true,
          labelUz: true,
          value: true,
          valueRu: true,
          valueUz: true,
          sortOrder: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
      category: { select: CATEGORY_SUMMARY_SELECT },
      brand: { select: BRAND_SUMMARY_SELECT },
    },
  });

  if (row === null) {
    throw ApiError.notFound('This product does not exist.');
  }

  const summary = toProductSummary(row as ProductSummaryRow, lang);
  const suffix = LOCALE_SUFFIX[lang];

  return {
    ...summary,
    description: row[`description${suffix}`] ?? row.description,
    images: row.images.map(toImage),
    variants: row.variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      name: variant[`name${suffix}`] ?? variant.name,
      value: variant[`value${suffix}`] ?? variant.value,
      priceDelta: variant.priceDelta,
      stock: variant.stock,
      sku: variant.sku,
    })),
    specs: row.specs.map((spec) => ({
      id: spec.id,
      productId: spec.productId,
      group: spec[`group${suffix}`] ?? spec.group,
      label: spec[`label${suffix}`] ?? spec.label,
      value: spec[`value${suffix}`] ?? spec.value,
      sortOrder: spec.sortOrder,
    })),
    category: row.category === null ? null : toCategorySummary(row.category, lang),
    brand: row.brand === null ? null : toBrandSummary(row.brand, lang),
  };
}

/**
 * Related products: the same category first, then the same brand anywhere in
 * the catalog, until the limit is reached. Both passes keep the featured-first
 * ordering so the row reads like a curated shelf.
 */
export async function listRelatedProducts(
  slug: string,
  limit: number,
  lang: CatalogLocale,
): Promise<ProductSummary[]> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true, categoryId: true, brandId: true },
  });

  if (product === null) {
    throw ApiError.notFound('This product does not exist.');
  }

  const selected = new Set<string>([product.id]);
  const related: ProductSummary[] = [];

  const ordering = orderByForSort('featured');

  const sameCategory = await prisma.product.findMany({
    where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
    select: PRODUCT_SUMMARY_SELECT,
    orderBy: ordering,
    take: limit,
  });

  for (const row of sameCategory) {
    related.push(toProductSummary(row, lang));
    selected.add(row.id);
  }

  if (related.length < limit && product.brandId !== null) {
    const sameBrand = await prisma.product.findMany({
      where: {
        isActive: true,
        brandId: product.brandId,
        id: { notIn: [...selected] },
      },
      select: PRODUCT_SUMMARY_SELECT,
      orderBy: ordering,
      take: limit - related.length,
    });

    for (const row of sameBrand) {
      related.push(toProductSummary(row, lang));
    }
  }

  return related;
}

/** Featured products for the home page. */
export async function listFeaturedProducts(
  limit: number,
  lang: CatalogLocale,
): Promise<ProductSummary[]> {
  const rows = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: PRODUCT_SUMMARY_SELECT,
    orderBy: orderByForSort('featured'),
    take: limit,
  });

  return rows.map((row) => toProductSummary(row, lang));
}

/**
 * Leave an address to be told when a sold-out product comes back.
 *
 * The product has to exist, but its stock does not have to be zero: a shopper
 * can ask to be told about a product that is in stock today and gone by the
 * time they return, and refusing that request would make the card's button
 * behave differently depending on when it was pressed.
 *
 * Asking twice is success, not a conflict. The unique pair on the table means
 * the second request has nothing left to do, and a shopper who cannot remember
 * whether they already asked should not be shown an error for it.
 */
export async function subscribeToStockNotification(slug: string, email: string): Promise<void> {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    select: { id: true },
  });

  if (product === null) {
    throw ApiError.notFound('This product does not exist.');
  }

  await prisma.stockNotification.upsert({
    where: { productId_email: { productId: product.id, email } },
    create: { productId: product.id, email },
    update: {},
  });
}
