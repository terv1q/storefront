/**
 * The home page's editorial content.
 *
 * What lives here is the part of the page that is structure rather than copy:
 * the offer row's category slugs, the departments the collections grid prefers,
 * and how many products each section asks for. The copy that goes with it — the
 * hero's eyebrow and body, its two buttons, the three figures it shows — is in
 * the `i18n` tables under `home`, because it is read in the visitor's language.
 *
 * That split decides what a section is allowed to contain. The offer row names
 * the categories it shows by slug rather than by name, so it can never point at
 * a category that has been renamed or removed: the component looks the slug up
 * in the tree, takes the name and the count from there, and drops the entry if
 * the category is gone. The hero is the exception — it advertises the store
 * rather than a category, so it is plain copy, and there is no banner art under
 * `public/assets/banners` for it to show. The photograph beside that copy is not
 * copy either: it is the first featured product that has one, taken from the
 * catalog at render time.
 *
 * The claims the copy makes are checked against what the store can actually do.
 * The delivery window, the free-delivery threshold, and the returns period come
 * from the same facts the announcement strip and the checkout repeat, and
 * nothing here promises a deadline, a stock level, or a discount the catalog
 * does not have.
 */

/**
 * How many featured products the hero looks through for its photograph. It uses
 * the first one that has an image, so a small number is enough and a larger one
 * would only cost a bigger request.
 */
export const HERO_SPOTLIGHT_LIMIT = 4;

/**
 * The offer row. Each entry is one of the sale-flavoured categories, which are
 * real categories with real products behind them rather than campaign pages that
 * would have to be built first. The order is the order they are shown in, and a
 * slug that is not in the tree is skipped rather than drawn as an empty card.
 */
export const offerSlugs: readonly string[] = ['deals', 'clearance', 'bundle-deals'] as const;

/**
 * Departments the collections grid prefers, in the order it tries them. The grid
 * draws them as equal tiles in one row on a wide screen; a slug that is not in
 * the tree is skipped and the next one moves up, so editing a category in the
 * database degrades the grid instead of leaving a hole in it.
 */
export const collectionSlugs: readonly string[] = [
  'kitchen',
  'electronics',
  'beauty',
  'home',
] as const;

/** Offers shown in the deals section, and how much of each discount to show. */
export const DEALS_LIMIT = 6;

/** Products in the featured grid. Matches the API's own ceiling for the endpoint. */
export const FEATURED_LIMIT = 12;

/** Products in each rail, and in the recommendations shelf. */
export const RAIL_LIMIT = 10;

/** Products the recommendations shelf shows, at most. */
export const RECOMMENDATION_LIMIT = 6;
