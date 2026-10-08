/**
 * The product page.
 *
 * Two columns on a wide screen: the photographs on the left, and everything a
 * shopper has to decide with on the right, in the order the decision is made —
 * what it is, what it costs, which one, how many, and then the buttons. On a
 * narrow screen the same column runs under the gallery, because there is no
 * arrangement of two columns in 320 pixels that reads better than one.
 *
 * The panel sticks while the page scrolls on a wide screen, so the price and the
 * buttons stay reachable beside a gallery of twelve photographs and three tabs of
 * description. It stops sticking at the foot of the section, which is what a
 * `sticky` inside a bounded container does without any measurement.
 *
 * The choice of options belongs here rather than in the components that show it.
 * The variant buttons set it, and the price, the article number, the stock, and
 * the buttons all read it; keeping it in any one of them would make that one the
 * owner of the others' state. It is also why the choice resets when the product
 * does — a size chosen on one product is not a size chosen on the next.
 *
 * The product is remembered on this device as it loads, which is what fills the
 * recently-viewed row. Nothing is sent anywhere: the shelf is read back by the
 * same browser, and the note at the top of `recentlyViewed` says what that costs.
 *
 * An unknown slug is not an error to apologise for. `GET /api/products/:slug`
 * answers 404, and that is a product that does not exist — the page says so and
 * offers the catalog, which is a better answer than a retry button that will
 * return the same 404.
 */

import { PackageX } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';
import { AddToCartPanel } from '@/components/product/AddToCartPanel';
import { DeliveryInfo } from '@/components/product/DeliveryInfo';
import { PriceBlock } from '@/components/product/PriceBlock';
import { ProductGallery } from '@/components/product/ProductGallery';
import { ProductInfo } from '@/components/product/ProductInfo';
import { ProductTabs } from '@/components/product/ProductTabs';
import { QuantitySelector } from '@/components/product/QuantitySelector';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { StickyAddToCart } from '@/components/product/StickyAddToCart';
import { VariantSelector } from '@/components/product/VariantSelector';
import { findTrail } from '@/features/products/categoryTree';
import { rememberProduct } from '@/features/products/recentlyViewed';
import {
  defaultSelection,
  groupVariants,
  resolveChoice,
  type VariantSelection,
} from '@/features/products/variantSelection';
import { useElementInView } from '@/hooks/useElementInView';
import { useCategoryTree, useProduct } from '@/hooks/useProducts';
import type { BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { seoConfig } from '@/config/seo';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import { isApiError } from '@/types/api';
import type { ProductDetail } from '@/types/product';
import { toMajorUnits } from '@/utils/formatPrice';

/** The id the reviews panel carries, which the rating summary above links to. */
const REVIEWS_ID = 'product-reviews';

/** How much of the description the search engines are shown. */
const META_DESCRIPTION_LIMIT = 160;

const buttonClass =
  'inline-flex items-center justify-center gap-2 rounded-control bg-brand-700 px-4 py-2 text-sm font-medium text-brand-50 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

/**
 * The product as a search engine reads it.
 *
 * It belongs to this page rather than to `lib/structuredData.ts` for the reason
 * written at the top of that file: the organisation and the site are the same on
 * every page, and a product is not — it is this page's own subject, built from
 * the same object the page renders.
 *
 * Three values need care. The price is minor units, so it is converted through
 * the one function that knows the ratio. The images are relative paths, and a
 * crawler reads this block outside the page it came from, so they are made
 * absolute. And `aggregateRating` is omitted entirely when nothing has been
 * reviewed rather than sent as a zero, because a rating of zero out of no
 * reviews is a claim the product has been rated badly.
 */
function productSchema(product: ProductDetail): Record<string, unknown> {
  const description = (product.shortDescription ?? product.description).slice(
    0,
    META_DESCRIPTION_LIMIT,
  );

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    sku: product.sku,
    image: product.images.map((image) => `${seoConfig.siteUrl}${image.url}`),
    brand: product.brand === null ? undefined : { '@type': 'Brand', name: product.brand.name },
    offers: {
      '@type': 'Offer',
      url: `${seoConfig.siteUrl}${paths.product(product.slug)}`,
      price: toMajorUnits(product.price),
      priceCurrency: product.currency,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}

/** The page's own shape while the product loads: the same boxes, in the same places. */ function ProductPageSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]"
    >
      <Skeleton className="aspect-square rounded-card border border-border" />

      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 rounded-card" />
        <Skeleton className="h-12 rounded-control" />
        <Skeleton className="h-12 rounded-control" />
      </div>
    </div>
  );
}

export function ProductPage() {
  const { slug } = useParams<{ slug: string }>();

  const product = useProduct(slug);
  const tree = useCategoryTree();

  // Watches the buttons under the choices, so the bar at the bottom of a phone
  // screen appears only once they have scrolled out of view.
  const panel = useElementInView<HTMLDivElement>();

  const detail = product.data;

  const groups = useMemo(() => groupVariants(detail?.variants ?? []), [detail]);

  const [selection, setSelection] = useState<VariantSelection>({});
  const [quantity, setQuantity] = useState(1);

  // A product's options are its own: a size chosen on the last product is not a
  // choice on this one, so the page opens on the first available of each.
  useEffect(() => {
    setSelection(defaultSelection(groups));
    setQuantity(1);
  }, [groups]);

  useEffect(() => {
    if (detail !== undefined) {
      rememberProduct(detail);
    }
  }, [detail]);

  const choice = detail === undefined ? undefined : resolveChoice(detail, groups, selection);

  useSeo({
    title: detail?.name ?? strings.pages.product.title,
    description:
      detail === undefined
        ? undefined
        : (detail.shortDescription ?? detail.description).slice(0, META_DESCRIPTION_LIMIT),
    image: detail?.images[0]?.url ?? detail?.image?.url,
    path: slug === undefined ? undefined : paths.product(slug),
    type: 'product',
  });

  /**
   * The trail: the product's own shelf, from the top of the catalog down. The
   * product endpoint answers with the product's category and not its ancestors,
   * so the chain is walked in the tree the header already holds; a category the
   * tree no longer has falls back to the one the product names.
   */
  const trail = useMemo<BreadcrumbItem[]>(() => {
    if (detail === undefined) {
      return [];
    }

    const category = detail.category;
    const chain = category === null ? [] : findTrail(tree.categories ?? [], category.slug);

    const crumbs: BreadcrumbItem[] =
      chain.length > 0
        ? chain.map((node) => ({ label: node.name, to: paths.category(node.slug) }))
        : category === null
          ? []
          : [{ label: category.name, to: paths.category(category.slug) }];

    return [...crumbs, { label: detail.name }];
  }, [detail, tree.categories]);

  // A slug the catalog does not have is a page that does not exist, not a
  // request that failed.
  if (product.isError && isApiError(product.error) && product.error.status === 404) {
    return (
      <div className="mx-auto max-w-page px-page-x py-10 sm:py-14">
        <EmptyState
          Icon={PackageX}
          title={strings.productPage.notFoundTitle}
          body={strings.productPage.notFoundBody}
        >
          <Link to={paths.search} className={buttonClass}>
            {strings.productPage.backToCatalog}
          </Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-page px-page-x py-6 sm:py-8">
      {product.isLoading ? (
        <ProductPageSkeleton />
      ) : detail === undefined || choice === undefined ? (
        // The failure is a request, not a missing product: the retry is what the
        // panel exists for, and `EmptyState` would offer a catalog link instead.
        <ErrorState
          body={product.errorMessage ?? strings.errors.generic}
          onRetry={product.refetch}
        />
      ) : (
        <>
          <script type="application/ld+json">{JSON.stringify(productSchema(detail))}</script>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
            <ProductGallery images={detail.images} name={detail.name} />

            <div className={cn('flex min-w-0 flex-col gap-6', 'lg:sticky lg:top-24 lg:self-start')}>
              <ProductInfo
                product={detail}
                trail={trail}
                sku={choice.sku}
                stock={choice.stock}
                reviewsId={REVIEWS_ID}
              />

              <PriceBlock
                price={choice.price}
                compareAtPrice={detail.compareAtPrice}
                currency={detail.currency}
              />

              <VariantSelector
                groups={groups}
                selection={selection}
                onSelect={(name, variantId) =>
                  setSelection((current) => ({ ...current, [name]: variantId }))
                }
              />

              <QuantitySelector
                value={Math.min(quantity, Math.max(1, choice.stock))}
                onChange={setQuantity}
                max={choice.stock}
              />

              <div ref={panel.ref}>
                <AddToCartPanel
                  product={detail}
                  price={choice.price}
                  stock={choice.stock}
                  variantIds={choice.variantIds}
                  variantLabel={choice.label}
                  quantity={Math.min(quantity, Math.max(1, choice.stock))}
                  disabled={!choice.complete || choice.stock <= 0}
                />
              </div>

              <DeliveryInfo />
            </div>
          </div>

          <ProductTabs product={detail} reviewsId={REVIEWS_ID} className="mt-12" />

          <RelatedProducts product={detail} className="mt-12" />

          {/* The same action again, for the thumb, once the panel above has been
              scrolled past. Below the large breakpoint only — see the component. */}
          <StickyAddToCart
            product={detail}
            price={choice.price}
            stock={choice.stock}
            variantIds={choice.variantIds}
            variantLabel={choice.label}
            quantity={Math.min(quantity, Math.max(1, choice.stock))}
            disabled={!choice.complete || choice.stock <= 0}
            visible={!panel.inView}
          />
        </>
      )}
    </div>
  );
}
