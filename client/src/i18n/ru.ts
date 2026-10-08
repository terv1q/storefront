/**
 * The Russian interface copy.
 *
 * Written to the shape of `en`, which is what the type on `Strings` checks: a
 * missing key or a value of the wrong kind is a compile error rather than an
 * English sentence left standing in a Russian page.
 *
 * What stays in Latin script: the store's own name, product names, payment
 * brands, the currency code, and the stage numbers in the placeholder notes. What
 * is translated is the interface — including the counts, which take the Russian
 * plural form for the case the sentence needs, which is why they are functions
 * here and not templates.
 */
import type { Strings } from '@/i18n/en';
import { ruPlural } from '@/i18n/plural';

export const ru: Strings = {
  nav: {
    home: 'Главная',
    categories: 'Категории',
    deals: 'Скидки',
    newArrivals: 'Новинки',
    topRated: 'Лучшие',
    onSale: 'Со скидкой',
    shopAll: (name: string) => `Всё в разделе «${name}»`,
    browse: 'Каталог',
    quickLinks: 'Быстрые ссылки',
    search: 'Поиск',
    account: 'Аккаунт',
    orders: 'Заказы',
    wishlist: 'Избранное',
    cart: 'Корзина',
    support: 'Служба поддержки',
    openMenu: 'Открыть меню',
    closeMenu: 'Закрыть меню',
    signIn: 'Войти',
    signOut: 'Выйти',
    register: 'Создать аккаунт',
  },

  actions: {
    addToCart: 'В корзину',
    buyNow: 'Купить сейчас',
    checkout: 'Оформить заказ',
    continueShopping: 'Продолжить покупки',
    remove: 'Удалить',
    saveForLater: 'Отложить',
    moveToCart: 'В корзину',
    apply: 'Применить',
    clearAll: 'Сбросить всё',
    seeAll: 'Смотреть все',
    loadMore: 'Показать ещё',
    retry: 'Попробовать снова',
    cancel: 'Отмена',
    backHome: 'На главную',
    writeReview: 'Написать отзыв',
    increaseQuantity: 'Увеличить количество',
    decreaseQuantity: 'Уменьшить количество',
    search: 'Искать',
    close: 'Закрыть',
  },

  loading: {
    default: 'Загрузка…',
    products: 'Загружаем товары…',
    suggestions: 'Загружаем подсказки…',
    checkout: 'Оформляем заказ…',
    addingToCart: 'Добавляем…',
  },

  empty: {
    cart: 'В корзине пока пусто.',
    wishlist: 'Вы пока ничего не сохранили.',
    orders: 'Вы пока не сделали ни одного заказа.',
    reviews: 'Отзывов пока нет. Будьте первым.',
    search: (query: string) => `По запросу «${query}» ничего не нашлось.`,
  },

  product: {
    ratingSummary: (rating: number, count: number) =>
      `Оценка ${rating} из 5 — ${count} ${ruPlural(count, 'отзыв', 'отзыва', 'отзывов')}`,
    noRating: 'Пока без оценки',
    badgeNew: 'Новинка',
    badgeSale: 'Скидка',
    badgeTop: 'Лучшее',
    inStock: 'В наличии',
    lowStock: (count: number) => (count === 1 ? 'Остался 1' : `Осталось ${count}`),
    outOfStock: 'Нет в наличии',
    addToCart: 'В корзину',
    added: 'Добавлено',
    chooseOptions: 'Выбрать вариант',
    saveToWishlist: (name: string) => `Сохранить «${name}» в избранное`,
    removeFromWishlist: (name: string) => `Убрать «${name}» из избранного`,
    inCart: (count: number) => `${count} в корзине`,
    priceNow: (price: string) => `Сейчас ${price}`,
    priceWas: (price: string) => `было ${price}`,
    notifyMe: 'Сообщить о наличии',
    notifyTitle: 'Сообщить, когда появится',
    notifyBody: (name: string) =>
      `Оставьте почту, и мы напишем, как только «${name}» снова появится в наличии.`,
    notifyLabel: 'Адрес электронной почты',
    notifyPlaceholder: 'you@example.com',
    notifySubmit: 'Сообщить',
    notifySubmitting: 'Отправляем…',
    notifySuccess: 'Спасибо. Мы напишем вам, когда товар появится в наличии.',
    notifyFailed: 'Не удалось сохранить адрес. Попробуйте ещё раз.',
    notifyClose: 'Закрыть',
  },

  productPage: {
    sku: (sku: string) => `Артикул ${sku}`,
    brandLink: (brand: string) => `Все товары бренда ${brand}`,
    ratingJump: (count: number) =>
      `Читать ${count} ${ruPlural(count, 'отзыв', 'отзыва', 'отзывов')}`,
    notFoundTitle: 'Товар не найден',
    notFoundBody: 'Такого товара нет или он больше не продаётся.',
    backToCatalog: 'Смотреть каталог',

    gallery: {
      label: 'Фотографии товара',
      thumbnails: 'Выбрать фото',
      thumbnail: (index: number, total: number) => `Показать фото ${index} из ${total}`,
      current: (index: number, total: number) => `Фото ${index} из ${total}`,
      previous: 'Предыдущее фото',
      next: 'Следующее фото',
      zoomHint: 'Наведите курсор на фото для увеличения',
      zoomLabel: (index: number, total: number) => `Увеличенное фото ${index} из ${total}`,
      open: 'Открыть на весь экран',
      close: 'Закрыть фото на весь экран',
      empty: 'Для этого товара пока нет фотографий',
    },

    price: {
      save: (amount: string) => `Экономия ${amount}`,
      installment: {
        heading: 'Оплата частями',
        plan: (months: number, amount: string) =>
          `${months} ${ruPlural(months, 'месяц', 'месяца', 'месяцев')} — ${amount} в месяц`,
        note: 'Расчёт по графику рассрочки магазина. План подтверждается при оформлении заказа.',
      },
    },

    variant: {
      attributes: {
        Size: 'Размер',
        Color: 'Цвет',
        Finish: 'Отделка',
        Capacity: 'Объём',
        Storage: 'Накопитель',
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
        Black: 'Чёрный',
        Navy: 'Тёмно-синий',
        Sand: 'Песочный',
        'Natural Oak': 'Натуральный дуб',
        Walnut: 'Орех',
        'Matte White': 'Матовый белый',
        Single: 'Односпальная',
        Double: 'Двуспальная',
        King: 'King-size',
        '3 L': '3 л',
        '5 L': '5 л',
        '128 GB': '128 ГБ',
        '256 GB': '256 ГБ',
      } as Record<string, string>,
      unavailable: (value: string) => `${value} — нет в наличии`,
      selected: (name: string, value: string) => `${name}: ${value}`,
    },

    quantity: {
      label: 'Количество',
      limit: (count: number) => (count === 1 ? 'Остался последний' : `До ${count}`),
    },

    actions: {
      addedTitle: 'Добавлено в корзину',
      buyNowHint: 'Откроет оформление заказа с этим товаром.',
      wishlistFailed: 'Не удалось обновить избранное. Попробуйте ещё раз.',
      soldOut: 'Товара нет в наличии. Оставьте почту, и мы напишем, когда он появится.',
    },

    delivery: {
      heading: 'Доставка и оплата',
      zipLabel: 'Почтовый индекс',
      zipPlaceholder: '100000',
      zipHint: 'Шесть цифр, например 100000.',
      check: 'Проверить',
      checking: 'Проверяем…',
      invalidZip: 'Введите индекс из шести цифр.',
      failed: 'Не удалось проверить индекс. Попробуйте ещё раз.',
      toZone: (zone: string) => `Доставка в ${zone}`,
      days: (min: number, max: number) =>
        min === max
          ? `Доставка за ${min} ${ruPlural(min, 'день', 'дня', 'дней')}`
          : `Доставка за ${min}–${max} ${ruPlural(max, 'день', 'дня', 'дней')}`,
      fee: (amount: string) => `Доставка ${amount}`,
      free: 'Доставка бесплатно',
      freeFrom: (amount: string) => `Бесплатно при заказе от ${amount}`,
      pickup: 'Для этого адреса доступен самовывоз из магазина в Ташкенте.',
      outside: 'В этот индекс мы пока не доставляем. Самовывоз из Ташкента по-прежнему доступен.',
      returns: (days: number) => `${days} ${ruPlural(days, 'день', 'дня', 'дней')} на возврат`,
      returnsBody: 'Неиспользованный товар принимается обратно с полным возвратом денег.',
      paymentsHeading: 'Способы оплаты',
      payments: {
        CASH_ON_DELIVERY: 'Наличными при получении',
        CARD: 'Банковская карта',
        PAYME: 'Payme',
        CLICK: 'Click',
      } as Record<string, string>,
      policyFailed: 'Не удалось загрузить условия доставки.',
    },

    tabs: {
      label: 'Информация о товаре',
      description: 'Описание',
      specs: 'Характеристики',
      reviews: 'Отзывы',
      reviewsCount: (count: number) =>
        `Отзывы (${count} ${ruPlural(count, 'отзыв', 'отзыва', 'отзывов')})`,
      descriptionEmpty: 'Для этого товара пока нет описания.',
      specsEmpty: 'Для этого товара пока нет характеристик.',
      reviewsLoading: 'Загружаем отзывы…',
      reviewsFailed: 'Не удалось загрузить отзывы.',
      reviewsMore: 'Показать ещё отзывы',
      reviewsAll: 'Это все отзывы.',
      anonymous: 'Покупатель Ziyo',
      reviewRating: (rating: number) => `Оценка ${rating} из 5`,
    },

    reviews: {
      guestCallout: 'Войдите, чтобы рассказать о своих впечатлениях от товара.',
      guestHeading: 'Войдите, чтобы написать отзыв',
      guestAction: 'Войти',
      writeReview: 'Написать отзыв',
      editReview: 'Изменить отзыв',
      formCreateHeading: 'Написать отзыв',
      formEditHeading: 'Изменить отзыв',
      formTitleField: 'Заголовок',
      formTitleOptional: 'Заголовок (необязательно)',
      formTitlePlaceholder: 'Коротко о главном',
      formBodyField: 'Ваш отзыв',
      formBodyPlaceholder: 'Что вы думаете об этом товаре?',
      formRatingField: 'Ваша оценка',
      formRatingRequired: 'Поставьте оценку от одной до пяти звёзд.',
      formTitleTooLong: (limit: number) => `Заголовок не длиннее ${limit} символов.`,
      formBodyMin: (min: number) =>
        `Напишите хотя бы ${min} ${ruPlural(min, 'символ', 'символа', 'символов')}.`,
      formBodyMax: (limit: number) => `Не больше ${limit} символов.`,
      submitFailed: 'Не удалось сохранить отзыв. Попробуйте ещё раз.',
      formSubmit: 'Опубликовать отзыв',
      formSave: 'Сохранить изменения',
      formSubmitting: 'Публикуем…',
      cancel: 'Отмена',
      close: 'Закрыть',
      bodyCounter: (used: number, limit: number) =>
        `${used} из ${limit} ${ruPlural(limit, 'символа', 'символов', 'символов')}`,
      photosHeading: 'Фотографии',
      photosHint: (max: number) => `До ${max} фотографий, каждая не больше 5 МБ.`,
      addPhotos: 'Добавить фотографии',
      photoCount: (used: number, max: number) => `${used} из ${max} фотографий`,
      photoRemove: (index: number) => `Удалить фотографию ${index}`,
      photoTypeRejected: (name: string) => `${name} — не JPEG, PNG или WebP.`,
      photoSizeRejected: (name: string) => `${name} больше 5 МБ.`,
      photoLimitRejected: (max: number) =>
        max === 1
          ? 'Можно приложить только одну фотографию.'
          : `Можно приложить не больше ${max} фотографий.`,
      alreadyReviewed: 'Вы уже оставили отзыв на этот товар.',
      helpful: 'Полезно',
      notHelpful: 'Не полезно',
      withdrawVote: 'Отозвать голос',
      verifiedPurchase: 'Подтверждённая покупка',
      sortBy: 'Сортировка',
      sortNewest: 'Сначала новые',
      sortHighest: 'Сначала высокие оценки',
      sortLowest: 'Сначала низкие оценки',
      filterBy: 'Фильтр по оценке',
      allRatings: 'Все оценки',
      oneStar: '1 звезда',
      twoStars: '2 звезды',
      threeStars: '3 звезды',
      fourStars: '4 звезды',
      fiveStars: '5 звёзд',
      clearFilters: 'Сбросить фильтры',
      noReviews: 'Отзывов пока нет',
      noReviewsBody: 'Расскажите об этом товаре первым.',
      summaryHeading: 'Что говорят покупатели',
      averageRating: 'Средняя оценка',
      reviewCount: (count: number) => `${count} ${ruPlural(count, 'отзыв', 'отзыва', 'отзывов')}`,
      verifiedPurchases: (count: number) =>
        `${count} ${ruPlural(count, 'подтверждённая покупка', 'подтверждённые покупки', 'подтверждённых покупок')}`,
      ratingBar: (rating: number, count: number) =>
        `${rating} ${ruPlural(rating, 'звезда', 'звезды', 'звёзд')}: ${count} ${ruPlural(count, 'отзыв', 'отзыва', 'отзывов')}`,
      ratingChosen: (rating: number) =>
        `Выбрано ${rating} ${ruPlural(rating, 'звезда', 'звезды', 'звёзд')}`,
      filteredEmpty: 'С такой оценкой отзывов пока нет.',
      writeFirst: 'Написать первый отзыв',
    },

    specs: {
      labelColumn: 'Характеристика',
      valueColumn: 'Значение',
    },

    related: {
      heading: 'С этим товаром смотрят',
      hint: 'Из той же категории и от того же бренда.',
      empty: 'В этой категории больше ничего нет.',
      failed: 'Не удалось загрузить рекомендации.',
    },

    recentlyViewed: {
      heading: 'Вы недавно смотрели',
      hint: 'Товары, которые вы открывали на этом устройстве.',
      clear: 'Очистить список',
    },
  },

  errors: {
    generic: 'Что-то пошло не так. Попробуйте ещё раз.',
    pageFailed: 'Эту страницу не удалось показать.',
    network: 'Не удалось связаться с сервером. Проверьте соединение и попробуйте снова.',
    notFound: 'Мы не нашли такую страницу.',
    notFoundHint: 'Возможно, ссылка устарела или страница переехала.',
    notFoundTitle: 'Страница не найдена',
    unauthorized: 'Войдите, чтобы продолжить.',
    outOfStock: 'Этого товара нет в наличии.',
    quantityExceeded: 'Это больше, чем есть на складе.',
    requiredField: 'Это поле обязательно.',
    invalidEmail: 'Введите корректный адрес электронной почты.',
    supportBody: 'Если повтор не помогает, напишите нам:',
  },

  toast: {
    /** Колонка, в которой появляются уведомления. */
    regionLabel: 'Уведомления',
    dismiss: 'Скрыть уведомление',
    addedToCart: (name: string) => `${name} — в корзине.`,
    wishlistSaved: (name: string) => `${name} добавлен в избранное.`,
    wishlistSavedPlain: 'Товар добавлен в избранное.',
    wishlistRemovedPlain: 'Товар убран из избранного.',
    wishlistRemoved: (name: string) => `${name} убран из избранного.`,
    wishlistRemovedMany: (count: number) => `Из избранного убрано товаров: ${count}.`,
  },

  offline: {
    title: 'Нет подключения.',
    body: 'Часть страниц не загрузится, пока связь не вернётся.',
    backOnline: 'Подключение восстановлено.',
  },

  header: {
    catalog: 'Каталог',
    openCatalog: 'Открыть меню категорий',
    closeCatalog: 'Закрыть меню категорий',
    openSearch: 'Открыть поиск',
    closeSearch: 'Закрыть поиск',
    menu: 'Меню',
    wishlist: 'Избранное',
    cart: 'Корзина',
    account: 'Аккаунт',
    accountNav: 'Аккаунт и корзина',
    primaryNav: 'Основная навигация',
    skipToContent: 'Перейти к содержимому',
  },

  search: {
    placeholder: 'Поиск товаров',
    label: 'Поиск товаров',
    scope: 'Искать в',
    allCategories: 'Все категории',
    clear: 'Очистить запрос',
    searching: 'Ищем…',
    suggestions: 'Подсказки',
    results: 'Результаты',
    products: 'Товары',
    brands: 'Бренды',
    categories: 'Категории',
    noSuggestions: (term: string) => `По запросу «${term}» ничего нет.`,
    viewAllResults: (term: string) => `Все результаты по запросу «${term}»`,
    recent: 'Недавние запросы',
    clearRecent: 'Очистить недавние запросы',
    removeRecent: (term: string) => `Убрать «${term}» из недавних запросов`,
    onSale: 'Со скидкой',
  },

  catalog: {
    /** The label on the sort menu. */
    sortLabel: 'Сортировка',
    sort: {
      featured: 'Рекомендуемые',
      priceAsc: 'Сначала дешёвые',
      priceDesc: 'Сначала дорогие',
      rating: 'Высокий рейтинг',
      newest: 'Сначала новые',
    },
    viewLabel: 'Вид',
    viewGrid: 'Сетка',
    viewList: 'Список',
    resultsCount: (count: number) => `${count} ${ruPlural(count, 'товар', 'товара', 'товаров')}`,
    subcategoriesHeading: 'Подкатегории',
    searchWithin: 'Искать в этой категории',
    matching: (term: string) => `Совпадение: «${term}»`,
    activeFiltersLabel: 'Активные фильтры',
    removeFilter: (label: string) => `Убрать фильтр: ${label}`,
    clearAll: 'Очистить всё',
    emptyTitle: 'Здесь пока ничего нет',
    emptyBody: 'В этой категории сейчас нет товаров.',
    emptyBrowse: 'Смотреть все товары',
    emptySearchLabel: 'Поиск по каталогу',
    notFoundTitle: 'Категория не найдена',
    notFoundBody: 'Такой категории нет или она больше недоступна.',
    backHome: 'На главную',
  },

  pagination: {
    label: 'Постраничная навигация',
    previous: 'Предыдущая страница',
    next: 'Следующая страница',
    page: (number: number) => `Страница ${number}`,
    current: (number: number) => `Страница ${number}, текущая`,
    goTo: (number: number) => `Перейти на страницу ${number}`,
    jumpToLabel: 'Номер страницы',
    jumpToAction: 'Перейти',
    loadMore: 'Показать ещё',
    loadingMore: 'Загружаем ещё…',
  },
  filters: {
    /** The panel's heading, and the label on the drawer's open button. */
    heading: 'Фильтры',
    open: 'Фильтры',
    close: 'Закрыть фильтры',
    /** The drawer's footer button: it closes the drawer, the filters are already applied. */
    showResults: (count: number) =>
      `Показать ${count} ${ruPlural(count, 'товар', 'товара', 'товаров')}`,
    clearAll: 'Сбросить все фильтры',
    /** How many filters are on, for the toolbar button. */
    activeCount: (count: number) => `${count} ${ruPlural(count, 'фильтр', 'фильтра', 'фильтров')}`,
    price: {
      heading: 'Цена',
      min: 'Минимальная цена',
      max: 'Максимальная цена',
      from: 'От',
      to: 'До',
      /** A quick preset. `amount` arrives already formatted as money. */
      under: (amount: string) => `До ${amount}`,
      over: (amount: string) => `От ${amount}`,
      between: (from: string, to: string) => `${from} – ${to}`,
      /** Names the preset row, so it is not three unlabelled buttons. */
      presetsLabel: 'Ценовые диапазоны',
      /** Shown instead of the control when nothing matches, so there is no range. */
      unavailable: 'Здесь нечего фильтровать по цене.',
    },
    brand: {
      heading: 'Бренд',
      search: 'Найти бренд',
      empty: 'Подходящих брендов нет.',
      /** The row that clears the brand, since only one can be chosen at a time. */
      all: 'Все бренды',
    },
    rating: {
      heading: 'Рейтинг',
      andUp: (stars: number) => `${stars} и выше`,
      /** The row that clears the rating floor. */
      any: 'Любой рейтинг',
    },
    availability: {
      heading: 'Наличие',
      inStock: 'Только в наличии',
      onSale: 'Только со скидкой',
    },
  },

  cart: {
    title: 'Корзина',
    previewTitle: 'Недавно добавленные',
    openCart: 'Открыть корзину',
    empty: 'В корзине пока пусто.',
    emptyHint: 'Добавленные товары появятся здесь.',
    subtotal: 'Итого',
    shippingNote: 'Доставка рассчитывается при оформлении заказа.',
    viewCart: 'Перейти в корзину',
    checkout: 'Оформить заказ',
    itemCount: (count: number) => `${count} ${ruPlural(count, 'товар', 'товара', 'товаров')}`,
    moreItems: (count: number) => `ещё ${count} в корзине`,
    removeItem: (name: string) => `Удалить «${name}» из корзины`,

    /** Страница корзины: карточка итогов, строки и всё, что о них сказано. */
    summaryHeading: 'Итог заказа',
    savings: 'Ваша экономия',
    promoLine: (code: string) => `Код ${code}`,
    shipping: 'Доставка',
    shippingFree: 'Бесплатно',
    total: 'К оплате',
    checkoutNote: 'Стоимость доставки подтвердится при оформлении, по адресу из формы.',
    secureNote: 'Оплата в этой версии имитируется. Данные карты не запрашиваются.',
    /** Способы оплаты, которые принимает API оформления, словами. */
    paymentBadges: ['Картой', 'Наличными при получении'],

    lineTotal: (value: string) => `Сумма строки ${value}`,
    remove: 'Удалить',
    itemStockLeft: (count: number) =>
      `Осталось всего ${count} ${ruPlural(count, 'штука', 'штуки', 'штук')}.`,

    promoLabel: 'Промокод',
    promoPlaceholder: 'Например WELCOME10',
    promoHint: 'Один код на заказ.',
    promoApplied: (code: string) => `Код ${code} применён`,
    promoRemove: 'Убрать код',

    pricesChanged: 'Цены или наличие изменились с тех пор, как вы добавили эти товары.',
    updatePrices: 'Обновить корзину',
    reduceTo: (count: number) => `Уменьшить до ${count}`,
    issueInactive: (name: string) => `«${name}» больше не продаётся.`,
    issueOutOfStock: (name: string) => `«${name}» закончился.`,
    issueStockLeft: (name: string, available: number, wanted: number) =>
      `Осталось всего ${available} шт. «${name}», а в корзине ${wanted}.`,
    issuePrice: (name: string, was: string, now: string) =>
      `«${name}» теперь стоит ${now}, а в корзине он по ${was}.`,
    revalidateFailed: 'Не удалось проверить сегодняшние цены. Корзина могла измениться.',
    blockedCheckout: 'Уберите недоступные товары, прежде чем оформлять заказ.',

    freeDeliveryBar: 'Прогресс до бесплатной доставки',
    freeDeliveryProgress: (amount: string) => `Добавьте ${amount} до бесплатной доставки.`,
    freeDeliveryReached: 'Доставка этого заказа бесплатна.',

    emptyCta: 'Перейти в каталог',
    emptyRecentHeading: 'Вы недавно смотрели',
    emptyRecentHint: 'Товары, которые вы открывали последними, — вдруг что-то из них как раз сюда.',
  },

  /**
   * Оформление заказа: четыре шага, что каждый из них спрашивает, и страница,
   * на которую попадает оформленный заказ. Названия шагов хранятся здесь один
   * раз и рисуются в том порядке, в котором проходятся, — полоса шагов и форма
   * не могут разойтись в последовательности.
   */
  checkout: {
    title: 'Оформление заказа',
    stepsHeading: 'Шаги оформления',
    steps: {
      contact: 'Контакты',
      shipping: 'Доставка',
      payment: 'Оплата',
      review: 'Проверка',
    },
    stepOf: (current: number, total: number) => `Шаг ${current} из ${total}`,
    editStep: (label: string) => `Изменить: ${label}`,
    back: 'Назад',
    continue: 'Продолжить',
    placeOrder: 'Оформить заказ',
    placingOrder: 'Заказ оформляется…',
    fixErrors: 'Проверьте выделенные поля, прежде чем продолжить.',
    blockedCheckout:
      'Часть товаров в корзине больше нельзя заказать. Уберите их или возьмите то, что осталось, прежде чем оформлять заказ.',
    lineRefused: (name: string) =>
      `«${name}» не удалось добавить в заказ. Возможно, товар закончился, пока вы заполняли форму.`,
    promoRefused: 'Сервер отклонил промокод в этой корзине. Уберите его или примените другой.',

    /** Правила, которые шаги проверяют, прежде чем пропустить дальше. */
    fields: {
      nameRequired: 'Укажите имя и фамилию.',
      nameTooLong: 'Имя слишком длинное.',
      emailRequired: 'Укажите адрес электронной почты.',
      emailInvalid: 'Укажите корректный адрес электронной почты.',
      emailTooLong: 'Адрес электронной почты слишком длинный.',
      phoneRequired: 'Укажите номер телефона.',
      phoneInvalid: 'Укажите корректный номер, например +998 90 123 45 67.',
      phoneTooLong: 'Номер телефона слишком длинный.',
      countryRequired: 'Укажите страну.',
      countryTooLong: 'Название страны слишком длинное.',
      cityRequired: 'Укажите город.',
      cityTooLong: 'Название города слишком длинное.',
      streetRequired: 'Укажите улицу и дом.',
      streetTooLong: 'Адрес слишком длинный.',
      postalCodeTooLong: 'Почтовый индекс слишком длинный.',
      notesTooLong: 'Комментарий слишком длинный.',
    },

    contact: {
      heading: 'Контактные данные',
      body: 'Куда отправить подтверждение заказа и как курьер с вами свяжется.',
      prefilledNote: 'Заполнено из аккаунта. Измените то, что для этого заказа должно быть другим.',
      nameLabel: 'Имя и фамилия',
      emailLabel: 'Электронная почта',
      emailHelper: 'На этот адрес придёт подтверждение заказа.',
      phoneLabel: 'Номер телефона',
      phoneHelper: 'Курьер позвонит по этому номеру перед доставкой.',
    },

    shipping: {
      heading: 'Данные доставки',
      body: 'Куда едет посылка и как она туда попадёт.',
      defaultCountry: 'Узбекистан',
      countryLabel: 'Страна',
      cityLabel: 'Город',
      streetLabel: 'Улица и дом',
      postalCodeLabel: 'Почтовый индекс',
      postalCodeHelper: 'Шесть цифр. По нему считается срок доставки.',
      notesLabel: 'Комментарий к доставке',
      notesPlaceholder: 'Например: позвоните перед приездом.',
      notesHelper: 'Необязательно.',
      estimating: 'Проверяем доставку по этому адресу…',
      estimateUnavailable:
        'Не удалось определить срок доставки по этому адресу. Мы подтвердим его вместе с заказом.',
      estimate: (zone: string, minimum: number, maximum: number, fee: string) =>
        `Доставка в ${zone} за ${minimum}–${maximum} рабочих дня, ${fee}.`,
      methods: {
        COURIER: {
          name: 'Курьер',
          body: 'Привезём по вашему адресу. Бесплатно от 500 000 сум, иначе 25 000 сум.',
        },
        PICKUP: {
          name: 'Самовывоз из магазина',
          body: 'Забираете в магазине в Ташкенте, без платы за доставку.',
        },
      },
    },

    payment: {
      heading: 'Оплата',
      body: 'Оба способа записываются в заказ и подтверждаются магазином.',
      testMode: 'Тестовый режим.',
      testModeBody:
        'В этой версии оплата имитируется: карта не списывается, данные карты не запрашиваются, не отправляются и не хранятся.',
      methods: {
        CARD: {
          name: 'Оплата картой',
          body: 'Магазин подтвердит оплату при обработке заказа.',
        },
        CASH: {
          name: 'Наличными при получении',
          body: 'Оплата курьеру при получении посылки.',
        },
      },
    },

    review: {
      heading: 'Проверьте заказ',
      body: 'Проверьте данные ниже. Любой шаг выше ещё можно изменить.',
      contactLabel: 'Имя',
      emailLabel: 'Почта',
      phoneLabel: 'Телефон',
      addressLabel: 'Адрес доставки',
      deliveryLabel: 'Доставка',
      paymentLabel: 'Оплата',
      notesLabel: 'Комментарий',
    },

    summary: {
      heading: 'Состав заказа',
      quantity: (count: number) => `Количество: ${count}`,
      promoNote: (amount: string) => `Промокод уменьшает заказ на ${amount}.`,
    },

    /** Почему заказ отклонён, как об этом сообщает форма оформления. */
    failures: {
      validation: 'Магазин отклонил этот заказ. Проверьте данные и корзину и попробуйте снова.',
      conflict:
        'Корзина изменилась, пока вы оформляли заказ. Перезагрузите страницу и попробуйте снова.',
      unauthenticated: 'Сессия завершилась. Войдите снова — корзина останется на месте.',
      rateLimited: 'С этого аккаунта оформлено слишком много заказов. Попробуйте немного позже.',
      unknown: 'Не удалось оформить заказ. Попробуйте ещё раз.',
    },

    confirmation: {
      heading: 'Спасибо. Заказ принят.',
      body: 'Мы напишем, когда посылка отправится в путь.',
      orderNumber: 'Номер заказа',
      status: (status: string) =>
        ({
          PENDING: 'Заказ получен',
          CONFIRMED: 'Заказ подтверждён',
          PROCESSING: 'Заказ собирается',
          SHIPPED: 'В пути',
          DELIVERED: 'Доставлен',
          CANCELLED: 'Отменён',
        })[status] ?? 'Заказ получен',
      itemsHeading: 'Что вы заказали',
      totalPaid: 'Итого оплачено',
      estimate: (zone: string, minimum: number, maximum: number) =>
        `Доставка в ${zone} занимает ${minimum}–${maximum} рабочих дня.`,
      estimateUnknown: 'Мы подтвердим срок доставки по этому адресу вместе с заказом.',
      pickupNote: 'Забрать в магазине в Ташкенте. Мы напишем, когда заказ будет готов.',
      payment: (method: string, status: string) => `${method} · ${status}`,
      paymentStatus: (status: string) =>
        ({
          UNPAID: 'не оплачен',
          PAID: 'оплачен',
          FAILED: 'оплата не прошла',
          REFUNDED: 'деньги возвращены',
        })[status] ?? status,
      viewOrder: 'Отследить заказ',
      viewOrders: 'Мои заказы',
      browse: 'Продолжить покупки',
      notFoundTitle: 'Заказ не найден',
      notFoundBody:
        'Ссылка могла устареть, или заказ принадлежит другому аккаунту. Свои заказы можно посмотреть в аккаунте.',
    },
  },

  /**
   * История заказов и один заказ.
   *
   * Шесть названий статусов написаны один раз, здесь: значок, шкала и список
   * читают их из этой группы, поэтому одно состояние нигде не называется
   * двумя словами. Предложения шкалы отдельные: они объясняют, что статус
   * значит, а не как он называется.
   */
  orders: {
    title: 'Мои заказы',
    subtitle: 'Всё, что вы заказали, начиная с последнего.',
    count: (count: number) => `${count} ${ruPlural(count, 'заказ', 'заказа', 'заказов')}`,
    emptyTitle: 'Заказов пока нет',
    emptyBody: 'Когда вы оформите заказ, он появится здесь вместе со статусом и составом.',
    browseCatalog: 'Перейти в каталог',
    loadFailed: 'Не удалось загрузить ваши заказы.',
    orderNumber: 'Номер заказа',
    placedOn: (date: string) => `Оформлен ${date}`,
    itemCount: (count: number) => `${count} ${ruPlural(count, 'товар', 'товара', 'товаров')}`,
    viewOrder: (orderNumber: string) => `Открыть заказ ${orderNumber}`,
    status: {
      PENDING: 'Получен',
      CONFIRMED: 'Подтверждён',
      PROCESSING: 'Собирается',
      SHIPPED: 'В пути',
      DELIVERED: 'Доставлен',
      CANCELLED: 'Отменён',
    },
    timeline: {
      PENDING: 'Заказ у нас.',
      CONFIRMED: 'Магазин подтвердил заказ.',
      PROCESSING: 'Товары собирают и упаковывают.',
      SHIPPED: 'Посылка у курьера.',
      DELIVERED: 'Посылка доставлена.',
    },
    timelineCancelled: 'Заказ отменён и не будет доставлен.',
    timelineCancelledRefunded: 'Заказ отменён, оплата возвращена.',

    /** Один заказ: чек, движение и способ его остановить. */
    detail: {
      title: 'Заказ',
      loadFailed: 'Не удалось загрузить этот заказ.',
      notFoundTitle: 'Заказ не найден',
      notFoundBody:
        'Ссылка могла устареть, или заказ принадлежит другому аккаунту. Свои заказы можно посмотреть в аккаунте.',
      itemsHeading: 'Что вы заказали',
      progressHeading: 'Где заказ',
      deliveryHeading: 'Доставка',
      addressLabel: 'Адрес',
      notesLabel: 'Комментарий для магазина',
      paymentHeading: 'Оплата',
      payment: (method: string, status: string) => `${method} · ${status}`,
      totalLabel: 'Сумма заказа',
      cancel: 'Отменить заказ',
      cancelling: 'Отменяем…',
      cancelConfirmTitle: 'Отменить этот заказ?',
      cancelConfirmBody:
        'Заказ будет отменён, а товары вернутся на склад. Это действие нельзя отменить.',
      cancelConfirm: 'Да, отменить',
      cancelKeep: 'Оставить заказ',
      cancelFailed: 'Не удалось отменить заказ. Попробуйте ещё раз.',
      cancelClosed:
        'Заказ уже прошёл стадию, на которой его можно отменить. Если что-то не так, свяжитесь с магазином.',
    },
  },
  wishlist: {
    heading: 'Сохранённые товары',
    itemCount: (count: number) =>
      `${count} ${ruPlural(count, 'сохранённый товар', 'сохранённых товара', 'сохранённых товаров')}`,
    selectAll: 'Выбрать все',
    selectItem: (name: string) => `Выбрать «${name}»`,
    selectedCount: (count: number) => `${count} ${ruPlural(count, 'выбран', 'выбрано', 'выбрано')}`,
    moveSelected: 'Перенести выбранные в корзину',
    removeSelected: 'Удалить выбранные',
    clearAll: 'Очистить список',
    moveToCart: 'В корзину',
    chooseOptions: 'Выбрать вариант',
    remove: 'Удалить',
    needsChoice: 'У товара есть варианты. Откройте его, чтобы выбрать.',
    emptyTitle: 'Пока ничего не сохранено',
    emptyBody:
      'Нажмите на сердечко на карточке товара — он будет ждать здесь, пока вы не вернётесь к нему.',
    browseCatalog: 'Перейти в каталог',
    loadFailed: 'Не удалось загрузить сохранённые товары.',
    actionFailed: 'Не удалось изменить список. Попробуйте ещё раз.',
    guestNote: 'Список хранится здесь и переносится в аккаунт при входе.',
  },

  account: {
    menuTitle: 'Меню аккаунта',
    greeting: (name: string) => `Вы вошли как ${name}`,
    orders: 'Заказы',
    accountDetails: 'Данные аккаунта',
    signInPrompt: 'Войдите, чтобы видеть свои заказы и избранное.',
    signIn: 'Войти',
    register: 'Создать аккаунт',
    signOut: 'Выйти',
    signingOut: 'Выходим…',
    tabsLabel: 'Разделы аккаунта',
    tabs: {
      profile: 'Ваши данные',
      address: 'Адрес доставки',
      security: 'Безопасность',
    },
    links: {
      ordersBody: 'Все оформленные заказы: статус и стоимость.',
      wishlist: 'Избранное',
      wishlistBody: 'Товары, которые вы сохранили, готовые перейти в корзину.',
    },
    profile: {
      heading: 'Ваши данные',
      body: 'Имя, на которое оформляется заказ, и номер, по которому мы звоним по доставке.',
      /** Поле email не редактируется, поэтому здесь объясняется почему. */
      emailNote: 'Email — это ваш вход в аккаунт. Здесь его изменить нельзя.',
      phoneNote: 'Необязательно. Только для связи по доставке.',
      save: 'Сохранить изменения',
      saving: 'Сохраняем…',
      saved: 'Данные сохранены.',
    },
    password: {
      heading: 'Пароль',
      body: 'Смена пароля для входа. Чтобы задать новый, нужно ввести текущий.',
      currentLabel: 'Текущий пароль',
      newLabel: 'Новый пароль',
      change: 'Сменить пароль',
      changing: 'Меняем…',
      changed: 'Пароль изменён.',
      note: 'Смена пароля не завершает сессии, открытые на других устройствах.',
    },
    address: {
      heading: 'Адреса доставки',
      body: 'Хранятся здесь и предлагаются при оформлении заказа. Адрес по умолчанию подставляется сам.',
      add: 'Добавить адрес',
      addHeading: 'Новый адрес',
      editHeading: 'Изменить адрес',
      /** Как называется строка, которой не дали названия. */
      untitled: 'Адрес',
      defaultBadge: 'По умолчанию',
      makeDefault: 'Сделать основным',
      edit: 'Изменить',
      remove: 'Удалить',
      labelLabel: 'Название',
      labelHelper: 'Необязательно. «Дом» или «Работа», чтобы различать адреса.',
      fullNameLabel: 'Полное имя',
      phoneLabel: 'Номер телефона',
      countryLabel: 'Страна',
      cityLabel: 'Город',
      streetLabel: 'Улица, дом, квартира',
      postalCodeLabel: 'Почтовый индекс',
      isDefaultLabel: 'Использовать как адрес доставки по умолчанию',
      isDefaultHelper: 'При оформлении заказа он подставляется первым.',
      save: 'Сохранить адрес',
      saving: 'Сохраняем…',
      cancel: 'Отмена',
      loading: 'Загружаем ваши адреса…',
      loadFailed: 'Не удалось загрузить ваши адреса.',
      empty: 'Адресов пока нет. Добавьте адрес — при оформлении заказа он будет предложен.',
      removeConfirmTitle: 'Удалить этот адрес?',
      removeConfirmBody:
        'Он будет удалён из аккаунта. Уже оформленные заказы сохранят адрес, на который были отправлены.',
      removeConfirm: 'Удалить',
      removeKeep: 'Оставить',
    },
    /** Что формы аккаунта пишут под полем, которое не приняли. */
    fields: {
      currentRequired: 'Введите текущий пароль.',
      phoneRequired: 'Введите номер телефона, по которому сможет позвонить курьер.',
      labelTooLong: 'Название слишком длинное.',
      fullNameRequired: 'Введите имя получателя.',
      fullNameTooLong: 'Имя слишком длинное.',
      countryRequired: 'Введите страну.',
      countryTooLong: 'Название страны слишком длинное.',
      cityRequired: 'Введите город.',
      cityTooLong: 'Название города слишком длинное.',
      streetRequired: 'Введите адрес: улицу, дом, квартиру.',
      streetTooLong: 'Адрес слишком длинный.',
      postalCodeTooLong: 'Индекс слишком длинный.',
    },
  },
  auth: {
    /** Показывается, пока подтверждается сохранённая сессия, чтобы страница не была пустой. */
    checkingSession: 'Проверяем сессию…',
    signInBody: 'Войдите, чтобы видеть свои заказы, избранное и корзину на любом устройстве.',
    registerBody: 'Аккаунт хранит заказы и избранное вместе — на этом устройстве и на следующем.',
    firstNameLabel: 'Имя',
    lastNameLabel: 'Фамилия',
    emailLabel: 'Электронная почта',
    emailPlaceholder: 'you@example.com',
    phoneLabel: 'Телефон',
    phoneHelper: 'Необязательно. Нужен только для связи по доставке.',
    phonePlaceholder: '+998 90 123 45 67',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Не меньше 8 символов',
    confirmPasswordLabel: 'Повторите пароль',
    showPassword: 'Показать пароль',
    hidePassword: 'Скрыть пароль',
    signingIn: 'Входим…',
    registering: 'Создаём аккаунт…',
    noAccountYet: 'Ещё нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    invalidCredentials: 'Почта или пароль указаны неверно.',
    tooManyAttempts: 'Слишком много попыток входа. Подождите несколько минут и попробуйте снова.',
    tooManyRegistrations: 'С этого устройства создано слишком много аккаунтов. Попробуйте позже.',
    emailTaken: 'Аккаунт с такой почтой уже есть. Войдите в него.',
    registerTerms: 'Создавая аккаунт, вы соглашаетесь с условиями продажи магазина.',

    /** Правила, которые формы проверяют до запроса. Сервер проверяет те же. */
    fields: {
      firstNameRequired: 'Укажите имя.',
      firstNameTooLong: 'Слишком длинное имя.',
      lastNameRequired: 'Укажите фамилию.',
      lastNameTooLong: 'Слишком длинная фамилия.',
      emailRequired: 'Укажите электронную почту.',
      emailInvalid: 'Укажите корректный адрес почты.',
      emailTooLong: 'Слишком длинный адрес почты.',
      phoneInvalid: 'Укажите корректный номер, например +998 90 123 45 67.',
      phoneTooLong: 'Слишком длинный номер телефона.',
      passwordRequired: 'Введите пароль.',
      passwordShort: 'Используйте не меньше 8 символов.',
      passwordLong: 'Используйте не больше 72 символов.',
      confirmRequired: 'Повторите пароль.',
      passwordMismatch: 'Пароли не совпадают.',
    },

    /** Индикатор под полем пароля на форме регистрации. */
    password: {
      hint: 'Не меньше 8 символов.',
      strengthLabel: 'Надёжность пароля',
      strength: {
        weak: 'Слабый',
        fair: 'Средний',
        good: 'Хороший',
        strong: 'Надёжный',
      },
      hints: {
        length: 'Используйте не меньше 8 символов.',
        longer: 'Ещё несколько символов не помешают.',
        case: 'Смешайте заглавные и строчные буквы.',
        number: 'Добавьте цифру.',
        symbol: 'Добавьте символ.',
        met: 'Надёжный пароль.',
      },
    },
  },

  language: {
    menuTitle: 'Язык',
    current: (name: string) => `Язык: ${name}. Изменить язык`,
    changed: (name: string) => `Язык изменён на ${name}.`,
  },

  announcement: {
    region: 'Регион и валюта',
    dismiss: 'Скрыть объявление',
    previous: 'Предыдущее объявление',
    next: 'Следующее объявление',
    messages: [
      'Бесплатная доставка при заказе от 300 000 UZS',
      'Доставка по Узбекистану за 2–4 дня',
      'Оплата Uzcard, Humo или наличными при получении',
    ],
  },

  menu: {
    title: 'Меню',
    open: 'Открыть меню',
    close: 'Закрыть меню',
    categoriesHeading: 'Покупки по категориям',
    accountHeading: 'Ваш аккаунт',
    contactHeading: 'Нужна помощь?',
    contact: 'Связаться с поддержкой',
  },

  footer: {
    tagline: 'Всё необходимое — с доставкой.',
    shopHeading: 'Покупки',
    supportHeading: 'Служба поддержки',
    accountHeading: 'Аккаунт',
    aboutHeading: 'О Ziyo',
    rights: (year: number) => `© ${year} Ziyo. Все права защищены.`,
    comingSoon: 'скоро',
    opensInNewTab: (network: string) => `${network}, откроется в новой вкладке`,
    socialHeading: 'Следите за Ziyo',
    contactHeading: 'Адрес и телефон',
    addressLabel: 'Адрес',
    addressValue: 'Ташкент, улица Амира Темура, 107Б, Узбекистан',
    phoneLabel: 'Телефон',
    telegramLabel: 'Telegram',
    hoursLabel: 'Часы работы',
    hoursValue: 'Понедельник — суббота, 9:00–20:00',
    paymentsHeading: 'Мы принимаем',
    legalHeading: 'Правовая информация',
    newsletterHeading: 'Что нового — раз в неделю',
    newsletterHint: 'Новинки и даты распродаж. Одно письмо в неделю, не чаще.',
    newsletterLabel: 'Адрес электронной почты',
    newsletterPlaceholder: 'you@example.com',
    newsletterSubmit: 'Подписаться',
    newsletterSubmitting: 'Подписываем…',
    newsletterSaved: 'Сохранено на этом устройстве. Мы напишем, когда откроем рассылку.',
    newsletterKnown: 'Этот адрес уже сохранён на этом устройстве.',
    links: {
      help: 'Справочный центр',
      shipping: 'Доставка',
      returns: 'Возврат и обмен',
      aboutUs: 'О нас',
      stores: 'Магазины',
      careers: 'Вакансии',
      journal: 'Журнал',
      privacy: 'Политика конфиденциальности',
      terms: 'Условия использования',
      refunds: 'Возврат средств',
      cookies: 'Настройки cookie',
      accessibility: 'Доступность',
    },
  },

  breadcrumbs: {
    label: 'Навигационная цепочка',
    home: 'Главная',
  },

  home: {
    pageTitle: 'Всё необходимое — с доставкой',
    pageDescription:
      'Одежда, дом, кухня, красота, электроника, игрушки и продукты от Ziyo с доставкой по Узбекистану за 2–4 дня.',

    hero: {
      eyebrow: 'Ziyo',
      body: 'Одежда, дом, кухня, красота, электроника, игрушки и продукты. Со склада в Ташкенте по всему Узбекистану за 2–4 дня.',
      primary: 'В каталог',
      secondary: 'Что нового',
    },

    facts: {
      delivery: { value: '2–4 дня', label: 'Доставка по Узбекистану' },
      shipping: { value: '300 000 UZS', label: 'Бесплатная доставка от этой суммы' },
      returns: { value: '14 дней', label: 'На возврат' },
    },

    heroSpotlight: 'Сейчас в наличии',

    categoryHeading: 'Покупки по категориям',
    categoryAll: 'Все категории',
    categoryCount: (count: number) => `${count} ${ruPlural(count, 'товар', 'товара', 'товаров')}`,
    categoryEmpty: 'Каталог пополняется. Категории вернутся в ближайшее время.',

    promoHeading: 'Действующие предложения',
    promoAll: 'Всё со скидкой',

    featuredHeading: 'Выбор этой недели',
    featuredHint: 'Отобрано теми, кто наполняет полки.',
    featuredAll: 'Все товары',

    railNewHeading: 'Новинки',
    railRatingHeading: 'Лучшие по оценкам',
    railSaleHeading: 'Со скидкой',
    railAll: 'Смотреть все',
    railPrevious: 'Пролистать к предыдущим товарам',
    railNext: 'Пролистать к следующим товарам',

    dealsHeading: 'Скидки',
    dealsHint: 'Цены ниже, чем были. Как долго это продлится — решает наличие.',
    dealsEmpty: 'Сейчас скидок нет. Новые предложения появятся здесь.',
    dealsAll: 'Все скидки',
    dealsSave: (percent: number) => `Выгода ${percent}%`,
    dealsLeft: (count: number) => `Осталось ${count}`,
    dealsStockBar: (left: number, fullest: number) =>
      `Наличие: ${left} против ${fullest} у самой полной полки на странице`,

    collectionsHeading: 'Коллекции',
    collectionOpen: (name: string) => `Открыть коллекцию «${name}»`,

    recommendationsHeading: 'Подобрано для вас',
    recommendationsHint: 'По тому, что вы смотрели на этом устройстве.',
    recommendationsFallbackHint:
      'То, что покупатели оценивают выше всего, пока вы не посмотрели несколько товаров.',

    trustHeading: 'Почему покупают в Ziyo',
    deliveryTitle: 'Доставка за 2–4 дня',
    deliveryBody: 'По всему Узбекистану, бесплатно от 300 000 UZS.',
    returnsTitle: '14 дней на возврат',
    returnsBody: 'Неиспользованные товары возвращаются с полным возвратом средств.',
    paymentsTitle: 'Безопасная оплата',
    paymentsBody: 'Uzcard, Humo и оплата при получении.',
    supportTitle: 'Помощь, когда она нужна',
    supportBody: 'Поддержка отвечает каждый день, включая выходные.',

    errorHeading: 'Эта часть страницы не загрузилась',
    retry: 'Попробовать снова',
  },

  market: {
    countries: { UZ: 'Узбекистан' } as Record<string, string>,
    currencyLabels: { UZ: 'UZS (soʻm)' } as Record<string, string>,
  },

  seo: {
    defaultTitle: 'Ziyo — интернет-магазин',
    defaultDescription:
      'Ziyo — интернет-магазин одежды, товаров для дома, кухни, красоты, электроники, игрушек и продуктов.',
  },

  pages: {
    account: {
      title: 'Аккаунт',
      note: 'Ваши данные, адрес, куда приходят заказы, и пароль для входа.',
    },
    cart: {
      title: 'Корзина',
      note: 'Корзина, её содержимое и итог заказа.',
    },
    checkout: {
      title: 'Оформление заказа',
      note: 'Контактные данные, доставка, оплата и проверка, из которой заказ оформляется.',
    },
    orderConfirmation: {
      title: 'Заказ оформлен',
      note: 'Номер заказа, что заказано и куда это поедет.',
    },
    signIn: { title: 'Вход', note: 'Войдите по почте и паролю от аккаунта.' },
    order: {
      title: 'Заказ',
      note: 'Один заказ: состав, сумма и то, насколько он продвинулся.',
    },
    orders: {
      title: 'Заказы',
      note: 'Все заказы со статусом, составом и стоимостью.',
    },
    product: {
      title: 'Товар',
    },
    category: {
      title: 'Категория',
    },
    register: {
      title: 'Создание аккаунта',
      note: 'Для аккаунта достаточно имени, адреса почты и пароля.',
    },
    search: {
      title: 'Поиск',
      heading: (term: string) => `Результаты по запросу «${term}»`,
      browseTitle: 'Поиск по каталогу',
      browseBody: 'Ищите товары по названию, бренду или категории.',
      emptyTitle: (term: string) => `По запросу «${term}» ничего не найдено`,
      emptyBody: 'Проверьте написание или попробуйте более короткое слово.',
      didYouMean: 'Возможно, вы имели в виду',
      didYouMeanBrand: (brand: string) => `Только в ${brand}`,
      didYouMeanCategory: (name: string) => `Перейти в ${name}`,
      recentHeading: 'Недавние запросы',
      trendingHeading: 'Сейчас популярно',
      categoriesHeading: 'Популярные категории',
      backToCatalog: 'Смотреть каталог',
    },
    wishlist: {
      title: 'Избранное',
      note: 'Товары, которые вы сохранили: их можно перенести в корзину или убрать из списка.',
    },
    unknown: 'неизвестно',
  },
};
