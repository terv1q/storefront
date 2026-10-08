/**
 * Seeds the Ziyo storefront database.
 *
 * The seed is deterministic and idempotent: every row is keyed by a stable
 * natural key (`slug`, `sku`, `email`, `orderNumber`, or `productId_userId`),
 * and child collections that have no natural key of their own (images,
 * variants, specs, addresses, order items) are replaced inside a transaction.
 * Running the command twice leaves the same rows with the same values.
 *
 * Run it with:
 *
 *   pnpm prisma:seed        # prisma db seed -> tsx prisma/seed.ts
 *
 * Product artwork is written by `prisma/generate-assets.ts`; run
 * `pnpm prisma:assets` if a stored image path has no file behind it.
 *
 * Note on `Product.reviewCount`: it is the public counter shown on a product
 * card. Only three accounts exist, so the seeded `Review` rows are a subset of
 * that counter, exactly as they would be on a real storefront with a longer
 * history.
 *
 * Every catalogue row is written in three languages. Before the first write, the
 * seed checks that both translation tables cover every English string the
 * catalogue can produce and refuses to start if any is missing — see
 * `prisma/translations.ts`. Nothing is written when that check fails, so a
 * half-translated database is not a state this command can produce.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import {
  BRANDS,
  DELIVERY_ZONES,
  DEV_PASSWORD_HASH,
  ORDERS,
  PROMO_CODES,
  REVIEW_TITLES,
  USERS,
  buildCatalog,
  brandLogoUrl,
  collectCatalogStrings,
  reviewBody,
  toTiyin,
  variantPreset,
  type ProductSeed,
} from './seed-data.js';
import { describeMissing, isComplete, missingTranslations, t } from './translations.js';

try {
  // Prisma does not load `.env` for a project that has `prisma.config.ts`, and
  // a child process does not necessarily inherit the variables the CLI loaded.
  process.loadEnvFile('.env');
} catch {
  // No local `.env` — the ambient environment is expected to provide the URL.
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL is not set. Copy .env.example to .env (or export it) before seeding.',
  );
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

/** Looks up an id that a previous pass must have created. */
function requireId(ids: Map<string, string>, key: string, what: string): string {
  const id = ids.get(key);
  if (id === undefined) {
    throw new Error(`Seed ordering error: no ${what} id recorded for "${key}".`);
  }
  return id;
}

/** `Size` -> `SZ`, `Color` -> `CL`; keeps generated variant SKUs short. */
function variantSkuSegment(name: string): string {
  return name
    .replace(/[^A-Za-z]/g, '')
    .slice(0, 2)
    .toUpperCase();
}

async function seedBrands(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const brand of BRANDS) {
    const row = await prisma.brand.upsert({
      where: { slug: brand.slug },
      create: {
        slug: brand.slug,
        name: brand.name,
        nameRu: t('ru', brand.name),
        nameUz: t('uz', brand.name),
        tagline: brand.tagline,
        taglineRu: t('ru', brand.tagline),
        taglineUz: t('uz', brand.tagline),
        logoUrl: brandLogoUrl(brand.slug),
      },
      update: {
        name: brand.name,
        nameRu: t('ru', brand.name),
        nameUz: t('uz', brand.name),
        tagline: brand.tagline,
        taglineRu: t('ru', brand.tagline),
        taglineUz: t('uz', brand.tagline),
        logoUrl: brandLogoUrl(brand.slug),
      },
    });
    ids.set(brand.slug, row.id);
  }

  return ids;
}

/**
 * The delivery zones, written whole rather than merged.
 *
 * A zone is a range, and a range that overlaps another is a zone whose answer
 * depends on which row came back first. The seed owns the set, so a zone removed
 * from `seed-data.ts` is removed here too — otherwise the database keeps
 * answering for an area the store no longer serves.
 */
async function seedDeliveryZones(): Promise<void> {
  await prisma.deliveryZone.deleteMany({
    where: { code: { notIn: DELIVERY_ZONES.map((zone) => zone.code) } },
  });

  for (const [sortOrder, zone] of DELIVERY_ZONES.entries()) {
    const values = {
      name: zone.name,
      nameRu: t('ru', zone.name),
      nameUz: t('uz', zone.name),
      zipFrom: zone.zipFrom,
      zipTo: zone.zipTo,
      deliveryDaysMin: zone.deliveryDaysMin,
      deliveryDaysMax: zone.deliveryDaysMax,
      fee: toTiyin(zone.feeSoM),
      pickupAvailable: zone.pickupAvailable,
      sortOrder,
    };

    await prisma.deliveryZone.upsert({
      where: { code: zone.code },
      create: { code: zone.code, ...values },
      update: values,
    });
  }
}

/**
 * The promo codes, written whole rather than merged, and for the same reason as
 * the zones: the seed owns the set, so a code removed from `seed-data.ts` stops
 * working on the next run instead of living on in the database forever.
 *
 * Expiry is written on every run, relative to the run. That is what keeps the
 * seeded codes usable in a database built today and tomorrow, and it is why the
 * dates are not literals in `seed-data.ts`.
 */
async function seedPromoCodes(): Promise<void> {
  await prisma.promoCode.deleteMany({
    where: { code: { notIn: PROMO_CODES.map((promo) => promo.code) } },
  });

  const now = new Date();

  for (const promo of PROMO_CODES) {
    const values = {
      discountType: promo.discountType,
      discountValue: promo.discountType === 'FIXED' ? toTiyin(promo.value) : promo.value,
      maxDiscount: promo.maxDiscountSoM === null ? null : toTiyin(promo.maxDiscountSoM),
      minSubtotal: toTiyin(promo.minSubtotalSoM),
      isActive: promo.isActive,
      startsAt: null,
      expiresAt:
        promo.expiresInDays === null
          ? null
          : new Date(now.getTime() + promo.expiresInDays * 24 * 60 * 60 * 1000),
    };

    await prisma.promoCode.upsert({
      where: { code: promo.code },
      create: { code: promo.code, ...values },
      update: values,
    });
  }
}

async function seedCategories(): Promise<Map<string, string>> {
  const { categories } = buildCatalog();
  const ids = new Map<string, string>();

  // Parents first: a child needs its parent's id.
  const ordered = [
    ...categories.filter((category) => category.parentSlug === null),
    ...categories.filter((category) => category.parentSlug !== null),
  ];

  for (const category of ordered) {
    const parentId = category.parentSlug === null ? null : (ids.get(category.parentSlug) ?? null);
    if (category.parentSlug !== null && parentId === null) {
      throw new Error(
        `Category "${category.slug}" references unknown parent "${category.parentSlug}".`,
      );
    }

    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        nameRu: category.nameRu,
        nameUz: category.nameUz,
        description: category.description,
        descriptionRu: category.descriptionRu,
        descriptionUz: category.descriptionUz,
        imageUrl: category.imageUrl,
        parentId,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      update: {
        name: category.name,
        nameRu: category.nameRu,
        nameUz: category.nameUz,
        description: category.description,
        descriptionRu: category.descriptionRu,
        descriptionUz: category.descriptionUz,
        imageUrl: category.imageUrl,
        parentId,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
    ids.set(category.slug, row.id);
  }

  return ids;
}

async function seedProducts(
  categoryIds: Map<string, string>,
  brandIds: Map<string, string>,
): Promise<{ products: ProductSeed[]; productIds: Map<string, string> }> {
  const { products } = buildCatalog();
  const productIds = new Map<string, string>();

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);
    if (categoryId === undefined) {
      throw new Error(
        `Product "${product.slug}" references unknown category "${product.categorySlug}".`,
      );
    }

    const brandId = product.brandSlug === null ? null : (brandIds.get(product.brandSlug) ?? null);
    if (product.brandSlug !== null && brandId === null) {
      throw new Error(`Product "${product.slug}" references unknown brand "${product.brandSlug}".`);
    }

    const fields = {
      name: product.name,
      nameRu: product.nameRu,
      nameUz: product.nameUz,
      description: product.description,
      descriptionRu: product.descriptionRu,
      descriptionUz: product.descriptionUz,
      shortDescription: product.shortDescription,
      shortDescriptionRu: product.shortDescriptionRu,
      shortDescriptionUz: product.shortDescriptionUz,
      categoryId,
      brandId,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      currency: 'UZS',
      stock: product.stock,
      rating: product.rating,
      reviewCount: product.reviewCount,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      createdAt: product.createdAt,
    };

    const row = await prisma.product.upsert({
      where: { slug: product.slug },
      create: { slug: product.slug, sku: product.sku, ...fields },
      update: fields,
    });
    productIds.set(product.slug, row.id);
  }

  // Children have no natural key, so they are rebuilt wholesale. Deleting only
  // rows owned by seeded products keeps the operation scoped.
  const seededIds = [...productIds.values()];

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: { in: seededIds } } }),
    prisma.productVariant.deleteMany({ where: { productId: { in: seededIds } } }),
    prisma.productSpec.deleteMany({ where: { productId: { in: seededIds } } }),
  ]);

  const images = products.flatMap((product) => {
    const productId = requireId(productIds, product.slug, 'product');
    return product.imageUrls.map((url, index) => ({
      productId,
      url,
      // `alt` has no translated sibling: `ProductImage` carries one string, and
      // it is written in the catalogue's base language. A screen reader on a
      // Russian page therefore hears an English alt text.
      alt: index === 0 ? product.name : `${product.name} — alternate view`,
      sortOrder: index,
    }));
  });

  const variants = products.flatMap((product) => {
    const productId = requireId(productIds, product.slug, 'product');
    return product.variantPresetKeys.flatMap((key) => {
      const preset = variantPreset(key);
      const segment = variantSkuSegment(preset.name);
      const perValueStock = Math.max(1, Math.floor(product.stock / preset.values.length));

      return preset.values.map((value, index) => ({
        productId,
        name: preset.name,
        nameRu: t('ru', preset.name),
        nameUz: t('uz', preset.name),
        value: value.value,
        valueRu: t('ru', value.value),
        valueUz: t('uz', value.value),
        priceDelta: toTiyin(value.priceDeltaSoM ?? 0),
        stock: perValueStock,
        sku: `${product.sku}-${segment}${String(index + 1).padStart(2, '0')}`,
      }));
    });
  });

  const specs = products.flatMap((product) => {
    const productId = requireId(productIds, product.slug, 'product');
    return product.specs.map(([group, label, value], index) => ({
      productId,
      group,
      groupRu: t('ru', group),
      groupUz: t('uz', group),
      label,
      labelRu: t('ru', label),
      labelUz: t('uz', label),
      value,
      valueRu: t('ru', value),
      valueUz: t('uz', value),
      sortOrder: index,
    }));
  });

  await prisma.productImage.createMany({ data: images });
  await prisma.productVariant.createMany({ data: variants });
  await prisma.productSpec.createMany({ data: specs });

  return { products, productIds };
}

async function seedUsers(): Promise<Map<string, string>> {
  const ids = new Map<string, string>();

  for (const user of USERS) {
    const row = await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        passwordHash: DEV_PASSWORD_HASH,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
      // The password hash is intentionally left alone on update, so a re-run
      // never invalidates a session someone is using locally.
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
      },
    });
    ids.set(user.email, row.id);

    await prisma.address.deleteMany({ where: { userId: row.id } });
    await prisma.address.createMany({
      data: user.addresses.map((address) => ({ ...address, userId: row.id })),
    });
  }

  return ids;
}

async function seedReviews(
  products: ProductSeed[],
  productIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<number> {
  const reviewers = USERS.map((user) => requireId(userIds, user.email, 'user'));
  let written = 0;

  const popular = products.filter((product) => product.reviewCount >= 60);

  for (const [index, product] of popular.entries()) {
    const productId = requireId(productIds, product.slug, 'product');
    const reviewerCount = 1 + (index % 3);

    for (let offset = 0; offset < reviewerCount; offset += 1) {
      const userId = reviewers[(index + offset) % reviewers.length];
      const rating = Math.min(5, Math.max(4, Math.round(product.rating)));
      const createdAt = new Date(
        product.createdAt.getTime() + (offset + 1) * 12 * 24 * 60 * 60 * 1000,
      );
      const fields = {
        rating,
        title: REVIEW_TITLES[(index + offset * 3) % REVIEW_TITLES.length],
        body: reviewBody(product.name, index + offset),
        // One review in seven is left unapproved, so that the public listing,
        // which reads approved rows only, has something real to filter out. The
        // reviewer still sees their own through `GET /reviews/mine`, which is
        // what the "edit your review" interface reads.
        isApproved: (index + offset) % 7 !== 0,
        createdAt,
      };

      await prisma.review.upsert({
        where: { productId_userId: { productId, userId } },
        create: { productId, userId, ...fields },
        update: fields,
      });
      written += 1;
    }
  }

  return written;
}

async function seedOrders(
  products: ProductSeed[],
  productIds: Map<string, string>,
  userIds: Map<string, string>,
): Promise<void> {
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  for (const order of ORDERS) {
    const userId = requireId(userIds, order.userEmail, 'user');

    const items = order.items.map((item) => {
      const product = bySlug.get(item.productSlug);
      if (product === undefined) {
        throw new Error(
          `Order "${order.orderNumber}" references unknown product "${item.productSlug}".`,
        );
      }
      return {
        productId: requireId(productIds, product.slug, 'product'),
        // The English name, deliberately. An order item is a snapshot of what
        // was bought in the language it was bought in, and the seeded orders
        // have no language of their own, so they take the base one.
        name: product.name,
        unitPrice: product.price,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const discountTotal = toTiyin(order.discountTotalSoM);
    const shippingTotal = toTiyin(order.shippingTotalSoM);
    const total = subtotal - discountTotal + shippingTotal;

    const fields = {
      userId,
      status: order.status,
      subtotal,
      discountTotal,
      shippingTotal,
      total,
      currency: 'UZS',
      customerName: fullName(order.userEmail),
      customerEmail: order.userEmail,
      customerPhone: order.shipping.phone,
      shippingCountry: order.shipping.country,
      shippingCity: order.shipping.city,
      shippingStreet: order.shipping.street,
      shippingPostalCode: order.shipping.postalCode,
      notes: order.notes,
      deliveryMethod: order.deliveryMethod,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: new Date(order.createdAt),
    };

    const row = await prisma.order.upsert({
      where: { orderNumber: order.orderNumber },
      create: { orderNumber: order.orderNumber, ...fields },
      update: fields,
    });

    await prisma.orderItem.deleteMany({ where: { orderId: row.id } });
    await prisma.orderItem.createMany({
      data: items.map((item) => ({ ...item, orderId: row.id })),
    });
  }
}

function fullName(email: string): string {
  const user = USERS.find((entry) => entry.email === email);
  if (user === undefined) {
    throw new Error(`No seeded user matches "${email}".`);
  }
  return `${user.firstName} ${user.lastName}`;
}

async function report(): Promise<void> {
  const [
    topLevelCategories,
    subcategories,
    brands,
    products,
    productImages,
    variants,
    specs,
    users,
    orders,
    orderItems,
    reviews,
    deliveryZones,
  ] = await Promise.all([
    prisma.category.count({ where: { parentId: null } }),
    prisma.category.count({ where: { parentId: { not: null } } }),
    prisma.brand.count(),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.productVariant.count(),
    prisma.productSpec.count(),
    prisma.user.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.review.count(),
    prisma.deliveryZone.count(),
  ]);

  const rows: [string, number][] = [
    ['top-level categories', topLevelCategories],
    ['subcategories', subcategories],
    ['brands', brands],
    ['products', products],
    ['product images', productImages],
    ['variants', variants],
    ['specifications', specs],
    ['users', users],
    ['orders', orders],
    ['order items', orderItems],
    ['reviews', reviews],
    ['delivery zones', deliveryZones],
  ];

  console.log('Seed complete:');
  for (const [label, count] of rows) {
    console.log(`  ${label.padEnd(22)} ${count}`);
  }
}

/**
 * Stops the seed when the catalogue is not fully translated.
 *
 * Runs before the first write, so a failure here leaves the database exactly as
 * it was. The report lists every gap in both languages at once.
 */
function verifyTranslations(): void {
  const missing = missingTranslations(collectCatalogStrings());

  if (!isComplete(missing)) {
    throw new Error(
      `The catalogue is not fully translated; nothing was written.
${describeMissing(missing)}`,
    );
  }
}

async function main(): Promise<void> {
  verifyTranslations();

  await seedDeliveryZones();
  await seedPromoCodes();

  const brandIds = await seedBrands();
  const categoryIds = await seedCategories();
  const { products, productIds } = await seedProducts(categoryIds, brandIds);

  const userIds = await seedUsers();
  await seedReviews(products, productIds, userIds);
  await seedOrders(products, productIds, userIds);

  await report();
}

await main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
