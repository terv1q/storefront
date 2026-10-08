/**
 * The home page.
 *
 * The sections run in the order a visitor reads them: what the store is, where
 * to start browsing, what is on offer, and then shelves of products, each one
 * built from a different question put to the catalog. The trust strip and the
 * newsletter close the page.
 *
 * Every section is a `section` with a heading, and the hero owns the only `h1`.
 * It used to own it off screen, because a slideshow could not put three panels
 * into one heading; there is one headline now, so it is visible, and everything
 * below it sits at `h2`. The outline a screen reader reads out is therefore the
 * list of sections in order, which is what the page is.
 *
 * No section depends on another. Each one owns its request and its own loading,
 * empty, and failed states, so a slow shelf or a failed featured list leaves the
 * rest of the page standing. That is also why the sections appear from the top
 * rather than waiting on a single combined request: the hero and the categories
 * are on screen while the product rows are still arriving.
 *
 * The two structured-data blocks describe the store and the site, and are the
 * only place on this page that writes JSON-LD. Products, breadcrumbs, and
 * reviews publish theirs on the pages that render them.
 */

import { CategoryChips } from '@/components/home/CategoryChips';
import { CollectionsGrid } from '@/components/home/CollectionsGrid';
import { DealsSection } from '@/components/home/DealsSection';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Hero } from '@/components/home/Hero';
import { OfferRow } from '@/components/home/OfferRow';
import { Recommendations } from '@/components/home/Recommendations';
import { SectionHeading } from '@/components/home/SectionHeading';
import { ProductShelf } from '@/components/home/ProductShelf';
import { TrustStrip } from '@/components/home/TrustStrip';
import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { organizationSchema, websiteSchema } from '@/lib/structuredData';
import { paths } from '@/routes/paths';

/** The queries behind the two shelves. Sent to the API, which is where the sorting happens. */
const NEW_ARRIVALS_QUERY = { sort: 'newest' as const };
const BEST_RATED_QUERY = { sort: 'rating' as const };

export function HomePage() {
  useSeo({
    title: strings.home.pageTitle,
    description: strings.home.pageDescription,
  });

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(organizationSchema())}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema())}</script>

      {/* The hero draws its own container and its own padding: it is a full-width
          band rather than one of the sections this column stacks. */}
      <Hero />

      <div className="mx-auto max-w-page px-page-x pb-6 sm:pb-8">
        <div className="flex flex-col gap-14 sm:gap-16">
          <section aria-labelledby="home-categories-heading">
            <SectionHeading
              id="home-categories-heading"
              title={strings.home.categoryHeading}
              action={{ label: strings.home.categoryAll, to: paths.search }}
              className="mb-6"
            />
            <CategoryChips />
          </section>

          <OfferRow />
          <FeaturedProducts />
          <DealsSection />

          <ProductShelf
            headingId="home-new-heading"
            title={strings.home.railNewHeading}
            action={{ label: strings.home.railAll, to: `${paths.search}?sort=newest` }}
            query={NEW_ARRIVALS_QUERY}
          />

          <ProductShelf
            headingId="home-rating-heading"
            title={strings.home.railRatingHeading}
            action={{ label: strings.home.railAll, to: `${paths.search}?sort=rating` }}
            query={BEST_RATED_QUERY}
          />

          <CollectionsGrid />
          <Recommendations />
          <TrustStrip />

          <section
            aria-labelledby="home-newsletter-heading"
            className="rounded-panel border border-border bg-surface-muted px-6 py-8 sm:px-10 sm:py-10"
          >
            <div className="grid gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">
              <div>
                <h2
                  id="home-newsletter-heading"
                  className="text-display-sm font-semibold text-ink-900"
                >
                  {strings.footer.newsletterHeading}
                </h2>
                <p className="mt-2 max-w-md text-sm text-ink-600">
                  {strings.footer.newsletterHint}
                </p>
              </div>

              {/* The same form as the footer's: one implementation, so a change
                  to how an address is validated or stored happens once. */}
              <NewsletterForm />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
