/**
 * The Uzbek interface copy.
 *
 * Written to the shape of `en`, in Latin script, which is the script the store's
 * own address and the `uz-UZ` formatting locale use. A Cyrillic reader is not
 * served by this table; adding that is a fourth table and a second entry in
 * `LANGUAGES`, not a transliteration of this one.
 *
 * Uzbek takes no plural ending after a number — «5 ta mahsulot», never «5 ta
 * mahsulotlar» — so the counted sentences are plain templates here, where the
 * Russian table needs its three forms.
 */
import type { Strings } from '@/i18n/en';

export const uz: Strings = {
  nav: {
    home: 'Bosh sahifa',
    categories: 'Toifalar',
    deals: 'Chegirmalar',
    newArrivals: 'Yangi kelganlar',
    topRated: 'Eng yuqori baholangan',
    onSale: 'Chegirmada',
    shopAll: (name: string) => `Barcha ${name}`,
    browse: 'Katalog',
    quickLinks: 'Tezkor havolalar',
    search: 'Qidirish',
    account: 'Hisob',
    orders: 'Buyurtmalar',
    wishlist: 'Saralanganlar',
    cart: 'Savat',
    support: 'Mijozlarga xizmat',
    openMenu: 'Menyuni ochish',
    closeMenu: 'Menyuni yopish',
    signIn: 'Kirish',
    signOut: 'Chiqish',
    register: 'Hisob yaratish',
  },

  actions: {
    addToCart: 'Savatga qoʻshish',
    buyNow: 'Hozir sotib olish',
    checkout: 'Buyurtmani rasmiylashtirish',
    continueShopping: 'Xaridni davom ettirish',
    remove: 'Oʻchirish',
    saveForLater: 'Keyinroq uchun saqlash',
    moveToCart: 'Savatga oʻtkazish',
    apply: 'Qoʻllash',
    clearAll: 'Hammasini tozalash',
    seeAll: 'Barchasini koʻrish',
    loadMore: 'Yana koʻrsatish',
    retry: 'Qayta urinish',
    cancel: 'Bekor qilish',
    backHome: 'Bosh sahifaga',
    writeReview: 'Sharh yozish',
    increaseQuantity: 'Miqdorni oshirish',
    decreaseQuantity: 'Miqdorni kamaytirish',
    search: 'Qidirish',
    close: 'Yopish',
  },

  loading: {
    default: 'Yuklanmoqda…',
    products: 'Mahsulotlar yuklanmoqda…',
    suggestions: 'Takliflar yuklanmoqda…',
    checkout: 'Buyurtma rasmiylashtirilmoqda…',
    addingToCart: 'Qoʻshilmoqda…',
  },

  empty: {
    cart: 'Savatingiz boʻsh.',
    wishlist: 'Siz hali hech narsani saqlamadingiz.',
    orders: 'Siz hali buyurtma bermadingiz.',
    reviews: 'Hozircha sharhlar yoʻq. Birinchi boʻlib yozing.',
    search: (query: string) => `“${query}” boʻyicha hech narsa topilmadi.`,
  },

  product: {
    ratingSummary: (rating: number, count: number) =>
      `5 dan ${rating} baho, ${count} ta sharh asosida`,
    noRating: 'Hali baholanmagan',
    badgeNew: 'Yangi',
    badgeSale: 'Chegirma',
    badgeTop: 'Eng yaxshi',
    inStock: 'Mavjud',
    lowStock: (count: number) => (count === 1 ? 'Oxirgisi' : `Faqat ${count} ta qoldi`),
    outOfStock: 'Mavjud emas',
    addToCart: 'Savatga qoʻshish',
    added: 'Qoʻshildi',
    chooseOptions: 'Variantni tanlash',
    saveToWishlist: (name: string) => `${name} ni saralanganlarga qoʻshish`,
    removeFromWishlist: (name: string) => `${name} ni saralanganlardan oʻchirish`,
    inCart: (count: number) => `Savatda ${count} ta`,
    priceNow: (price: string) => `Hozir ${price}`,
    priceWas: (price: string) => `avval ${price}`,
    notifyMe: 'Mavjud boʻlganda xabar bering',
    notifyTitle: 'Qaytganida xabar bering',
    notifyBody: (name: string) =>
      `Pochtangizni qoldiring, ${name} yana sotuvga chiqishi bilan yozamiz.`,
    notifyLabel: 'Elektron pochta manzili',
    notifyPlaceholder: 'you@example.com',
    notifySubmit: 'Xabar berish',
    notifySubmitting: 'Yuborilmoqda…',
    notifySuccess: 'Rahmat. Mahsulot mavjud boʻlganda sizga yozamiz.',
    notifyFailed: 'Manzilni saqlab boʻlmadi. Yana bir marta urinib koʻring.',
    notifyClose: 'Yopish',
  },

  productPage: {
    sku: (sku: string) => `Artikul ${sku}`,
    brandLink: (brand: string) => `${brand} brendining barcha mahsulotlari`,
    ratingJump: (count: number) => `${count} ta sharhni oʻqish`,
    notFoundTitle: 'Mahsulot topilmadi',
    notFoundBody: 'Bunday mahsulot yoʻq yoki u endi sotilmaydi.',
    backToCatalog: 'Katalogni koʻrish',

    gallery: {
      label: 'Mahsulot suratlari',
      thumbnails: 'Surat tanlash',
      thumbnail: (index: number, total: number) => `${total} tadan ${index}-suratni koʻrsatish`,
      current: (index: number, total: number) => `${total} tadan ${index}-surat`,
      previous: 'Oldingi surat',
      next: 'Keyingi surat',
      zoomHint: 'Suratni kattalashtirish uchun kursorni ustiga olib keling',
      zoomLabel: (index: number, total: number) =>
        `Kattalashtirilgan surat: ${total} tadan ${index}`,
      open: 'Butun ekranda ochish',
      close: 'Butun ekrandagi suratni yopish',
      empty: 'Bu mahsulot uchun hali surat qoʻshilmagan',
    },

    price: {
      save: (amount: string) => `Tejash ${amount}`,
      installment: {
        heading: 'Boʻlib toʻlash',
        plan: (months: number, amount: string) => `${months} oy — oyiga ${amount}`,
        note: 'Doʻkonning boʻlib toʻlash jadvali boʻyicha hisob. Reja buyurtma berishda tasdiqlanadi.',
      },
    },

    variant: {
      attributes: {
        Size: 'Oʻlcham',
        Color: 'Rang',
        Finish: 'Qoplama',
        Capacity: 'Hajm',
        Storage: 'Xotira',
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
        Black: 'Qora',
        Navy: 'Toʻq koʻk',
        Sand: 'Qum rang',
        'Natural Oak': 'Tabiiy eman',
        Walnut: 'Yongʻoq',
        'Matte White': 'Mat oq',
        Single: 'Bir kishilik',
        Double: 'Ikki kishilik',
        King: 'King-size',
        '3 L': '3 l',
        '5 L': '5 l',
        '128 GB': '128 GB',
        '256 GB': '256 GB',
      } as Record<string, string>,
      unavailable: (value: string) => `${value} — omborda yoʻq`,
      selected: (name: string, value: string) => `${name}: ${value}`,
    },

    quantity: {
      label: 'Miqdori',
      limit: (count: number) => (count === 1 ? 'Faqat bittasi qoldi' : `${count} tagacha`),
    },

    actions: {
      addedTitle: 'Savatga qoʻshildi',
      buyNowHint: 'Shu mahsulot bilan buyurtma berish ochiladi.',
      wishlistFailed: 'Saralanganlarni yangilab boʻlmadi. Yana bir marta urinib koʻring.',
      soldOut: 'Mahsulot omborda yoʻq. Pochtangizni qoldiring, qaytganida yozamiz.',
    },

    delivery: {
      heading: 'Yetkazib berish va toʻlov',
      zipLabel: 'Pochta indeksi',
      zipPlaceholder: '100000',
      zipHint: 'Olti raqam, masalan 100000.',
      check: 'Tekshirish',
      checking: 'Tekshirilmoqda…',
      invalidZip: 'Olti raqamli indeksni kiriting.',
      failed: 'Indeksni tekshirib boʻlmadi. Yana bir marta urinib koʻring.',
      toZone: (zone: string) => `${zone}ga yetkazish`,
      days: (min: number, max: number) =>
        min === max ? `${min} kunda yetkazish` : `${min}–${max} kunda yetkazish`,
      fee: (amount: string) => `Yetkazish ${amount}`,
      free: 'Yetkazish bepul',
      freeFrom: (amount: string) => `${amount}dan yuqori buyurtmaga bepul`,
      pickup: 'Bu manzil uchun Toshkentdagi doʻkondan olib ketish mumkin.',
      outside: 'Bu indeksga hali yetkazmaymiz. Toshkentdan olib ketish hali ham mumkin.',
      returns: (days: number) => `Qaytarish uchun ${days} kun`,
      returnsBody: 'Ishlatilmagan mahsulot puli toʻliq qaytarilgan holda qabul qilinadi.',
      paymentsHeading: 'Toʻlov usullari',
      payments: {
        CASH_ON_DELIVERY: 'Yetkazilganda naqd',
        CARD: 'Bank kartasi',
        PAYME: 'Payme',
        CLICK: 'Click',
      } as Record<string, string>,
      policyFailed: 'Yetkazib berish shartlarini yuklab boʻlmadi.',
    },

    tabs: {
      label: 'Mahsulot haqida',
      description: 'Tavsif',
      specs: 'Xususiyatlar',
      reviews: 'Sharhlar',
      reviewsCount: (count: number) => `Sharhlar (${count} ta)`,
      descriptionEmpty: 'Bu mahsulot uchun hali tavsif yozilmagan.',
      specsEmpty: 'Bu mahsulot uchun hali xususiyatlar keltirilmagan.',
      reviewsLoading: 'Sharhlar yuklanmoqda…',
      reviewsFailed: 'Sharhlarni yuklab boʻlmadi.',
      reviewsMore: 'Yana sharhlarni koʻrsatish',
      reviewsAll: 'Bu barcha sharhlar.',
      anonymous: 'Ziyo xaridori',
      reviewRating: (rating: number) => `5 dan ${rating} baho`,
    },

    reviews: {
      guestCallout: 'Bu mahsulot haqidagi fikringizni qoldirish uchun hisobingizga kiring.',
      guestHeading: 'Sharh yozish uchun kiring',
      guestAction: 'Kirish',
      writeReview: 'Sharh yozish',
      editReview: 'Sharhni tahrirlash',
      formCreateHeading: 'Sharh yozish',
      formEditHeading: 'Sharhni tahrirlash',
      formTitleField: 'Sarlavha',
      formTitleOptional: 'Sarlavha (majburiy emas)',
      formTitlePlaceholder: 'Fikringizni qisqa qilib ifodalang',
      formBodyField: 'Sharhingiz',
      formBodyPlaceholder: 'Bu mahsulot haqida nima deb oʻylaysiz?',
      formRatingField: 'Bahoyingiz',
      formRatingRequired: 'Birdan beshgacha yulduz tanlang.',
      formTitleTooLong: (limit: number) => `Sarlavha ${limit} belgidan oshmasin.`,
      formBodyMin: (min: number) => `Kamida ${min} belgi yozing.`,
      formBodyMax: (limit: number) => `Koʻpi bilan ${limit} belgi.`,
      submitFailed: 'Sharhni saqlab boʻlmadi. Yana urinib koʻring.',
      formSubmit: 'Sharhni eʼlon qilish',
      formSave: 'Oʻzgarishlarni saqlash',
      formSubmitting: 'Eʼlon qilinmoqda…',
      cancel: 'Bekor qilish',
      close: 'Yopish',
      bodyCounter: (used: number, limit: number) => `${limit} belgidan ${used} tasi`,
      photosHeading: 'Suratlar',
      photosHint: (max: number) => `Koʻpi bilan ${max} ta surat, har biri 5 MB gacha.`,
      addPhotos: 'Surat qoʻshish',
      photoCount: (used: number, max: number) => `${max} tadan ${used} tasi`,
      photoRemove: (index: number) => `${index}-suratni oʻchirish`,
      photoTypeRejected: (name: string) => `${name} JPEG, PNG yoki WebP surat emas.`,
      photoSizeRejected: (name: string) => `${name} 5 MB dan katta.`,
      photoLimitRejected: (max: number) =>
        max === 1
          ? 'Faqat bitta surat qoʻshish mumkin.'
          : `Koʻpi bilan ${max} ta surat qoʻshish mumkin.`,
      alreadyReviewed: 'Siz bu mahsulotga allaqachon sharh yozgansiz.',
      helpful: 'Foydali',
      notHelpful: 'Foydali emas',
      withdrawVote: 'Ovozni qaytarib olish',
      verifiedPurchase: 'Tasdiqlangan xarid',
      sortBy: 'Tartiblash',
      sortNewest: 'Eng yangi',
      sortHighest: 'Eng yuqori baho',
      sortLowest: 'Eng past baho',
      filterBy: 'Baho boʻyicha',
      allRatings: 'Barcha baholar',
      oneStar: '1 yulduz',
      twoStars: '2 yulduz',
      threeStars: '3 yulduz',
      fourStars: '4 yulduz',
      fiveStars: '5 yulduz',
      clearFilters: 'Filtrlarni tozalash',
      noReviews: 'Hali sharhlar yoʻq',
      noReviewsBody: 'Bu mahsulot haqida birinchi boʻlib fikr bildiring.',
      summaryHeading: 'Xaridorlar fikri',
      averageRating: 'Oʻrtacha baho',
      reviewCount: (count: number) => `${count} ta sharh`,
      verifiedPurchases: (count: number) => `${count} ta tasdiqlangan xarid`,
      ratingBar: (rating: number, count: number) => `${rating} yulduz: ${count} ta sharh`,
      ratingChosen: (rating: number) => `${rating} yulduz tanlandi`,
      filteredEmpty: 'Bu baho bilan hali sharh yoʻq.',
      writeFirst: 'Birinchi sharhni yozing',
    },

    specs: {
      labelColumn: 'Xususiyat',
      valueColumn: 'Qiymat',
    },

    related: {
      heading: 'Bu mahsulot bilan birga',
      hint: 'Ayni boʻlimdan va ayni brenddan.',
      empty: 'Bu boʻlimda boshqa narsa yoʻq.',
      failed: 'Tavsiyalarni yuklab boʻlmadi.',
    },

    recentlyViewed: {
      heading: 'Yaqinda koʻrilgan',
      hint: 'Shu qurilmada ochgan mahsulotlaringiz.',
      clear: 'Roʻyxatni tozalash',
    },
  },

  errors: {
    generic: 'Nimadir xato ketdi. Yana bir marta urinib koʻring.',
    pageFailed: 'Bu sahifani koʻrsatib boʻlmadi.',
    network: 'Serverga ulanib boʻlmadi. Aloqani tekshirib, qayta urinib koʻring.',
    notFound: 'Bunday sahifani topa olmadik.',
    notFoundHint: 'Havola eskirgan boʻlishi yoki sahifa koʻchirilgan boʻlishi mumkin.',
    notFoundTitle: 'Sahifa topilmadi',
    unauthorized: 'Davom etish uchun tizimga kiring.',
    outOfStock: 'Bu mahsulot mavjud emas.',
    quantityExceeded: 'Bu ombordagidan koʻproq.',
    requiredField: 'Bu maydon toʻldirilishi shart.',
    invalidEmail: 'Toʻgʻri elektron pochta manzilini kiriting.',
    supportBody: 'Qayta urinish yordam bermasa, bizga yozing:',
  },

  toast: {
    /** Bildirishnomalar chiqadigan ustunning nomi. */
    regionLabel: 'Bildirishnomalar',
    dismiss: 'Bildirishnomani yopish',
    addedToCart: (name: string) => `${name} savatda.`,
    wishlistSaved: (name: string) => `${name} saralanganlarga qoʻshildi.`,
    wishlistSavedPlain: 'Mahsulot saralanganlarga qoʻshildi.',
    wishlistRemovedPlain: 'Mahsulot saralanganlardan olindi.',
    wishlistRemoved: (name: string) => `${name} saralanganlardan olindi.`,
    wishlistRemovedMany: (count: number) => `Saralanganlardan ${count} ta mahsulot olindi.`,
  },

  offline: {
    title: 'Aloqa yoʻq.',
    body: 'Aloqa tiklanmaguncha baʼzi sahifalar yuklanmasligi mumkin.',
    backOnline: 'Aloqa tiklandi.',
  },

  header: {
    catalog: 'Katalog',
    openCatalog: 'Toifalar menyusini ochish',
    closeCatalog: 'Toifalar menyusini yopish',
    openSearch: 'Qidiruvni ochish',
    closeSearch: 'Qidiruvni yopish',
    menu: 'Menyu',
    wishlist: 'Saralanganlar',
    cart: 'Savat',
    account: 'Hisob',
    accountNav: 'Hisob va savat',
    primaryNav: 'Asosiy navigatsiya',
    skipToContent: 'Mazmunga oʻtish',
  },

  search: {
    placeholder: 'Mahsulot qidirish',
    label: 'Mahsulot qidirish',
    scope: 'Qidirish joyi',
    allCategories: 'Barcha toifalar',
    clear: 'Qidiruv soʻzini tozalash',
    searching: 'Qidirilmoqda…',
    suggestions: 'Takliflar',
    results: 'Natijalar',
    products: 'Mahsulotlar',
    brands: 'Brendlar',
    categories: 'Toifalar',
    noSuggestions: (term: string) => `“${term}” ga mos narsa yoʻq.`,
    viewAllResults: (term: string) => `“${term}” boʻyicha barcha natijalar`,
    recent: 'Oxirgi qidiruvlar',
    clearRecent: 'Oxirgi qidiruvlarni tozalash',
    removeRecent: (term: string) => `${term} ni oxirgi qidiruvlardan oʻchirish`,
    onSale: 'Chegirmada',
  },

  catalog: {
    /** The label on the sort menu. */
    sortLabel: 'Saralash',
    sort: {
      featured: 'Tavsiya etilgan',
      priceAsc: 'Arzonidan qimmatiga',
      priceDesc: 'Qimmatidan arzoniga',
      rating: 'Eng yuqori baho',
      newest: 'Eng yangi',
    },
    viewLabel: 'Koʻrinish',
    viewGrid: 'Toʻr',
    viewList: 'Roʻyxat',
    resultsCount: (count: number) => `${count} ta mahsulot`,
    subcategoriesHeading: 'Pastki boʻlimlar',
    searchWithin: 'Shu boʻlimdan qidirish',
    matching: (term: string) => `Mos keladi: “${term}”`,
    activeFiltersLabel: 'Faol filtrlar',
    removeFilter: (label: string) => `Filtrni olib tashlash: ${label}`,
    clearAll: 'Hammasini tozalash',
    emptyTitle: 'Hozircha bu yerda hech narsa yoʻq',
    emptyBody: 'Bu boʻlimda hozircha mahsulot yoʻq.',
    emptyBrowse: 'Barcha mahsulotlarni koʻrish',
    emptySearchLabel: 'Katalogdan qidirish',
    notFoundTitle: 'Boʻlim topilmadi',
    notFoundBody: 'Bunday boʻlim yoʻq yoki endi mavjud emas.',
    backHome: 'Bosh sahifaga',
  },

  pagination: {
    label: 'Sahifalash',
    previous: 'Oldingi sahifa',
    next: 'Keyingi sahifa',
    page: (number: number) => `${number}-sahifa`,
    current: (number: number) => `${number}-sahifa, joriy`,
    goTo: (number: number) => `${number}-sahifaga oʻtish`,
    jumpToLabel: 'Sahifa raqami',
    jumpToAction: 'Oʻtish',
    loadMore: 'Yana koʻrsatish',
    loadingMore: 'Yana yuklanmoqda…',
  },
  filters: {
    /** The panel's heading, and the label on the drawer's open button. */
    heading: 'Filtrlar',
    open: 'Filtrlar',
    close: 'Filtrlarni yopish',
    /** The drawer's footer button: it closes the drawer, the filters are already applied. */
    showResults: (count: number) => `${count} ta mahsulotni koʻrish`,
    clearAll: 'Barcha filtrlarni tozalash',
    /** How many filters are on, for the toolbar button. */
    activeCount: (count: number) => `${count} ta filtr`,
    price: {
      heading: 'Narx',
      min: 'Eng past narx',
      max: 'Eng yuqori narx',
      from: 'Dan',
      to: 'Gacha',
      /** A quick preset. `amount` arrives already formatted as money. */
      under: (amount: string) => `${amount} gacha`,
      over: (amount: string) => `${amount} dan yuqori`,
      between: (from: string, to: string) => `${from} – ${to}`,
      /** Names the preset row, so it is not three unlabelled buttons. */
      presetsLabel: 'Narx oraliqlari',
      /** Shown instead of the control when nothing matches, so there is no range. */
      unavailable: 'Bu yerda narx boʻyicha filtrlanadigan narsa yoʻq.',
    },
    brand: {
      heading: 'Brend',
      search: 'Brendni topish',
      empty: 'Mos brend topilmadi.',
      /** The row that clears the brand, since only one can be chosen at a time. */
      all: 'Barcha brendlar',
    },
    rating: {
      heading: 'Reyting',
      andUp: (stars: number) => `${stars} va yuqori`,
      /** The row that clears the rating floor. */
      any: 'Har qanday reyting',
    },
    availability: {
      heading: 'Mavjudligi',
      inStock: 'Faqat mavjudlari',
      onSale: 'Faqat chegirmadagilar',
    },
  },

  cart: {
    title: 'Savatingiz',
    previewTitle: 'Yaqinda qoʻshilgan',
    openCart: 'Savatni ochish',
    empty: 'Savatingiz boʻsh.',
    emptyHint: 'Qoʻshgan mahsulotlaringiz shu yerda koʻrinadi.',
    subtotal: 'Jami',
    shippingNote: 'Yetkazib berish narxi buyurtmani rasmiylashtirishda hisoblanadi.',
    viewCart: 'Savatni koʻrish',
    checkout: 'Buyurtmani rasmiylashtirish',
    itemCount: (count: number) => `${count} ta mahsulot`,
    moreItems: (count: number) => `savatda yana ${count} ta`,
    removeItem: (name: string) => `${name} ni savatdan oʻchirish`,

    /** Savat sahifasi: yakun kartasi, satrlar va ular haqidagi matn. */
    summaryHeading: 'Buyurtma yakuni',
    savings: 'Tejamingiz',
    promoLine: (code: string) => `${code} kodi`,
    shipping: 'Yetkazib berish',
    shippingFree: 'Bepul',
    total: 'Jami toʻlov',
    checkoutNote:
      'Yetkazib berish narxi rasmiylashtirishda, formadagi manzil boʻyicha tasdiqlanadi.',
    secureNote: 'Bu versiyada toʻlov simulyatsiya qilinadi. Karta maʼlumotlari soʻralmaydi.',
    /** Rasmiylashtirish API qabul qiladigan toʻlov usullari, soʻz bilan. */
    paymentBadges: ['Karta', 'Yetkazilganda naqd'],

    lineTotal: (value: string) => `Satr summasi ${value}`,
    remove: 'Oʻchirish',
    itemStockLeft: (count: number) => `Omborda faqat ${count} ta qoldi.`,

    promoLabel: 'Promokod',
    promoPlaceholder: 'Masalan, WELCOME10',
    promoHint: 'Bitta buyurtmaga bitta kod.',
    promoApplied: (code: string) => `${code} kodi qoʻllandi`,
    promoRemove: 'Kodni olib tashlash',

    pricesChanged: 'Bu mahsulotlarni qoʻshganingizdan beri narx yoki qoldiq oʻzgardi.',
    updatePrices: 'Savatni yangilash',
    reduceTo: (count: number) => `${count} taga kamaytirish`,
    issueInactive: (name: string) => `${name} endi sotilmaydi.`,
    issueOutOfStock: (name: string) => `${name} tugadi.`,
    issueStockLeft: (name: string, available: number, wanted: number) =>
      `${name} dan faqat ${available} ta qoldi, savatda esa ${wanted} ta.`,
    issuePrice: (name: string, was: string, now: string) =>
      `${name} endi ${now} turadi, savatda esa ${was} bilan turibdi.`,
    revalidateFailed: 'Bugungi narxlarni tekshira olmadik. Savat oʻzgargan boʻlishi mumkin.',
    blockedCheckout: 'Rasmiylashtirishdan oldin mavjud boʻlmagan mahsulotlarni olib tashlang.',

    freeDeliveryBar: 'Bepul yetkazib berishgacha qolgan qadam',
    freeDeliveryProgress: (amount: string) =>
      `Bepul yetkazib berish uchun yana ${amount} qoʻshing.`,
    freeDeliveryReached: 'Bu buyurtma bepul yetkaziladi.',

    emptyCta: 'Katalogga oʻtish',
    emptyRecentHeading: 'Yaqinda koʻrganlar',
    emptyRecentHint: 'Oxirgi ochgan mahsulotlaringiz — biri shu yerga toʻgʻri kelishi mumkin.',
  },

  /**
   * Buyurtma rasmiylashtirish: toʻrt qadam, har biri nima soʻraydi va
   * buyurtma tushadigan sahifa. Qadam nomlari shu yerda bir marta saqlanadi va
   * bosib oʻtiladigan tartibda chiziladi — qadamlar chizigʻi bilan forma
   * ketma-ketlikda ayrilishi mumkin emas.
   */
  checkout: {
    title: 'Buyurtma berish',
    stepsHeading: 'Buyurtma qadamlari',
    steps: {
      contact: 'Aloqa',
      shipping: 'Yetkazib berish',
      payment: 'Toʻlov',
      review: 'Tekshirish',
    },
    stepOf: (current: number, total: number) => `${total} qadamdan ${current}-si`,
    editStep: (label: string) => `${label} — oʻzgartirish`,
    back: 'Orqaga',
    continue: 'Davom etish',
    placeOrder: 'Buyurtma berish',
    placingOrder: 'Buyurtma yuborilmoqda…',
    fixErrors: 'Davom etishdan oldin belgilangan maydonlarni tekshiring.',
    blockedCheckout:
      'Savatdagi baʼzi mahsulotlarni endi buyurtma qilib boʻlmaydi. Buyurtma berishdan oldin ularni olib tashlang yoki qolganini oling.',
    lineRefused: (name: string) =>
      `«${name}» buyurtmaga qoʻshilmadi. Formani toʻldirayotganingizda tugab qolgan boʻlishi mumkin.`,
    promoRefused:
      'Server savatdagi promokodni rad etdi. Uni olib tashlang yoki boshqasini qoʻllang.',

    /** Qadamlar keyingisiga oʻtishdan oldin tekshiradigan qoidalar. */
    fields: {
      nameRequired: 'Ism va familiyani kiriting.',
      nameTooLong: 'Ism juda uzun.',
      emailRequired: 'Elektron pochta manzilini kiriting.',
      emailInvalid: 'Toʻgʻri pochta manzilini kiriting.',
      emailTooLong: 'Pochta manzili juda uzun.',
      phoneRequired: 'Telefon raqamini kiriting.',
      phoneInvalid: 'Toʻgʻri raqamni kiriting, masalan +998 90 123 45 67.',
      phoneTooLong: 'Telefon raqami juda uzun.',
      countryRequired: 'Mamlakatni kiriting.',
      countryTooLong: 'Mamlakat nomi juda uzun.',
      cityRequired: 'Shaharni kiriting.',
      cityTooLong: 'Shahar nomi juda uzun.',
      streetRequired: 'Koʻcha va uy raqamini kiriting.',
      streetTooLong: 'Manzil juda uzun.',
      postalCodeTooLong: 'Pochta indeksi juda uzun.',
      notesTooLong: 'Izoh juda uzun.',
    },

    contact: {
      heading: 'Aloqa maʼlumotlari',
      body: 'Buyurtma tasdigʻi qayerga boradi va kuryer siz bilan qanday bogʻlanadi.',
      prefilledNote:
        'Hisobingizdan toʻldirildi. Bu buyurtma uchun boshqacha boʻlishi kerak boʻlgan joyni oʻzgartiring.',
      nameLabel: 'Ism va familiya',
      emailLabel: 'Elektron pochta',
      emailHelper: 'Buyurtma tasdigʻi shu manzilga yuboriladi.',
      phoneLabel: 'Telefon raqami',
      phoneHelper: 'Kuryer yetkazishdan oldin shu raqamga qoʻngʻiroq qiladi.',
    },

    shipping: {
      heading: 'Yetkazib berish maʼlumotlari',
      body: 'Joʻnatma qayerga boradi va u yerga qanday yetib boradi.',
      defaultCountry: 'Oʻzbekiston',
      countryLabel: 'Mamlakat',
      cityLabel: 'Shahar',
      streetLabel: 'Koʻcha va uy',
      postalCodeLabel: 'Pochta indeksi',
      postalCodeHelper: 'Olti raqam. Yetkazish muddati shu boʻyicha hisoblanadi.',
      notesLabel: 'Yetkazish uchun izoh',
      notesPlaceholder: 'Masalan: kelishdan oldin qoʻngʻiroq qiling.',
      notesHelper: 'Ixtiyoriy.',
      estimating: 'Bu manzilga yetkazish tekshirilmoqda…',
      estimateUnavailable:
        'Bu manzil uchun yetkazish muddatini aniqlab boʻlmadi. Uni buyurtma bilan birga tasdiqlaymiz.',
      estimate: (zone: string, minimum: number, maximum: number, fee: string) =>
        `${zone}ga ${minimum}–${maximum} ish kuni ichida, ${fee}.`,
      methods: {
        COURIER: {
          name: 'Kuryer',
          body: 'Manzilingizga olib kelamiz. 500 000 soʻmdan bepul, aks holda 25 000 soʻm.',
        },
        PICKUP: {
          name: 'Doʻkondan olib ketish',
          body: 'Toshkentdagi doʻkondan olib ketasiz, yetkazish uchun toʻlov yoʻq.',
        },
      },
    },

    payment: {
      heading: 'Toʻlov',
      body: 'Ikkala usul ham buyurtmaga yoziladi va doʻkon tomonidan tasdiqlanadi.',
      testMode: 'Sinov rejimi.',
      testModeBody:
        'Bu versiyada toʻlov imitatsiya qilinadi: kartadan pul yechilmaydi, karta maʼlumotlari soʻralmaydi, yuborilmaydi va saqlanmaydi.',
      methods: {
        CARD: {
          name: 'Karta orqali toʻlov',
          body: 'Doʻkon buyurtmani koʻrib chiqishda toʻlovni tasdiqlaydi.',
        },
        CASH: {
          name: 'Yetkazib berishda naqd',
          body: 'Joʻnatma kelganda kuryerga toʻlanadi.',
        },
      },
    },

    review: {
      heading: 'Buyurtmani tekshiring',
      body: 'Quyidagi maʼlumotlarni tekshiring. Yuqoridagi har bir qadamni hali ham oʻzgartirish mumkin.',
      contactLabel: 'Ism',
      emailLabel: 'Pochta',
      phoneLabel: 'Telefon',
      addressLabel: 'Yetkazish manzili',
      deliveryLabel: 'Yetkazish',
      paymentLabel: 'Toʻlov',
      notesLabel: 'Izoh',
    },

    summary: {
      heading: 'Buyurtma tarkibi',
      quantity: (count: number) => `Soni: ${count}`,
      promoNote: (amount: string) => `Promokod buyurtmani ${amount} ga kamaytiradi.`,
    },

    /** Buyurtma nima uchun rad etilgani, forma buni qanday aytadi. */
    failures: {
      validation:
        'Doʻkon bu buyurtmani rad etdi. Maʼlumotlarni va savatni tekshirib, yana urinib koʻring.',
      conflict: 'Siz buyurtma berayotganda savat oʻzgardi. Sahifani yangilab, yana urinib koʻring.',
      unauthenticated: 'Sessiya tugadi. Yana kiring — savatingiz joyida turadi.',
      rateLimited: 'Bu hisobdan juda koʻp buyurtma berildi. Birozdan soʻng yana urinib koʻring.',
      unknown: 'Buyurtmani rasmiylashtirib boʻlmadi. Yana bir marta urinib koʻring.',
    },

    confirmation: {
      heading: 'Rahmat. Buyurtmangiz qabul qilindi.',
      body: 'Joʻnatma yoʻlga chiqqanda xabar beramiz.',
      orderNumber: 'Buyurtma raqami',
      status: (status: string) =>
        ({
          PENDING: 'Buyurtma qabul qilindi',
          CONFIRMED: 'Buyurtma tasdiqlandi',
          PROCESSING: 'Buyurtma yigʻilmoqda',
          SHIPPED: 'Yoʻlda',
          DELIVERED: 'Yetkazildi',
          CANCELLED: 'Bekor qilindi',
        })[status] ?? 'Buyurtma qabul qilindi',
      itemsHeading: 'Nima buyurtma qildingiz',
      totalPaid: 'Jami toʻlandi',
      estimate: (zone: string, minimum: number, maximum: number) =>
        `${zone}ga yetkazish ${minimum}–${maximum} ish kuni oladi.`,
      estimateUnknown: 'Bu manzil uchun yetkazish muddatini buyurtma bilan birga tasdiqlaymiz.',
      pickupNote: 'Toshkentdagi doʻkondan olib keting. Tayyor boʻlganda xabar beramiz.',
      payment: (method: string, status: string) => `${method} · ${status}`,
      paymentStatus: (status: string) =>
        ({
          UNPAID: 'hali toʻlanmagan',
          PAID: 'toʻlangan',
          FAILED: 'toʻlov oʻtmadi',
          REFUNDED: 'pul qaytarilgan',
        })[status] ?? status,
      viewOrder: 'Buyurtmani kuzatish',
      viewOrders: 'Buyurtmalarim',
      browse: 'Xaridni davom ettirish',
      notFoundTitle: 'Bu buyurtma topilmadi',
      notFoundBody:
        'Havola eskirgan boʻlishi mumkin yoki buyurtma boshqa hisobga tegishli. Oʻz buyurtmalaringiz hisobingizda koʻrinadi.',
    },
  },

  /**
   * Buyurtmalar tarixi va bitta buyurtma.
   *
   * Olti holat nomi bir marta, shu yerda yozilgan: nishon, shkala va roʻyxat
   * ularni shu guruhdan oʻqiydi, shuning uchun bir holat ikki xil nomlanmaydi.
   * Shkala gaplari alohida: ular holat nima deganini aytadi, nima deb
   * atalishini emas.
   */
  orders: {
    title: 'Buyurtmalarim',
    subtitle: 'Eng yangisidan boshlab, barcha buyurtmalaringiz.',
    count: (count: number) => `${count} ta buyurtma`,
    emptyTitle: 'Hozircha buyurtma yoʻq',
    emptyBody: 'Buyurtma bersangiz, u holati va tarkibi bilan shu yerda koʻrinadi.',
    browseCatalog: 'Katalogga oʻtish',
    loadFailed: 'Buyurtmalaringizni yuklab boʻlmadi.',
    orderNumber: 'Buyurtma raqami',
    placedOn: (date: string) => `${date} sanasida berilgan`,
    itemCount: (count: number) => `${count} ta mahsulot`,
    viewOrder: (orderNumber: string) => `${orderNumber} buyurtmasini ochish`,
    status: {
      PENDING: 'Qabul qilindi',
      CONFIRMED: 'Tasdiqlandi',
      PROCESSING: 'Yigʻilmoqda',
      SHIPPED: 'Yoʻlda',
      DELIVERED: 'Yetkazildi',
      CANCELLED: 'Bekor qilindi',
    },
    timeline: {
      PENDING: 'Buyurtma bizda.',
      CONFIRMED: 'Doʻkon buyurtmani tasdiqladi.',
      PROCESSING: 'Mahsulotlar yigʻilib, qadoqlanmoqda.',
      SHIPPED: 'Joʻnatma kuryerda.',
      DELIVERED: 'Joʻnatma yetkazildi.',
    },
    timelineCancelled: 'Bu buyurtma bekor qilindi va yetkazilmaydi.',
    timelineCancelledRefunded: 'Bu buyurtma bekor qilindi, toʻlov qaytarildi.',

    /** Bitta buyurtma: chek, harakat va uni toʻxtatish yoʻli. */
    detail: {
      title: 'Buyurtma',
      loadFailed: 'Bu buyurtmani yuklab boʻlmadi.',
      notFoundTitle: 'Bu buyurtma topilmadi',
      notFoundBody:
        'Havola eskirgan boʻlishi mumkin yoki buyurtma boshqa hisobga tegishli. Oʻz buyurtmalaringiz hisobingizda koʻrinadi.',
      itemsHeading: 'Nima buyurtma qildingiz',
      progressHeading: 'Buyurtma qayerda',
      deliveryHeading: 'Yetkazib berish',
      addressLabel: 'Manzil',
      notesLabel: 'Doʻkon uchun izoh',
      paymentHeading: 'Toʻlov',
      payment: (method: string, status: string) => `${method} · ${status}`,
      totalLabel: 'Buyurtma summasi',
      cancel: 'Buyurtmani bekor qilish',
      cancelling: 'Bekor qilinmoqda…',
      cancelConfirmTitle: 'Bu buyurtma bekor qilinsinmi?',
      cancelConfirmBody:
        'Buyurtma bekor qilinadi va mahsulotlar omborga qaytadi. Buni ortga qaytarib boʻlmaydi.',
      cancelConfirm: 'Ha, bekor qilish',
      cancelKeep: 'Buyurtmani qoldirish',
      cancelFailed: 'Buyurtmani bekor qilib boʻlmadi. Yana urinib koʻring.',
      cancelClosed:
        'Bu buyurtma bekor qilish mumkin boʻlgan bosqichdan oʻtib ketgan. Muammo boʻlsa, doʻkon bilan bogʻlaning.',
    },
  },
  wishlist: {
    heading: 'Saqlangan mahsulotlar',
    itemCount: (count: number) => `${count} ta saqlangan mahsulot`,
    selectAll: 'Hammasini tanlash',
    selectItem: (name: string) => `«${name}» ni tanlash`,
    selectedCount: (count: number) => `${count} ta tanlandi`,
    moveSelected: 'Tanlanganlarni savatga oʻtkazish',
    removeSelected: 'Tanlanganlarni olib tashlash',
    clearAll: 'Roʻyxatni tozalash',
    moveToCart: 'Savatga',
    chooseOptions: 'Variantni tanlash',
    remove: 'Olib tashlash',
    needsChoice: 'Mahsulotning variantlari bor. Tanlash uchun uni oching.',
    emptyTitle: 'Hozircha hech narsa saqlanmagan',
    emptyBody: 'Mahsulot kartasidagi yurakchani bosing — u siz qaytguningizcha shu yerda turadi.',
    browseCatalog: 'Katalogga oʻtish',
    loadFailed: 'Saqlangan mahsulotlarni yuklab boʻlmadi.',
    actionFailed: 'Roʻyxatni oʻzgartirib boʻlmadi. Yana bir marta urinib koʻring.',
    guestNote: 'Roʻyxat shu yerda saqlanadi va kirganingizda hisobingizga oʻtkaziladi.',
  },

  account: {
    menuTitle: 'Hisob menyusi',
    greeting: (name: string) => `${name} sifatida kirdingiz`,
    orders: 'Buyurtmalar',
    accountDetails: 'Hisob maʼlumotlari',
    signInPrompt: 'Buyurtmalaringiz va saralanganlaringizni koʻrish uchun kiring.',
    signIn: 'Kirish',
    register: 'Hisob yaratish',
    signOut: 'Chiqish',
    signingOut: 'Chiqilmoqda…',
    tabsLabel: 'Hisob boʻlimlari',
    tabs: {
      profile: 'Maʼlumotlaringiz',
      address: 'Yetkazish manzili',
      security: 'Xavfsizlik',
    },
    links: {
      ordersBody: 'Barcha rasmiylashtirilgan buyurtmalar: holati va summasi.',
      wishlist: 'Saqlangan mahsulotlar',
      wishlistBody: 'Saqlab qoʻyilgan mahsulotlar savatga oʻtkazish uchun tayyor.',
    },
    profile: {
      heading: 'Maʼlumotlaringiz',
      body: 'Buyurtma rasmiylashtiriladigan ism va yetkazish boʻyicha qoʻngʻiroq qilinadigan raqam.',
      /** Email maydoni tahrirlanmaydi, shuning uchun sababi shu yerda yoziladi. */
      emailNote: 'Email — hisobingizga kirish usuli. Bu yerda uni oʻzgartirib boʻlmaydi.',
      phoneNote: 'Majburiy emas. Faqat yetkazish boʻyicha bogʻlanish uchun.',
      save: 'Oʻzgarishlarni saqlash',
      saving: 'Saqlanmoqda…',
      saved: 'Maʼlumotlar saqlandi.',
    },
    password: {
      heading: 'Parol',
      body: 'Kirish parolini almashtirish. Yangisini oʻrnatish uchun hozirgisini kiritish kerak.',
      currentLabel: 'Hozirgi parol',
      newLabel: 'Yangi parol',
      change: 'Parolni almashtirish',
      changing: 'Almashtirilmoqda…',
      changed: 'Parol almashtirildi.',
      note: 'Parol almashtirilganda boshqa qurilmalarda ochiq sessiyalar yopilmaydi.',
    },
    address: {
      heading: 'Yetkazish manzillari',
      body: 'Shu yerda saqlanadi va buyurtma berishda taklif qilinadi. Asosiy manzil oʻzi toʻldiriladi.',
      add: 'Manzil qoʻshish',
      addHeading: 'Yangi manzil',
      editHeading: 'Manzilni oʻzgartirish',
      /** Nomi berilmagan manzil qatori shunday ataladi. */
      untitled: 'Manzil',
      defaultBadge: 'Asosiy',
      makeDefault: 'Asosiy qilish',
      edit: 'Oʻzgartirish',
      remove: 'Oʻchirish',
      labelLabel: 'Nomi',
      labelHelper: 'Majburiy emas. Manzillarni ajratish uchun «Uy» yoki «Ish».',
      fullNameLabel: 'Toʻliq ism',
      phoneLabel: 'Telefon raqami',
      countryLabel: 'Mamlakat',
      cityLabel: 'Shahar',
      streetLabel: 'Koʻcha, uy, xonadon',
      postalCodeLabel: 'Pochta indeksi',
      isDefaultLabel: 'Asosiy yetkazish manzili sifatida ishlatish',
      isDefaultHelper: 'Buyurtma berishda birinchi boʻlib shu manzil toʻldiriladi.',
      save: 'Manzilni saqlash',
      saving: 'Saqlanmoqda…',
      cancel: 'Bekor qilish',
      loading: 'Manzillaringiz yuklanmoqda…',
      loadFailed: 'Manzillaringizni yuklab boʻlmadi.',
      empty: 'Hozircha manzil saqlanmagan. Manzil qoʻshing — buyurtma berishda u taklif qilinadi.',
      removeConfirmTitle: 'Bu manzil oʻchirilsinmi?',
      removeConfirmBody:
        'U hisobdan oʻchiriladi. Allaqachon rasmiylashtirilgan buyurtmalar yuborilgan manzilini saqlab qoladi.',
      removeConfirm: 'Oʻchirish',
      removeKeep: 'Qoldirish',
    },
    /** Hisob shakllari qabul qilmagan maydon ostida yozadigan matn. */
    fields: {
      currentRequired: 'Hozirgi parolni kiriting.',
      phoneRequired: 'Kuryer qoʻngʻiroq qila oladigan telefon raqamini kiriting.',
      labelTooLong: 'Nomi juda uzun.',
      fullNameRequired: 'Qabul qiluvchining ismini kiriting.',
      fullNameTooLong: 'Ism juda uzun.',
      countryRequired: 'Mamlakatni kiriting.',
      countryTooLong: 'Mamlakat nomi juda uzun.',
      cityRequired: 'Shaharni kiriting.',
      cityTooLong: 'Shahar nomi juda uzun.',
      streetRequired: 'Manzilni kiriting: koʻcha, uy, xonadon.',
      streetTooLong: 'Manzil juda uzun.',
      postalCodeTooLong: 'Pochta indeksi juda uzun.',
    },
  },
  auth: {
    /** Saqlangan sessiya tasdiqlanayotganda ko'rsatiladi, sahifa bo'sh qolmasin. */
    checkingSession: 'Sessiya tekshirilmoqda…',
    signInBody:
      'Buyurtmalaringiz, saqlangan mahsulotlaringiz va savatingizni istalgan qurilmada ko‘rish uchun kiring.',
    registerBody:
      'Akkount buyurtmalar va saqlangan mahsulotlarni bir joyda saqlaydi — shu qurilmada ham, keyingisida ham.',
    firstNameLabel: 'Ism',
    lastNameLabel: 'Familiya',
    emailLabel: 'Elektron pochta',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'Telefon raqami',
    phoneHelper: 'Ixtiyoriy. Faqat yetkazib berish bo‘yicha bog‘lanish uchun.',
    phonePlaceholder: '+998 90 123 45 67',
    passwordLabel: 'Parol',
    passwordPlaceholder: 'Kamida 8 belgi',
    confirmPasswordLabel: 'Parolni takrorlang',
    showPassword: 'Parolni ko‘rsatish',
    hidePassword: 'Parolni yashirish',
    signingIn: 'Kirilmoqda…',
    registering: 'Akkount yaratilmoqda…',
    noAccountYet: 'Akkountingiz yo‘qmi?',
    haveAccount: 'Akkountingiz bormi?',
    invalidCredentials: 'Pochta yoki parol noto‘g‘ri.',
    tooManyAttempts:
      'Kirish urinishlari juda ko‘p. Bir necha daqiqadan so‘ng qayta urinib ko‘ring.',
    tooManyRegistrations:
      'Bu qurilmadan juda ko‘p akkount yaratildi. Keyinroq qayta urinib ko‘ring.',
    emailTaken: 'Bu pochta bilan akkount allaqachon bor. Unga kiring.',
    registerTerms: 'Akkount yaratish bilan do‘kon savdo shartlariga rozilik bildirasiz.',

    /** Formalar so‘rovdan oldin tekshiradigan qoidalar. Server ham xuddi shularni tekshiradi. */
    fields: {
      firstNameRequired: 'Ismingizni kiriting.',
      firstNameTooLong: 'Ism juda uzun.',
      lastNameRequired: 'Familiyangizni kiriting.',
      lastNameTooLong: 'Familiya juda uzun.',
      emailRequired: 'Elektron pochtangizni kiriting.',
      emailInvalid: 'To‘g‘ri pochta manzilini kiriting.',
      emailTooLong: 'Pochta manzili juda uzun.',
      phoneInvalid: 'To‘g‘ri raqamni kiriting, masalan +998 90 123 45 67.',
      phoneTooLong: 'Telefon raqami juda uzun.',
      passwordRequired: 'Parolni kiriting.',
      passwordShort: 'Kamida 8 belgidan foydalaning.',
      passwordLong: 'Ko‘pi bilan 72 belgidan foydalaning.',
      confirmRequired: 'Parolni takrorlang.',
      passwordMismatch: 'Parollar mos kelmadi.',
    },

    /** Ro‘yxatdan o‘tish formasidagi parol maydoni ostidagi ko‘rsatkich. */
    password: {
      hint: 'Kamida 8 belgi.',
      strengthLabel: 'Parol mustahkamligi',
      strength: {
        weak: 'Zaif',
        fair: 'O‘rtacha',
        good: 'Yaxshi',
        strong: 'Mustahkam',
      },
      hints: {
        length: 'Kamida 8 belgidan foydalaning.',
        longer: 'Yana bir nechta belgi foyda qiladi.',
        case: 'Katta va kichik harflarni aralashtiring.',
        number: 'Raqam qo‘shing.',
        symbol: 'Belgi qo‘shing.',
        met: 'Mustahkam parol.',
      },
    },
  },

  language: {
    menuTitle: 'Til',
    current: (name: string) => `Til: ${name}. Tilni oʻzgartirish`,
    changed: (name: string) => `Til ${name} ga oʻzgartirildi.`,
  },

  announcement: {
    region: 'Hudud va valyuta',
    dismiss: 'Eʼlonni yopish',
    previous: 'Oldingi eʼlon',
    next: 'Keyingi eʼlon',
    messages: [
      '300 000 UZS dan yuqori buyurtmalarga yetkazib berish bepul',
      'Oʻzbekiston boʻylab 2–4 kunda yetkazib berish',
      'Uzcard, Humo yoki yetkazib berishda naqd toʻlov',
    ],
  },

  menu: {
    title: 'Menyu',
    open: 'Menyuni ochish',
    close: 'Menyuni yopish',
    categoriesHeading: 'Toifalar boʻyicha xarid',
    accountHeading: 'Sizning hisobingiz',
    contactHeading: 'Yordam kerakmi?',
    contact: 'Qoʻllab-quvvatlash bilan bogʻlanish',
  },

  footer: {
    tagline: 'Kundalik ehtiyojlar — yetkazib beriladi.',
    shopHeading: 'Xarid',
    supportHeading: 'Mijozlarga xizmat',
    accountHeading: 'Hisob',
    aboutHeading: 'Ziyo haqida',
    rights: (year: number) => `© ${year} Ziyo. Barcha huquqlar himoyalangan.`,
    comingSoon: 'tez orada',
    opensInNewTab: (network: string) => `${network}, yangi oynada ochiladi`,
    socialHeading: 'Ziyoni kuzatib boring',
    contactHeading: 'Manzil va telefon',
    addressLabel: 'Manzil',
    addressValue: 'Amir Temur koʻchasi 107B, Toshkent, Oʻzbekiston',
    phoneLabel: 'Telefon',
    telegramLabel: 'Telegram',
    hoursLabel: 'Ish vaqti',
    hoursValue: 'Dushanbadan shanbagacha, 9:00–20:00',
    paymentsHeading: 'Qabul qilamiz',
    legalHeading: 'Huquqiy maʼlumot',
    newsletterHeading: 'Haftada bir marta yangiliklar',
    newsletterHint: 'Yangi mahsulotlar va chegirma sanalari. Haftada bitta xat, koʻproq emas.',
    newsletterLabel: 'Elektron pochta manzili',
    newsletterPlaceholder: 'siz@misol.uz',
    newsletterSubmit: 'Obuna boʻlish',
    newsletterSubmitting: 'Obuna boʻlinmoqda…',
    newsletterSaved: 'Shu qurilmada saqlandi. Roʻyxat ochilganda xabar beramiz.',
    newsletterKnown: 'Bu manzil allaqachon shu qurilmada saqlangan.',
    links: {
      help: 'Yordam markazi',
      shipping: 'Yetkazib berish',
      returns: 'Qaytarish va almashtirish',
      aboutUs: 'Biz haqimizda',
      stores: 'Doʻkonlar',
      careers: 'Ish oʻrinlari',
      journal: 'Jurnal',
      privacy: 'Maxfiylik siyosati',
      terms: 'Foydalanish shartlari',
      refunds: 'Pulni qaytarish',
      cookies: 'Cookie sozlamalari',
      accessibility: 'Qulaylik bayonoti',
    },
  },

  breadcrumbs: {
    label: 'Navigatsiya yoʻli',
    home: 'Bosh sahifa',
  },

  home: {
    pageTitle: 'Kundalik ehtiyojlar — yetkazib beriladi',
    pageDescription:
      'Ziyodan kiyim, uy, oshxona, goʻzallik, elektronika, oʻyinchoqlar va oziq-ovqat — Oʻzbekiston boʻylab 2–4 kunda yetkazib beriladi.',

    hero: {
      eyebrow: 'Ziyo',
      body: 'Kiyim, uy, oshxona, goʻzallik, elektronika, oʻyinchoqlar va oziq-ovqat. Toshkentdagi ombordan Oʻzbekiston boʻylab 2–4 kunda.',
      primary: 'Katalogga oʻtish',
      secondary: 'Yangiliklarni koʻrish',
    },

    facts: {
      delivery: { value: '2–4 kun', label: 'Oʻzbekiston boʻylab yetkazib berish' },
      shipping: { value: '300 000 UZS', label: 'Shu summadan boshlab bepul' },
      returns: { value: '14 kun', label: 'Fikringizni oʻzgartirish uchun' },
    },

    heroSpotlight: 'Hozir mavjud',

    categoryHeading: 'Toifalar boʻyicha xarid',
    categoryAll: 'Barcha toifalar',
    categoryCount: (count: number) => `${count} ta mahsulot`,
    categoryEmpty: 'Katalog toʻldirilmoqda. Toifalar tez orada qaytadi.',

    promoHeading: 'Amaldagi takliflar',
    promoAll: 'Chegirmadagi barchasi',

    featuredHeading: 'Shu hafta tanlovi',
    featuredHint: 'Javonlarni toʻldiruvchilar tanlagan.',
    featuredAll: 'Barcha mahsulotlar',

    railNewHeading: 'Yangi kelganlar',
    railRatingHeading: 'Eng yaxshi baholangan',
    railSaleHeading: 'Chegirmada',
    railAll: 'Barchasini koʻrish',
    railPrevious: 'Oldingi mahsulotlarga surish',
    railNext: 'Keyingi mahsulotlarga surish',

    dealsHeading: 'Chegirmalar',
    dealsHint: 'Narxlar avvalgidan past. Qancha davom etishini ombor hal qiladi.',
    dealsEmpty: 'Hozir chegirma yoʻq. Yangi takliflar shu yerda paydo boʻladi.',
    dealsAll: 'Barcha chegirmalar',
    dealsSave: (percent: number) => `${percent}% tejang`,
    dealsLeft: (count: number) => `${count} ta qoldi`,
    dealsStockBar: (left: number, fullest: number) =>
      `Zaxira: ${left}, sahifadagi eng toʻla javon ${fullest} ga nisbatan`,

    collectionsHeading: 'Kolleksiyalar',
    collectionOpen: (name: string) => `${name} kolleksiyasini ochish`,

    recommendationsHeading: 'Siz uchun tanlandi',
    recommendationsHint: 'Shu qurilmada koʻrganlaringiz asosida.',
    recommendationsFallbackHint:
      'Bir nechta mahsulotni koʻrmaguningizcha, xaridorlar eng yuqori baholagan narsalar.',

    trustHeading: 'Nega Ziyodan xarid qilinadi',
    deliveryTitle: '2–4 kunda yetkazib berish',
    deliveryBody: 'Oʻzbekiston boʻylab, 300 000 UZS dan yuqorisiga bepul.',
    returnsTitle: 'Qaytarish uchun 14 kun',
    returnsBody: 'Ishlatilmagan mahsulot toʻliq pul qaytarish bilan qabul qilinadi.',
    paymentsTitle: 'Xavfsiz toʻlov',
    paymentsBody: 'Uzcard, Humo va yetkazib berishda naqd.',
    supportTitle: 'Kerak boʻlganda yordam',
    supportBody: 'Qoʻllab-quvvatlash har kuni, dam olish kunlari ham javob beradi.',

    errorHeading: 'Sahifaning bu qismi yuklanmadi',
    retry: 'Qayta urinish',
  },

  market: {
    countries: { UZ: 'Oʻzbekiston' } as Record<string, string>,
    currencyLabels: { UZ: 'UZS (soʻm)' } as Record<string, string>,
  },

  seo: {
    defaultTitle: 'Ziyo — onlayn doʻkon',
    defaultDescription:
      'Ziyo — kiyim, uy, oshxona, goʻzallik, elektronika, oʻyinchoqlar va oziq-ovqat uchun onlayn doʻkon.',
  },

  pages: {
    account: {
      title: 'Hisob',
      note: 'Maʼlumotlaringiz, buyurtmalar boradigan manzil va kirish paroli.',
    },
    cart: {
      title: 'Savat',
      note: 'Savat, undagi mahsulotlar va buyurtma yakuni.',
    },
    checkout: {
      title: 'Buyurtmani rasmiylashtirish',
      note: 'Aloqa maʼlumotlari, yetkazib berish, toʻlov va buyurtma beriladigan tekshirish qadami.',
    },
    orderConfirmation: {
      title: 'Buyurtma tasdiqlandi',
      note: 'Buyurtma raqami, nima buyurtma qilingani va qayerga yetkazilishi.',
    },
    signIn: { title: 'Kirish', note: 'Akkountingiz pochtasi va paroli bilan kiring.' },
    order: {
      title: 'Buyurtma',
      note: 'Bitta buyurtma: tarkibi, summasi va qay darajada ekani.',
    },
    orders: {
      title: 'Buyurtmalar',
      note: 'Barcha buyurtmalar holati, tarkibi va summasi bilan.',
    },
    product: {
      title: 'Mahsulot',
    },
    category: {
      title: 'Toifa',
    },
    register: {
      title: 'Hisob yaratish',
      note: 'Akkount uchun ism, pochta manzili va parol yetarli.',
    },
    search: {
      title: 'Qidiruv',
      heading: (term: string) => `“${term}” boʻyicha natijalar`,
      browseTitle: 'Katalogdan qidirish',
      browseBody: 'Mahsulotlarni nomi, brendi yoki boʻlimi boʻyicha toping.',
      emptyTitle: (term: string) => `“${term}” boʻyicha hech narsa topilmadi`,
      emptyBody: 'Imloni tekshiring yoki qisqaroq soʻz bilan urinib koʻring.',
      didYouMean: 'Balki shuni nazarda tutgansiz',
      didYouMeanBrand: (brand: string) => `Faqat ${brand} ichida`,
      didYouMeanCategory: (name: string) => `${name} boʻlimiga oʻtish`,
      recentHeading: 'Oxirgi qidiruvlar',
      trendingHeading: 'Hozir mashhur',
      categoriesHeading: 'Mashhur boʻlimlar',
      backToCatalog: 'Katalogni koʻrish',
    },
    wishlist: {
      title: 'Saralanganlar',
      note: 'Saqlagan mahsulotlaringiz: ularni savatga oʻtkazish yoki roʻyxatdan olib tashlash mumkin.',
    },
    unknown: 'nomaʼlum',
  },
};
