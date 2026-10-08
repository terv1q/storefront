/**
 * The English interface copy, and the shape every other language is written to.
 *
 * This table is the source of truth for what the interface says. `Strings` is
 * derived from it, so a language that is missing a key, or that gives one the
 * wrong shape, fails to compile rather than falling back to English at run time
 * and leaving one sentence in the wrong language on the page.
 *
 * The table is deliberately not `as const`. Literal types would pin every value
 * to its English wording, and a translation cannot satisfy `'Home'`. What the
 * other languages have to match is the shape — which keys exist, whether a value
 * is a sentence or a function of a count — and that is what an inferred type
 * gives them.
 *
 * Copy is grouped by the place it appears rather than by the page that shows it,
 * because several places share a sentence: the cart's title is the same word in
 * the header, the drawer, and the empty state. Values that depend on a number or
 * a name are functions rather than templates with placeholders, so the plural
 * form is decided in the language that has to live with it instead of by a
 * substitution that assumes English grammar.
 *
 * Brand names, currency codes, and product names are not here. They do not
 * translate, and a "translated" product name would be a claim about the store's
 * catalog rather than about its interface.
 */
export const en = {
  nav: {
    home: 'Home',
    categories: 'Categories',
    deals: 'Deals',
    newArrivals: 'New arrivals',
    topRated: 'Top rated',
    onSale: 'On sale',
    shopAll: (name: string) => `Shop all ${name}`,
    browse: 'Browse',
    quickLinks: 'Quick links',
    search: 'Search',
    account: 'Account',
    orders: 'Orders',
    wishlist: 'Wishlist',
    cart: 'Cart',
    support: 'Customer service',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    signIn: 'Sign in',
    signOut: 'Sign out',
    register: 'Create account',
  },

  actions: {
    addToCart: 'Add to cart',
    buyNow: 'Buy now',
    checkout: 'Checkout',
    continueShopping: 'Continue shopping',
    remove: 'Remove',
    saveForLater: 'Save for later',
    moveToCart: 'Move to cart',
    apply: 'Apply',
    clearAll: 'Clear all',
    seeAll: 'See all',
    loadMore: 'Load more',
    retry: 'Try again',
    cancel: 'Cancel',
    backHome: 'Back to home',
    writeReview: 'Write a review',
    increaseQuantity: 'Increase quantity',
    decreaseQuantity: 'Decrease quantity',
    search: 'Search',
    close: 'Close',
  },

  loading: {
    default: 'Loading…',
    products: 'Loading products…',
    suggestions: 'Loading suggestions…',
    checkout: 'Placing your order…',
    addingToCart: 'Adding…',
  },

  empty: {
    cart: 'Your cart is empty.',
    wishlist: 'You have not saved anything yet.',
    orders: 'You have not placed any orders yet.',
    reviews: 'No reviews yet. Be the first to write one.',
    search: (query: string) => `We could not find anything for “${query}”.`,
  },

  product: {
    /** Read out instead of the star drawing, which is decorative. */
    ratingSummary: (rating: number, count: number) =>
      count === 1
        ? `Rated ${rating} out of 5 from 1 review`
        : `Rated ${rating} out of 5 from ${count} reviews`,
    noRating: 'Not rated yet',
    badgeNew: 'New',
    badgeSale: 'Sale',
    badgeTop: 'Top rated',
    inStock: 'In stock',
    /** Shown when stock is low enough that the next order could take the last of it. */
    lowStock: (count: number) => (count === 1 ? 'Last one' : `Only ${count} left`),
    outOfStock: 'Out of stock',
    addToCart: 'Add to cart',
    added: 'Added',
    /** Products with options cannot be added from a card without choosing one. */
    chooseOptions: 'Choose options',
    saveToWishlist: (name: string) => `Save ${name} to your wishlist`,
    removeFromWishlist: (name: string) => `Remove ${name} from your wishlist`,
    /** A count on the button that says how many of this line the cart holds. */
    inCart: (count: number) => `${count} in the cart`,
    priceNow: (price: string) => `Now ${price}`,
    priceWas: (price: string) => `was ${price}`,
    /** The sold-out card's one action: leave an address and be told when it returns. */
    notifyMe: 'Notify me',
    notifyTitle: 'Tell me when it is back',
    notifyBody: (name: string) =>
      `Leave your email and we will write to you the moment ${name} is back in stock.`,
    notifyLabel: 'Email address',
    notifyPlaceholder: 'you@example.com',
    notifySubmit: 'Notify me',
    notifySubmitting: 'Sending…',
    notifySuccess: 'Thank you. We will email you when it is back in stock.',
    notifyFailed: 'We could not save your address. Please try again.',
    notifyClose: 'Close',
  },

  /**
   * The product page. It is a section of its own rather than more keys under
   * `product` because that group is the card's copy — the words a product says
   * about itself wherever it is listed — and this is the page that examines one
   * product in full. The two would otherwise share a heading, a badge, and a
   * stock line, and the first edit to either would land in both.
   */
  productPage: {
    sku: (sku: string) => `SKU ${sku}`,
    /** Read out instead of showing the brand's name as a bare link. */
    brandLink: (brand: string) => `See everything from ${brand}`,
    /** The rating summary is the link to the reviews tab. */
    ratingJump: (count: number) =>
      count === 1 ? 'Read the 1 review' : `Read all ${count} reviews`,
    notFoundTitle: 'Product not found',
    notFoundBody: 'This product does not exist, or it is no longer for sale.',
    backToCatalog: 'Browse the catalog',

    gallery: {
      label: 'Product images',
      /** The thumbnail strip's own label, so the two lists can be told apart. */
      thumbnails: 'Choose an image',
      thumbnail: (index: number, total: number) => `Show image ${index} of ${total}`,
      current: (index: number, total: number) => `Image ${index} of ${total}`,
      previous: 'Previous image',
      next: 'Next image',
      /** The hint that a pointer can magnify the picture. */
      zoomHint: 'Hover the picture to magnify it',
      zoomLabel: (index: number, total: number) => `Magnified image ${index} of ${total}`,
      open: 'Open full screen',
      close: 'Close the full-screen image',
      empty: 'No picture has been added for this product yet',
    },

    price: {
      /** The saving in money, beside the percentage. */
      save: (amount: string) => `Save ${amount}`,
      installment: {
        heading: 'Pay in parts',
        plan: (months: number, amount: string) => `${months} months — ${amount} a month`,
        /** Said once under the tags, because the split is not a bank's offer. */
        note: 'Estimated from the store’s instalment schedule. The plan is confirmed at checkout.',
      },
    },

    /**
     * Variant options. The names and values are the English strings the catalog
     * stores, and the tables below are how they are read in each language: an
     * attribute or a value nobody has translated falls back to the stored string
     * rather than being hidden, because an option that disappeared with the
     * language would be a product that cannot be bought.
     */
    variant: {
      /** The name of one option group, for example "Colour". */
      attributes: {
        Size: 'Size',
        Color: 'Colour',
        Finish: 'Finish',
        Capacity: 'Capacity',
        Storage: 'Storage',
      } as Record<string, string>,
      values: {
        S: 'S',
        M: 'M',
        L: 'L',
        XL: 'XL',
        '39': '39',
        '40': '40',
        '41': '41',
        '42': '42',
        '43': '43',
        Black: 'Black',
        Navy: 'Navy',
        Sand: 'Sand',
        'Natural Oak': 'Natural oak',
        Walnut: 'Walnut',
        'Matte White': 'Matte white',
        Single: 'Single',
        Double: 'Double',
        King: 'King',
        '3 L': '3 litres',
        '5 L': '5 litres',
        '128 GB': '128 GB',
        '256 GB': '256 GB',
      } as Record<string, string>,
      /** The reason one value cannot be chosen, read out on the disabled control. */
      unavailable: (value: string) => `${value} is out of stock`,
      /** How a chosen option is written into the cart line. */
      selected: (name: string, value: string) => `${name}: ${value}`,
    },

    quantity: {
      label: 'Quantity',
      /** The ceiling, said rather than left to a button that stops responding. */
      limit: (count: number) => (count === 1 ? 'Only one left' : `Up to ${count}`),
    },

    actions: {
      /** Confirmation under the buttons, after the cart took the line. */
      addedTitle: 'Added to the cart',
      buyNowHint: 'Opens checkout with this item.',
      wishlistFailed: 'We could not update your wishlist. Please try again.',
      soldOut: 'This product is out of stock. Leave your email and we will write to you.',
    },

    delivery: {
      heading: 'Delivery and payment',
      zipLabel: 'Postal code',
      zipPlaceholder: '100000',
      zipHint: 'Six digits, for example 100000.',
      check: 'Check',
      checking: 'Checking…',
      invalidZip: 'Enter a six-digit postal code.',
      failed: 'We could not check that postal code. Please try again.',
      toZone: (zone: string) => `Delivery to ${zone}`,
      /** The window, in whole days. */
      days: (min: number, max: number) =>
        min === max ? `${min} day delivery` : `${min}–${max} day delivery`,
      fee: (amount: string) => `Delivery ${amount}`,
      free: 'Free delivery',
      freeFrom: (amount: string) => `Free for orders above ${amount}`,
      pickup: 'Pickup from the Tashkent store is available for this address.',
      outside: 'We do not deliver to that postal code yet. Pickup in Tashkent is still available.',
      returns: (days: number) => `${days} days to change your mind`,
      returnsBody: 'Unused items come back for a full refund.',
      paymentsHeading: 'Ways to pay',
      /**
       * The payment codes the API accepts, in the visitor's language. The codes
       * themselves travel in the checkout payload; these are what a shopper reads.
       */
      payments: {
        CASH_ON_DELIVERY: 'Cash on delivery',
        CARD: 'Bank card',
        PAYME: 'Payme',
        CLICK: 'Click',
      } as Record<string, string>,
      policyFailed: 'Delivery details could not be loaded.',
    },

    tabs: {
      label: 'Product information',
      description: 'Description',
      specs: 'Specifications',
      reviews: 'Reviews',
      /** The reviews tab's label, carrying how many there are. */
      reviewsCount: (count: number) => (count === 1 ? 'Reviews (1)' : `Reviews (${count})`),
      descriptionEmpty: 'No description has been written for this product yet.',
      specsEmpty: 'No specifications are listed for this product yet.',
      reviewsLoading: 'Loading reviews…',
      reviewsFailed: 'We could not load the reviews.',
      reviewsMore: 'Show more reviews',
      reviewsAll: 'That is all of them.',
      /** Shown on a review the API did not name an author for. */
      anonymous: 'Ziyo customer',
      /** The screen-reader sentence behind the stars of a review. */
      reviewRating: (rating: number) => `Rated ${rating} out of 5`,
    },

    reviews: {
      guestCallout: 'Sign in to share your experience with this product.',
      guestHeading: 'Sign in to write a review',
      guestAction: 'Sign in',
      writeReview: 'Write a review',
      editReview: 'Edit your review',
      /** Both headings are sentences above the form, which the form itself does not carry. */
      formCreateHeading: 'Write a review',
      formEditHeading: 'Edit your review',
      formTitleField: 'Title',
      formTitleOptional: 'Title (optional)',
      formTitlePlaceholder: 'Sum up your review in a few words',
      formBodyField: 'Your review',
      formBodyPlaceholder: 'What did you think of this product?',
      formRatingField: 'Your rating',
      formRatingRequired: 'Choose a rating from one to five stars.',
      formTitleTooLong: (limit: number) => `Use at most ${limit} characters for the title.`,
      formBodyMin: (min: number) => `Write at least ${min} characters.`,
      formBodyMax: (limit: number) => `Use at most ${limit} characters.`,
      submitFailed: 'We could not save your review. Please try again.',
      formSubmit: 'Publish review',
      formSave: 'Save changes',
      formSubmitting: 'Publishing…',
      cancel: 'Cancel',
      close: 'Close',
      /** How many characters the body has, against the limit the server enforces. */
      bodyCounter: (used: number, limit: number) => `${used} of ${limit} characters`,
      photosHeading: 'Photographs',
      photosHint: (max: number) => `Up to ${max} photographs, each at most 5 MB.`,
      addPhotos: 'Add photographs',
      photoCount: (used: number, max: number) => `${used} of ${max} photographs`,
      photoRemove: (index: number) => `Remove photograph ${index}`,
      photoTypeRejected: (name: string) => `${name} is not a JPEG, PNG, or WebP image.`,
      photoSizeRejected: (name: string) => `${name} is larger than 5 MB.`,
      photoLimitRejected: (max: number) =>
        max === 1
          ? 'Only one photograph can be attached.'
          : `At most ${max} photographs can be attached.`,
      alreadyReviewed: 'You have already reviewed this product.',
      helpful: 'Helpful',
      notHelpful: 'Not helpful',
      withdrawVote: 'Withdraw vote',
      verifiedPurchase: 'Verified purchase',
      sortBy: 'Sort by',
      sortNewest: 'Newest',
      sortHighest: 'Highest rated',
      sortLowest: 'Lowest rated',
      filterBy: 'Filter by rating',
      allRatings: 'All ratings',
      oneStar: '1 star',
      twoStars: '2 stars',
      threeStars: '3 stars',
      fourStars: '4 stars',
      fiveStars: '5 stars',
      clearFilters: 'Clear filters',
      noReviews: 'No reviews yet',
      noReviewsBody: 'Be the first to say what you think of this product.',
      summaryHeading: 'What customers say',
      averageRating: 'Average rating',
      /** The count beside the average, and the same count read on its own. */
      reviewCount: (count: number) => (count === 1 ? '1 review' : `${count} reviews`),
      verifiedPurchases: (count: number) =>
        count === 1 ? '1 verified purchase' : `${count} verified purchases`,
      /** The screen-reader sentence behind one bar of the distribution. */
      ratingBar: (rating: number, count: number) =>
        `${rating} ${rating === 1 ? 'star' : 'stars'}: ${count === 1 ? '1 review' : `${count} reviews`}`,
      ratingChosen: (rating: number) => (rating === 1 ? '1 star chosen' : `${rating} stars chosen`),
      filteredEmpty: 'No reviews with that rating yet.',
      writeFirst: 'Write the first review',
    },

    specs: {
      labelColumn: 'Specification',
      valueColumn: 'Value',
    },

    related: {
      heading: 'You may also like',
      hint: 'From the same shelf and the same brand.',
      empty: 'Nothing else from this shelf yet.',
      failed: 'We could not load recommendations.',
    },

    recentlyViewed: {
      heading: 'Recently viewed',
      hint: 'What you looked at on this device.',
      clear: 'Clear the list',
    },
  },

  errors: {
    generic: 'Something went wrong. Please try again.',
    pageFailed: 'This page could not be displayed.',
    network: 'We could not reach the server. Check your connection and try again.',
    notFound: 'We could not find that page.',
    notFoundHint: 'The link may be out of date, or the page may have moved.',
    notFoundTitle: 'Page not found',
    unauthorized: 'Please sign in to continue.',
    outOfStock: 'This item is out of stock.',
    quantityExceeded: 'That is more than we have in stock.',
    requiredField: 'This field is required.',
    invalidEmail: 'Enter a valid email address.',
    supportBody: 'If trying again does not help, write to us at',
  },

  toast: {
    /** The accessible name of the column notifications appear in. */
    regionLabel: 'Notifications',
    dismiss: 'Dismiss this message',
    addedToCart: (name: string) => `${name} is in your cart.`,
    wishlistSaved: (name: string) => `${name} was saved to your wishlist.`,
    wishlistSavedPlain: 'Saved to your wishlist.',
    wishlistRemovedPlain: 'Removed from your saved products.',
    wishlistRemoved: (name: string) => `${name} was removed from your saved products.`,
    wishlistRemovedMany: (count: number) => `${count} products were removed from your saved list.`,
  },

  offline: {
    title: 'You are offline.',
    body: 'Some things may not load until the connection is back.',
    backOnline: 'You are back online.',
  },

  header: {
    catalog: 'Catalog',
    openCatalog: 'Open the category menu',
    closeCatalog: 'Close the category menu',
    openSearch: 'Open search',
    closeSearch: 'Close search',
    menu: 'Menu',
    wishlist: 'Wishlist',
    cart: 'Cart',
    account: 'Account',
    accountNav: 'Account and basket',
    primaryNav: 'Primary',
    skipToContent: 'Skip to content',
  },

  search: {
    placeholder: 'Search products',
    label: 'Search products',
    scope: 'Search in',
    allCategories: 'All categories',
    clear: 'Clear the search term',
    searching: 'Searching…',
    suggestions: 'Suggestions',
    results: 'Results',
    products: 'Products',
    brands: 'Brands',
    categories: 'Categories',
    noSuggestions: (term: string) => `Nothing matches “${term}”.`,
    viewAllResults: (term: string) => `See all results for “${term}”`,
    recent: 'Recent searches',
    clearRecent: 'Clear recent searches',
    removeRecent: (term: string) => `Remove ${term} from recent searches`,
    onSale: 'On sale',
  },

  catalog: {
    /** The label on the sort menu. */
    sortLabel: 'Sort by',
    sort: {
      featured: 'Featured',
      priceAsc: 'Price: low to high',
      priceDesc: 'Price: high to low',
      rating: 'Top rated',
      newest: 'Newest',
    },
    viewLabel: 'Layout',
    viewGrid: 'Grid',
    viewList: 'List',
    /** The counter above the grid. Counted, so each table decides its own grammar. */
    resultsCount: (count: number) => (count === 1 ? '1 product' : `${count} products`),
    subcategoriesHeading: 'Subcategories',
    searchWithin: 'Search in this category',
    /** The chip for a search term the listing is filtered by. */
    matching: (term: string) => `Matching “${term}”`,
    activeFiltersLabel: 'Active filters',
    removeFilter: (label: string) => `Remove filter: ${label}`,
    clearAll: 'Clear all',
    emptyTitle: 'Nothing to show here yet',
    emptyBody: 'There is nothing in this category at the moment.',
    emptyBrowse: 'Browse all products',
    emptySearchLabel: 'Search the catalogue',
    notFoundTitle: 'Category not found',
    notFoundBody: 'This category does not exist, or it is no longer available.',
    backHome: 'Back to the home page',
  },

  pagination: {
    label: 'Pagination',
    previous: 'Previous page',
    next: 'Next page',
    page: (number: number) => `Page ${number}`,
    current: (number: number) => `Page ${number}, current page`,
    goTo: (number: number) => `Go to page ${number}`,
    /** The jump-to-page control, for reaching a page too far in to walk to. */
    jumpToLabel: 'Page number',
    jumpToAction: 'Go',
    /** The phone's replacement for the numbers under the grid. */
    loadMore: 'Load more',
    loadingMore: 'Loading more…',
  },
  filters: {
    /** The panel's heading, and the label on the drawer's open button. */
    heading: 'Filters',
    open: 'Filters',
    close: 'Close filters',
    /** The drawer's footer button: it closes the drawer, the filters are already applied. */
    showResults: (count: number) => (count === 1 ? 'Show 1 product' : `Show ${count} products`),
    clearAll: 'Clear all filters',
    /** How many filters are on, for the toolbar button. */
    activeCount: (count: number) => (count === 1 ? '1 filter' : `${count} filters`),
    price: {
      heading: 'Price',
      min: 'Minimum price',
      max: 'Maximum price',
      from: 'From',
      to: 'To',
      /** A quick preset. `amount` arrives already formatted as money. */
      under: (amount: string) => `Under ${amount}`,
      over: (amount: string) => `Over ${amount}`,
      between: (from: string, to: string) => `${from} – ${to}`,
      /** Names the preset row, so it is not three unlabelled buttons. */
      presetsLabel: 'Price ranges',
      /** Shown instead of the control when nothing matches, so there is no range. */
      unavailable: 'No prices to filter by here.',
    },
    brand: {
      heading: 'Brand',
      search: 'Find a brand',
      empty: 'No brand matches that.',
      /** The row that clears the brand, since only one can be chosen at a time. */
      all: 'All brands',
    },
    rating: {
      heading: 'Rating',
      andUp: (stars: number) => `${stars} stars and up`,
      /** The row that clears the rating floor. */
      any: 'Any rating',
    },
    availability: {
      heading: 'Availability',
      inStock: 'In stock only',
      onSale: 'On sale only',
    },
  },

  cart: {
    title: 'Your cart',
    previewTitle: 'Recently added',
    openCart: 'Open the cart',
    empty: 'Your cart is empty.',
    emptyHint: 'Items you add appear here.',
    subtotal: 'Subtotal',
    shippingNote: 'Shipping is calculated at checkout.',
    viewCart: 'View cart',
    checkout: 'Checkout',
    itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
    moreItems: (count: number) => `+${count} more in the cart`,
    removeItem: (name: string) => `Remove ${name} from the cart`,

    /** The cart page: the summary card, the rows, and what it says about both. */
    summaryHeading: 'Order summary',
    savings: 'You save',
    promoLine: (code: string) => `Code ${code}`,
    shipping: 'Delivery',
    shippingFree: 'Free',
    total: 'Total',
    checkoutNote: 'Delivery is confirmed at checkout, from the address you enter there.',
    secureNote: 'Payment is simulated in this version. No card details are taken.',
    /** The payment methods the checkout API accepts, as words. */
    paymentBadges: ['Card', 'Cash on delivery'],

    lineTotal: (value: string) => `Line total ${value}`,
    remove: 'Remove',
    itemStockLeft: (count: number) => `Only ${count} left in stock.`,

    promoLabel: 'Promo code',
    promoPlaceholder: 'For example WELCOME10',
    promoHint: 'One code per order.',
    promoApplied: (code: string) => `Code ${code} applied`,
    promoRemove: 'Remove the code',

    pricesChanged: 'Some prices or quantities changed since you added these items.',
    updatePrices: 'Update the basket',
    reduceTo: (count: number) => `Reduce to ${count}`,
    issueInactive: (name: string) => `${name} is no longer on sale.`,
    issueOutOfStock: (name: string) => `${name} has sold out.`,
    issueStockLeft: (name: string, available: number, wanted: number) =>
      `Only ${available} of ${name} left, and this basket has ${wanted}.`,
    issuePrice: (name: string, was: string, now: string) =>
      `${name} now costs ${now}, and this basket holds it at ${was}.`,
    revalidateFailed: 'We could not check today’s prices. The basket may have changed.',
    blockedCheckout: 'Remove the items that are no longer available before you check out.',

    freeDeliveryBar: 'Progress towards free delivery',
    freeDeliveryProgress: (amount: string) => `Add ${amount} more for free delivery.`,
    freeDeliveryReached: 'Delivery is free on this order.',

    emptyCta: 'Browse the catalogue',
    emptyRecentHeading: 'Recently viewed',
    emptyRecentHint: 'The products you looked at last, in case one belongs here.',
  },

  /**
   * The checkout: the four steps, what each one asks for, and the page an order
   * lands on. The step names live here once and are drawn in the order they are
   * walked, so the track and the form cannot disagree about the sequence.
   */
  checkout: {
    title: 'Checkout',
    stepsHeading: 'Checkout steps',
    steps: {
      contact: 'Contact',
      shipping: 'Delivery',
      payment: 'Payment',
      review: 'Review',
    },
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    editStep: (label: string) => `Edit ${label}`,
    back: 'Back',
    continue: 'Continue',
    placeOrder: 'Place order',
    placingOrder: 'Placing your order…',
    fixErrors: 'Check the highlighted fields before carrying on.',
    blockedCheckout:
      'Some items in your basket can no longer be ordered. Remove them, or take what is left, before you check out.',
    lineRefused: (name: string) =>
      `${name} could not be ordered. It may have sold out while you were filling this in.`,
    promoRefused:
      'The server refused the promo code on this basket. Remove it, or apply another one.',

    /** The rules the steps check before a step is left. */
    fields: {
      nameRequired: 'Enter your full name.',
      nameTooLong: 'This name is too long.',
      emailRequired: 'Enter your email address.',
      emailInvalid: 'Enter a valid email address.',
      emailTooLong: 'This email address is too long.',
      phoneRequired: 'Enter a phone number.',
      phoneInvalid: 'Enter a valid phone number, for example +998 90 123 45 67.',
      phoneTooLong: 'This phone number is too long.',
      countryRequired: 'Enter your country.',
      countryTooLong: 'This country name is too long.',
      cityRequired: 'Enter your city.',
      cityTooLong: 'This city name is too long.',
      streetRequired: 'Enter your street address.',
      streetTooLong: 'This address is too long.',
      postalCodeTooLong: 'This postal code is too long.',
      notesTooLong: 'These notes are too long.',
    },

    contact: {
      heading: 'Contact details',
      body: 'Where the order confirmation goes, and how the courier reaches you.',
      prefilledNote:
        'Filled in from your account. Change anything that should be different for this order.',
      nameLabel: 'Full name',
      emailLabel: 'Email address',
      emailHelper: 'The order confirmation is sent here.',
      phoneLabel: 'Phone number',
      phoneHelper: 'The courier calls this number before delivery.',
    },

    shipping: {
      heading: 'Delivery details',
      body: 'Where the parcel goes, and how it gets there.',
      defaultCountry: 'Uzbekistan',
      countryLabel: 'Country',
      cityLabel: 'City',
      streetLabel: 'Street address',
      postalCodeLabel: 'Postal code',
      postalCodeHelper: 'Six digits. Used to work out the delivery window.',
      notesLabel: 'Delivery notes',
      notesPlaceholder: 'For example: call before arriving.',
      notesHelper: 'Optional.',
      estimating: 'Checking delivery to this address…',
      estimateUnavailable:
        'We could not work out a delivery window for this address. We will confirm it with your order.',
      estimate: (zone: string, minimum: number, maximum: number, fee: string) =>
        `To ${zone} in ${minimum}–${maximum} working days, ${fee}.`,
      methods: {
        COURIER: {
          name: 'Courier',
          body: 'Brought to your address. Free from 500 000 soʻm, otherwise 25 000 soʻm.',
        },
        PICKUP: {
          name: 'Store pickup',
          body: 'Collected from the Tashkent store, at no charge.',
        },
      },
    },

    payment: {
      heading: 'Payment',
      body: 'Both options are recorded with the order and settled by the store.',
      testMode: 'Test mode.',
      testModeBody:
        'Payment is simulated in this version: no card is charged, and no card details are asked for, sent, or stored.',
      methods: {
        CARD: {
          name: 'Card payment',
          body: 'The store confirms the card payment when the order is processed.',
        },
        CASH: {
          name: 'Cash on delivery',
          body: 'Paid to the courier when the parcel arrives.',
        },
      },
    },

    review: {
      heading: 'Review your order',
      body: 'Check the details below. Every step above can still be changed.',
      contactLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Delivery address',
      deliveryLabel: 'Delivery',
      paymentLabel: 'Payment',
      notesLabel: 'Notes',
    },

    summary: {
      heading: 'Order summary',
      quantity: (count: number) => `Quantity ${count}`,
      promoNote: (amount: string) => `The code takes ${amount} off this order.`,
    },

    /** Why the order was refused, as the checkout form reports it. */
    failures: {
      validation: 'The store refused this order. Check the details and the basket, then try again.',
      conflict: 'Your basket changed while you were checking out. Reload the page and try again.',
      unauthenticated: 'Your session ended. Sign in again and your basket will still be here.',
      rateLimited: 'Too many orders were placed from this account. Please try again shortly.',
      unknown: 'We could not place this order. Please try again.',
    },

    confirmation: {
      heading: 'Thank you. Your order is with us.',
      body: 'The store emails you when the parcel is on its way.',
      orderNumber: 'Order number',
      status: (status: string) =>
        ({
          PENDING: 'Order received',
          CONFIRMED: 'Order confirmed',
          PROCESSING: 'Being prepared',
          SHIPPED: 'On its way',
          DELIVERED: 'Delivered',
          CANCELLED: 'Cancelled',
        })[status] ?? 'Order received',
      itemsHeading: 'What you ordered',
      totalPaid: 'Total paid',
      estimate: (zone: string, minimum: number, maximum: number) =>
        `Delivery to ${zone} takes ${minimum}–${maximum} working days.`,
      estimateUnknown: 'We will confirm the delivery window for this address with your order.',
      pickupNote: 'Collect from the Tashkent store. We email you when it is ready.',
      payment: (method: string, status: string) => `${method} · ${status}`,
      paymentStatus: (status: string) =>
        ({
          UNPAID: 'not yet paid',
          PAID: 'paid',
          FAILED: 'payment failed',
          REFUNDED: 'refunded',
        })[status] ?? status,
      viewOrder: 'View order tracking',
      viewOrders: 'Your orders',
      browse: 'Continue shopping',
      notFoundTitle: 'We could not find that order',
      notFoundBody:
        'The link may be old, or the order may belong to another account. Your own orders are listed under your account.',
    },
  },

  /**
   * The saved-products page and the controls that act on it. The word the
   * shopper reads is "saved" wherever a sentence is written out: a wishlist is
   * what the navigation item is called, and saving is what the page did.
   */
  /**
   * The order history and one order.
   *
   * The six status words are written once, here: the badge, the timeline, and
   * the history all read them from this group, so the same state is never named
   * two ways on one screen. The timeline's sentences are separate because they
   * say what a status means rather than what it is called.
   */
  orders: {
    title: 'Your orders',
    subtitle: 'Everything you have ordered, newest first.',
    count: (count: number) => (count === 1 ? '1 order' : `${count} orders`),
    emptyTitle: 'No orders yet',
    emptyBody: 'Once you place an order it is listed here, with its status and what was in it.',
    browseCatalog: 'Browse the catalogue',
    loadFailed: 'We could not load your orders.',
    orderNumber: 'Order number',
    placedOn: (date: string) => `Placed ${date}`,
    itemCount: (count: number) => (count === 1 ? '1 item' : `${count} items`),
    viewOrder: (orderNumber: string) => `View order ${orderNumber}`,
    status: {
      PENDING: 'Received',
      CONFIRMED: 'Confirmed',
      PROCESSING: 'Being prepared',
      SHIPPED: 'On its way',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    },
    timeline: {
      PENDING: 'We have your order.',
      CONFIRMED: 'The store confirmed it.',
      PROCESSING: 'Your items are being picked and packed.',
      SHIPPED: 'The parcel is with the courier.',
      DELIVERED: 'The parcel arrived.',
    },
    timelineCancelled: 'This order was cancelled and is not coming.',
    timelineCancelledRefunded: 'This order was cancelled and the payment was refunded.',

    /** One order: the receipt, the progress, and the way to stop it. */
    detail: {
      title: 'Order',
      loadFailed: 'We could not load this order.',
      notFoundTitle: 'We could not find that order',
      notFoundBody:
        'The link may be old, or the order may belong to another account. Your own orders are listed under your account.',
      itemsHeading: 'What you ordered',
      progressHeading: 'Where it is',
      deliveryHeading: 'Delivery',
      addressLabel: 'Address',
      notesLabel: 'Notes for the store',
      paymentHeading: 'Payment',
      payment: (method: string, status: string) => `${method} · ${status}`,
      totalLabel: 'Order total',
      cancel: 'Cancel the order',
      cancelling: 'Cancelling…',
      cancelConfirmTitle: 'Cancel this order?',
      cancelConfirmBody:
        'The order is cancelled and the items go back into stock. This cannot be undone.',
      cancelConfirm: 'Yes, cancel it',
      cancelKeep: 'Keep the order',
      cancelFailed: 'We could not cancel this order. Please try again.',
      cancelClosed:
        'This order has moved past the point where it can be cancelled. Contact the store if something is wrong.',
    },
  },
  wishlist: {
    heading: 'Saved products',
    itemCount: (count: number) => (count === 1 ? '1 saved product' : `${count} saved products`),
    selectAll: 'Select all',
    selectItem: (name: string) => `Select ${name}`,
    selectedCount: (count: number) => (count === 1 ? '1 selected' : `${count} selected`),
    moveSelected: 'Move selected to cart',
    removeSelected: 'Remove selected',
    clearAll: 'Clear the list',
    moveToCart: 'Move to cart',
    chooseOptions: 'Choose options',
    remove: 'Remove',
    /** Shown on a row whose product has options, which cannot be moved blind. */
    needsChoice: 'This product has options. Open it to choose one.',
    emptyTitle: 'Nothing saved yet',
    emptyBody:
      'Save a product with the heart on its card and it waits here until you come back to it.',
    browseCatalog: 'Browse the catalogue',
    loadFailed: 'We could not load your saved products.',
    actionFailed: 'We could not change your saved products. Please try again.',
    guestNote: 'Saved here, and moved to your account when you sign in.',
  },

  account: {
    menuTitle: 'Account menu',
    greeting: (name: string) => `Signed in as ${name}`,
    orders: 'Orders',
    accountDetails: 'Account details',
    signInPrompt: 'Sign in to see your orders and saved items.',
    signIn: 'Sign in',
    register: 'Create account',
    signOut: 'Sign out',
    signingOut: 'Signing out…',
    tabsLabel: 'Account sections',
    tabs: {
      profile: 'Your details',
      address: 'Delivery address',
      security: 'Security',
    },
    links: {
      ordersBody: 'Every order placed, with its status and what it cost.',
      wishlist: 'Saved products',
      wishlistBody: 'Products you saved, ready to move into the cart.',
    },
    profile: {
      heading: 'Your details',
      body: 'The name an order is placed under, and the number we call about a delivery.',
      /** The email field is drawn but not editable, so it says why. */
      emailNote: 'Your email address is how you sign in. It cannot be changed here.',
      phoneNote: 'Optional. Used only to reach you about a delivery.',
      save: 'Save changes',
      saving: 'Saving…',
      saved: 'Your details were saved.',
    },
    password: {
      heading: 'Password',
      body: 'Change the password you sign in with. The current one is needed to set a new one.',
      currentLabel: 'Current password',
      newLabel: 'New password',
      change: 'Change password',
      changing: 'Changing…',
      changed: 'Your password was changed.',
      note: 'Changing your password does not sign out the sessions already open on other devices.',
    },
    address: {
      heading: 'Delivery addresses',
      body: 'Kept here, offered at the checkout. The default one is filled in for you.',
      add: 'Add address',
      addHeading: 'New address',
      editHeading: 'Edit address',
      /** What a row is called before it has been given a label. */
      untitled: 'Address',
      defaultBadge: 'Default',
      makeDefault: 'Make default',
      edit: 'Edit',
      remove: 'Remove',
      labelLabel: 'Label',
      labelHelper: 'Optional. “Home” or “Office”, to tell them apart.',
      fullNameLabel: 'Full name',
      phoneLabel: 'Phone number',
      countryLabel: 'Country',
      cityLabel: 'City',
      streetLabel: 'Street address',
      postalCodeLabel: 'Postal code',
      isDefaultLabel: 'Use as my default delivery address',
      isDefaultHelper: 'The checkout fills this one in first.',
      save: 'Save address',
      saving: 'Saving…',
      cancel: 'Cancel',
      loading: 'Loading your addresses…',
      loadFailed: 'We could not load your addresses.',
      empty: 'No address saved yet. Add one and the checkout will offer it next time.',
      removeConfirmTitle: 'Remove this address?',
      removeConfirmBody:
        'It is removed from your account. Orders already placed keep the address they were sent to.',
      removeConfirm: 'Remove it',
      removeKeep: 'Keep it',
    },
    /** What the account forms say under a field they refused. */
    fields: {
      currentRequired: 'Enter your current password.',
      phoneRequired: 'Enter a phone number the courier can call.',
      labelTooLong: 'This label is too long.',
      fullNameRequired: 'Enter the name the delivery is for.',
      fullNameTooLong: 'This name is too long.',
      countryRequired: 'Enter your country.',
      countryTooLong: 'This country is too long.',
      cityRequired: 'Enter your city.',
      cityTooLong: 'This city is too long.',
      streetRequired: 'Enter your street address.',
      streetTooLong: 'This address is too long.',
      postalCodeTooLong: 'This postal code is too long.',
    },
  },
  auth: {
    /** Shown while a stored session is being confirmed, so a guarded page is never blank. */
    checkingSession: 'Checking your session…',
    signInBody: 'Sign in to see your orders, your saved items, and your basket on any device.',
    registerBody:
      'An account keeps your orders and saved items together, on this device and the next one.',
    firstNameLabel: 'First name',
    lastNameLabel: 'Last name',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'Phone number',
    phoneHelper: 'Optional. Used only to reach you about a delivery.',
    phonePlaceholder: '+998 90 123 45 67',
    passwordLabel: 'Password',
    passwordPlaceholder: 'At least 8 characters',
    confirmPasswordLabel: 'Confirm password',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    signingIn: 'Signing in…',
    registering: 'Creating account…',
    noAccountYet: 'No account yet?',
    haveAccount: 'Already have an account?',
    invalidCredentials: 'The email or password is incorrect.',
    tooManyAttempts: 'Too many sign-in attempts. Please wait a few minutes and try again.',
    tooManyRegistrations: 'Too many accounts created from this device. Please try again later.',
    emailTaken: 'An account with this email already exists. Sign in instead.',
    registerTerms: 'By creating an account you agree to the store’s terms of sale.',

    /**
     * The rules the forms check before a request is made. The server checks the
     * same ones again; see `server/src/utils/validation.ts`.
     */
    fields: {
      firstNameRequired: 'Enter your first name.',
      firstNameTooLong: 'This first name is too long.',
      lastNameRequired: 'Enter your last name.',
      lastNameTooLong: 'This last name is too long.',
      emailRequired: 'Enter your email address.',
      emailInvalid: 'Enter a valid email address.',
      emailTooLong: 'This email address is too long.',
      phoneInvalid: 'Enter a valid phone number, for example +998 90 123 45 67.',
      phoneTooLong: 'This phone number is too long.',
      passwordRequired: 'Enter your password.',
      passwordShort: 'Use at least 8 characters.',
      passwordLong: 'Use at most 72 characters.',
      confirmRequired: 'Repeat your password.',
      passwordMismatch: 'The passwords do not match.',
    },

    /** The meter under the password box on the registration form. */
    password: {
      hint: 'At least 8 characters.',
      strengthLabel: 'Password strength',
      strength: {
        weak: 'Weak',
        fair: 'Fair',
        good: 'Good',
        strong: 'Strong',
      },
      hints: {
        length: 'Use at least 8 characters.',
        longer: 'A few more characters would help.',
        case: 'Mix upper and lower case letters.',
        number: 'Add a number.',
        symbol: 'Add a symbol.',
        met: 'A strong password.',
      },
    },
  },

  language: {
    /** The name of the control, read out before the list of languages. */
    menuTitle: 'Language',
    current: (name: string) => `Language: ${name}. Change the language`,
    changed: (name: string) => `Language changed to ${name}.`,
  },

  announcement: {
    region: 'Region and currency',
    dismiss: 'Dismiss the announcement',
    previous: 'Previous announcement',
    next: 'Next announcement',
    messages: [
      'Free delivery on orders over 300,000 UZS',
      'Delivery across Uzbekistan in 2–4 days',
      'Pay with Uzcard, Humo, or cash on delivery',
    ],
  },

  menu: {
    title: 'Menu',
    open: 'Open the menu',
    close: 'Close the menu',
    categoriesHeading: 'Shop by category',
    accountHeading: 'Your account',
    contactHeading: 'Need help?',
    contact: 'Contact support',
  },

  footer: {
    tagline: 'Everyday essentials, delivered.',
    shopHeading: 'Shop',
    supportHeading: 'Customer service',
    accountHeading: 'Account',
    aboutHeading: 'About Ziyo',
    rights: (year: number) => `© ${year} Ziyo. All rights reserved.`,
    /** Shown next to a link whose page does not exist yet. */
    comingSoon: 'coming soon',
    /** Read after the network name, so the tab that opens is not a surprise. */
    opensInNewTab: (network: string) => `${network}, opens in a new tab`,
    socialHeading: 'Follow Ziyo',
    contactHeading: 'Visit or call',
    addressLabel: 'Address',
    addressValue: 'Amir Temur koʻchasi 107B, Tashkent, Uzbekistan',
    phoneLabel: 'Phone',
    telegramLabel: 'Telegram',
    hoursLabel: 'Opening hours',
    hoursValue: 'Monday to Saturday, 9:00–20:00',
    paymentsHeading: 'We accept',
    legalHeading: 'Legal',
    newsletterHeading: 'What is new, once a week',
    newsletterHint: 'New arrivals and sale dates. One email a week, no more than that.',
    newsletterLabel: 'Email address',
    newsletterPlaceholder: 'you@example.com',
    newsletterSubmit: 'Subscribe',
    newsletterSubmitting: 'Subscribing…',
    newsletterSaved: 'Saved on this device. You will hear from us when the list opens.',
    newsletterKnown: 'That address is already saved on this device.',
    /** The links with no page behind them yet. See `config/footer.ts`. */
    links: {
      help: 'Help centre',
      shipping: 'Shipping and delivery',
      returns: 'Returns and refunds',
      aboutUs: 'About us',
      stores: 'Stores',
      careers: 'Careers',
      journal: 'Journal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Use',
      refunds: 'Returns and Refunds',
      cookies: 'Cookie Settings',
      accessibility: 'Accessibility Statement',
    },
  },

  breadcrumbs: {
    label: 'Breadcrumb',
    home: 'Home',
  },

  home: {
    /**
     * The page heading and the document title. `titleTemplate` in `config/seo.ts`
     * appends the store name, so this must not repeat it.
     */
    pageTitle: 'Everyday essentials, delivered',
    pageDescription:
      'Clothing, home, kitchen, beauty, electronics, toys, and groceries from Ziyo, with delivery across Uzbekistan in 2 to 4 days.',

    hero: {
      eyebrow: 'Ziyo',
      body: 'Clothing, home, kitchen, beauty, electronics, toys, and groceries. Stocked in Tashkent and sent across Uzbekistan in 2 to 4 days.',
      primary: 'Shop the catalog',
      secondary: 'See what is new',
    },

    /**
     * The figures the hero shows, and the same three the announcement strip and
     * the checkout repeat. Keeping them together is what stops the hero from
     * disagreeing with the rest of the store about any of them.
     */
    facts: {
      delivery: { value: '2–4 days', label: 'Delivery across Uzbekistan' },
      shipping: { value: '300,000 UZS', label: 'Free delivery above this' },
      returns: { value: '14 days', label: 'To change your mind' },
    },

    /**
     * The small line above the product photograph in the hero. The name and the
     * price under it come from the product, so nothing here repeats them.
     */
    heroSpotlight: 'In stock now',

    categoryHeading: 'Shop by category',
    categoryAll: 'All categories',
    categoryCount: (count: number) => (count === 1 ? '1 product' : `${count} products`),
    categoryEmpty: 'The catalog is being restocked. Categories return shortly.',

    promoHeading: 'Offers on now',
    promoAll: 'See everything on sale',

    featuredHeading: 'Featured this week',
    featuredHint: 'Picked by the people who stock the shelves.',
    featuredAll: 'See all products',

    railNewHeading: 'New arrivals',
    railRatingHeading: 'Best rated',
    railSaleHeading: 'On sale',
    railAll: 'See all',
    railPrevious: 'Scroll to earlier products',
    railNext: 'Scroll to later products',

    dealsHeading: 'Deals',
    dealsHint: 'Prices that are lower than they were. Stock decides how long they last.',
    dealsEmpty: 'Nothing is discounted right now. New offers appear here.',
    dealsAll: 'All deals',
    /** Read out for a discount badge, since the percentage alone is not a sentence. */
    dealsSave: (percent: number) => `Save ${percent}%`,
    /** How many units of a discounted product are left. */
    dealsLeft: (count: number) => (count === 1 ? '1 left' : `${count} left`),
    /** The bar is a drawing of the number beside it, so it is hidden from assistive tech. */
    dealsStockBar: (left: number, fullest: number) =>
      `Stock: ${left}, against ${fullest} for the fullest shelf shown`,

    collectionsHeading: 'Collections',
    collectionOpen: (name: string) => `Open the ${name} collection`,

    recommendationsHeading: 'Picked for you',
    recommendationsHint: 'Based on what you looked at on this device.',
    recommendationsFallbackHint:
      'What customers score highest, until you have browsed a few products.',

    trustHeading: 'Why shop with Ziyo',
    deliveryTitle: 'Delivery in 2 to 4 days',
    deliveryBody: 'Across Uzbekistan, free above 300,000 UZS.',
    returnsTitle: '14 days to change your mind',
    returnsBody: 'Unused items come back for a full refund.',
    paymentsTitle: 'Secure payment',
    paymentsBody: 'Uzcard, Humo, and cash on delivery.',
    supportTitle: 'Help when you need it',
    supportBody: 'Support answers every day, including weekends.',

    errorHeading: 'This part of the page did not load',
    retry: 'Try again',
  },

  market: {
    /** Country and currency names, by the market code in `config/site.ts`. */
    countries: { UZ: 'Uzbekistan' } as Record<string, string>,
    currencyLabels: { UZ: 'UZS (soʻm)' } as Record<string, string>,
  },

  seo: {
    defaultTitle: 'Ziyo — Online Store',
    defaultDescription:
      'Ziyo is an online store for clothing, home, kitchen, beauty, electronics, toys, and groceries.',
  },

  /**
   * The pages that are still placeholders. Each one carries the developer's note
   * about which stage builds it, in the visitor's language, so the interface is
   * in one language even where it has nothing to show.
   */
  pages: {
    account: {
      title: 'Account',
      note: 'Your details, the address orders go to, and the password you sign in with.',
    },
    cart: {
      title: 'Cart',
      note: 'The basket, what is in it, and what the order comes to.',
    },
    checkout: {
      title: 'Checkout',
      note: 'Contact details, delivery, payment, and the review the order is placed from.',
    },
    orderConfirmation: {
      title: 'Order confirmation',
      note: 'The order number, what was ordered, and where it is going.',
    },
    signIn: {
      title: 'Sign in',
      note: 'Sign in with the email address and password on your account.',
    },
    order: {
      title: 'Order',
      note: 'One order: what was in it, what it came to, and how far along it is.',
    },
    orders: {
      title: 'Orders',
      note: 'Every order placed, with its status, its contents, and what it cost.',
    },
    product: {
      /** The document title while the product is still loading, and the fallback. */
      title: 'Product',
    },
    category: {
      title: 'Category',
    },
    register: {
      title: 'Create account',
      note: 'A name, an email address, and a password are all an account needs.',
    },
    search: {
      title: 'Search',
      /** The heading over a result set, carrying the words that produced it. */
      heading: (term: string) => `Results for “${term}”`,
      /** What the page says when it is opened without a term to search for. */
      browseTitle: 'Search the catalogue',
      browseBody: 'Find products by name, brand, or category.',
      emptyTitle: (term: string) => `Nothing matched “${term}”`,
      emptyBody: 'Check the spelling, or try a shorter or more general word.',
      /** The heading over the fuzzy matches offered instead of an empty grid. */
      didYouMean: 'Did you mean',
      /** The action narrows the current search to one brand. */
      didYouMeanBrand: (brand: string) => `Only in ${brand}`,
      didYouMeanCategory: (name: string) => `Browse ${name}`,
      recentHeading: 'Recent searches',
      trendingHeading: 'Trending now',
      categoriesHeading: 'Popular categories',
      backToCatalog: 'Browse the catalogue',
    },
    wishlist: {
      title: 'Wishlist',
      note: 'Products you saved, ready to move into the cart or take off the list.',
    },
    /** The slug a route was given when there is none. */
    unknown: 'unknown',
  },
};

/** What a language table has to provide. Derived, so it cannot drift from `en`. */
export type Strings = typeof en;
