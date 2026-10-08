/**
 * The saved products.
 *
 * One page for two kinds of shopper. A visitor who has signed in sees the list
 * their account holds; a visitor who has not sees the list their browser holds,
 * which is moved into the account the moment they sign in. Both arrive here as
 * the same `Product[]` — through `useWishlistProducts`, which reads an account's
 * list from the server and a guest's ids back through the catalog — so nothing
 * below this line has to know which of the two it is drawing.
 *
 * What the page offers per row is "move to cart" and "remove", and above them a
 * selection that works on many rows at once. A product with options is the one
 * exception: it cannot be moved without choosing one, so its row links to the
 * product page and its checkbox is disabled. That is a rule about the catalog
 * rather than a limitation of this page — the base price is a real price, but it
 * is not necessarily the price of the option the shopper wanted.
 *
 * Selection is component state and lives here, because it is what the toolbar
 * and the rows have to agree on. It is pruned against the products on screen, so
 * a row that was moved or removed leaves the selection with it rather than
 * leaving an id behind that the next bulk action would try to act on.
 */

import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/common/EmptyState';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { ErrorState } from '@/components/common/ErrorState';
import { ProductGridSkeleton } from '@/components/product/ProductGridSkeleton';
import { WishlistItem } from '@/components/wishlist/WishlistItem';
import { WishlistToolbar } from '@/components/wishlist/WishlistToolbar';
import { useWishlistState, useWishlistProducts } from '@/features/wishlist/wishlist.queries';
import { errorMessageOf, useCategoryTree } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import type { Product } from '@/types/product';

/** How many placeholder rows the loading state draws. */
const SKELETON_ROWS = 3;

const linkClass =
  'inline-flex items-center justify-center gap-2 rounded-control px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
const primaryLinkClass = cn(linkClass, 'bg-brand-700 text-brand-50 hover:bg-brand-600');
const secondaryLinkClass = cn(
  linkClass,
  'border border-border text-ink-900 hover:bg-surface-muted',
);

export function WishlistPage() {
  useSeo({ title: strings.pages.wishlist.title, noIndex: true });

  const { products, count, isLoading, isError, error, refetch } = useWishlistProducts();
  const wishlist = useWishlistState();
  const cart = useCart();
  const tree = useCategoryTree();

  const [selected, setSelected] = useState<readonly string[]>([]);

  /** Only the products on screen, and only those that can be moved at all. */
  const selectable = products.filter((product) => product.hasVariants !== true);
  const selectedProducts = selectable.filter((product) => selected.includes(product.id));
  const allSelected = selectable.length > 0 && selectedProducts.length === selectable.length;

  const addToCart = (product: Product) => {
    cart.add({
      productId: product.id,
      variantIds: [],
      name: product.name,
      slug: product.slug,
      unitPrice: product.price,
      compareAtPrice: product.compareAtPrice,
      imageUrl: product.image?.url ?? null,
      stock: product.stock,
      variantLabel: null,
    });
  };

  const moveToCart = (product: Product) => {
    addToCart(product);
    wishlist.remove(product.id);
    setSelected((current) => current.filter((id) => id !== product.id));
  };

  const remove = (product: Product) => {
    wishlist.remove(product.id);
    setSelected((current) => current.filter((id) => id !== product.id));
  };

  const moveSelected = () => {
    const ids = selectedProducts.map((product) => product.id);

    for (const product of selectedProducts) {
      addToCart(product);
    }

    wishlist.removeMany(ids);
    setSelected([]);
  };

  const removeSelected = () => {
    wishlist.removeMany(selectedProducts.map((product) => product.id));
    setSelected([]);
  };

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-6 px-page-x py-page-y">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold text-ink-900">{strings.wishlist.heading}</h1>
        {count > 0 ? (
          <p className="text-sm text-ink-600">{strings.wishlist.itemCount(count)}</p>
        ) : null}
      </header>

      {!wishlist.isSignedIn && count > 0 ? (
        <p className="text-sm text-ink-500">{strings.wishlist.guestNote}</p>
      ) : null}

      {isLoading ? (
        <ProductGridSkeleton count={SKELETON_ROWS} layout="list" />
      ) : isError ? (
        <ErrorState
          title={strings.wishlist.loadFailed}
          body={errorMessageOf(error)}
          onRetry={() => void refetch()}
        />
      ) : products.length === 0 ? (
        <EmptyState
          Icon={Heart}
          title={strings.wishlist.emptyTitle}
          body={strings.wishlist.emptyBody}
        >
          <Link to={paths.home} className={primaryLinkClass}>
            {strings.wishlist.browseCatalog}
          </Link>

          {/* A way back into the catalog that is not the home page: the top of
              the tree, which is what somebody with an empty list is choosing
              between. Nothing is drawn while the tree is unread — the button
              above already goes somewhere. */}
          {(tree.categories ?? []).slice(0, 4).map((category) => (
            <Link
              key={category.id}
              to={paths.category(category.slug)}
              className={secondaryLinkClass}
            >
              {category.name}
            </Link>
          ))}
        </EmptyState>
      ) : (
        <>
          <WishlistToolbar
            selectableCount={selectable.length}
            selectedCount={selectedProducts.length}
            allSelected={allSelected}
            onToggleAll={(next) => setSelected(next ? selectable.map((product) => product.id) : [])}
            onMoveSelected={moveSelected}
            onRemoveSelected={removeSelected}
            onClearAll={() => {
              wishlist.removeMany(products.map((product) => product.id));
              setSelected([]);
            }}
          />

          {wishlist.isError ? <ErrorMessage>{strings.wishlist.actionFailed}</ErrorMessage> : null}

          <ul className="flex flex-col gap-4">
            {products.map((product) => (
              <WishlistItem
                key={product.id}
                product={product}
                selected={selected.includes(product.id)}
                onSelectChange={(productId, isSelected) =>
                  setSelected((current) =>
                    isSelected ? [...current, productId] : current.filter((id) => id !== productId),
                  )
                }
                onMoveToCart={moveToCart}
                onRemove={remove}
              />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
