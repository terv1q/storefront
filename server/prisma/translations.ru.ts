/**
 * Russian catalogue text, keyed by the English source string.
 *
 * Keys are the English strings exactly as `seed-data.ts` writes them — the seed
 * looks a translation up by the string it is about to write, so a key that has
 * drifted by one character is a missing translation and the seed stops.
 *
 * The seed walks the catalogue it has just built — category names and
 * descriptions, subcategory names, blurbs and details, product names, brand
 * names and taglines, every specification row and every variant preset — and
 * asks this table for the Russian wording of each string immediately before it
 * writes the row. When a string has no entry here the seed refuses to run: it
 * reports the missing key and exits rather than quietly seeding a partly
 * English catalogue. That failure mode is deliberate. It means this file has to
 * stay complete, and it means a typo in `seed-data.ts` shows up as a loud
 * missing-translation error instead of an untranslated row in the database.
 *
 * Keying on the English source rather than on slugs or generated ids is what
 * makes the table small. Strings that the catalogue reuses collapse into a
 * single entry by construction: `Material` is both a specification group and a
 * specification label, so it is one line here; `Yes` is the value of three
 * different boolean-ish specs, and it is one line; `Size` names both the
 * apparel and the footwear preset, and it is one line; `Finish` names a variant
 * preset and a furniture spec label, and again it is one line. Nothing has to
 * be registered twice, and there is no way for two copies of the same English
 * word to drift apart.
 *
 * Two deliberate conventions run through the entries below. Brand names stay in
 * Latin script, so `Ziyo Wear` and `Anor Audio` map to themselves while their
 * taglines are translated. Size and colour tokens stay legible in the product
 * names shoppers search for: `128GB`, `1.7L`, `500g` and `24 pieces` are kept
 * as written, while units spelled out in specification values are given their
 * Russian form (`220–240 V` becomes `220–240 В`).
 */
export const ru: Record<string, string> = {
  // -------------------------------------------------------------------------
  // Top-level categories
  // -------------------------------------------------------------------------
  Clothing: 'Одежда',
  'Everyday and occasion wear for women, men and children.':
    'Повседневная и праздничная одежда для женщин, мужчин и детей.',
  Home: 'Дом',
  'Furniture, textiles and decor for every room.': 'Мебель, текстиль и декор для любой комнаты.',
  Kitchen: 'Кухня',
  'Cookware, tableware and countertop appliances.':
    'Посуда для готовки и сервировки, техника для столешницы.',
  Beauty: 'Красота',
  'Skincare, makeup, haircare and fragrance.':
    'Уход за кожей, макияж, уход за волосами и парфюмерия.',
  Electronics: 'Электроника',
  'Phones, audio, computers and accessories.': 'Телефоны, аудио, компьютеры и аксессуары.',
  Toys: 'Игрушки',
  'Building sets, games and plush toys for children.':
    'Конструкторы, игры и мягкие игрушки для детей.',
  Grocery: 'Продукты',
  'Pantry staples, drinks and snacks.': 'Базовые продукты, напитки и снеки.',
  Deals: 'Акции',
  'Discounted stock and money-saving bundles.': 'Товары со скидкой и выгодные наборы.',

  // -------------------------------------------------------------------------
  // Subcategories: clothing
  // -------------------------------------------------------------------------
  "Men's Clothing": 'Мужская одежда',
  'Shirts, trousers, knitwear and outerwear for men.':
    'Рубашки, брюки, трикотаж и верхняя одежда для мужчин.',
  'Cut from breathable fabric with a clean, everyday silhouette.':
    'Скроено из дышащей ткани, с чистым повседневным силуэтом.',
  'Finished with reinforced seams and a shape that survives repeat washing.':
    'Отделано усиленными швами и держит форму после множества стирок.',

  "Women's Clothing": 'Женская одежда',
  'Dresses, blouses, knitwear and denim for women.': 'Платья, блузы, трикотаж и деним для женщин.',
  'A soft drape and a considered, wearable cut.':
    'Мягкая драпировка и продуманный, носибельный крой.',
  'The fabric holds its colour after washing, and the seams are finished flat so nothing chafes.':
    'Ткань сохраняет цвет после стирки, а швы обработаны плоско, поэтому ничего не натирает.',

  "Kids' Clothing": 'Детская одежда',
  'Durable everyday clothing for children aged two to twelve.':
    'Прочная повседневная одежда для детей от двух до двенадцати лет.',
  'Built for play: soft on skin, tough at the knees.':
    'Создано для игры: мягкое к коже, прочное на коленях.',
  'Every piece is tested against repeated washing and keeps its shape and colour.':
    'Каждая вещь проверена многократной стиркой и сохраняет форму и цвет.',

  Footwear: 'Обувь',
  'Shoes and boots for the whole family.': 'Обувь и ботинки для всей семьи.',
  'Cushioned underfoot and shaped for all-day walking.':
    'Амортизация под стопой и колодка для ходьбы весь день.',
  'A stitched sole keeps the shoe together far longer than glued construction.':
    'Прошитая подошва держит обувь вместе гораздо дольше, чем клеевая.',

  // -------------------------------------------------------------------------
  // Subcategories: home
  // -------------------------------------------------------------------------
  Furniture: 'Мебель',
  'Tables, seating and storage built from solid wood.':
    'Столы, мебель для сидения и хранения из массива дерева.',
  'Solid wood joinery that gets better with age.':
    'Соединения из массива дерева, которые хорошеют со временем.',
  'Assembled with metal hardware and finished with a low-sheen lacquer that resists marks.':
    'Собрано на металлическом крепеже и покрыто матовым лаком, устойчивым к следам.',

  'Home Decor': 'Декор для дома',
  'Rugs, lighting, mirrors and small decorative pieces.':
    'Ковры, светильники, зеркала и небольшие предметы декора.',
  'Handmade pieces that give a room its character.':
    'Изделия ручной работы, которые задают комнате характер.',
  'Produced in small batches, so small variations between items are part of the finish.':
    'Выпускается малыми партиями, поэтому небольшие различия между изделиями — часть отделки.',

  Bedding: 'Постельное бельё',
  'Duvet covers, sheets, pillows and blankets.': 'Пододеяльники, простыни, подушки и одеяла.',
  'Long-staple cotton woven for a soft, breathable night.':
    'Хлопок с длинным волокном — для мягкой и дышащей ночи.',
  'OEKO-TEX certified and pre-shrunk, so the fit stays true after the first wash.':
    'Сертификат OEKO-TEX и предварительная усадка: размер не меняется после первой стирки.',

  // -------------------------------------------------------------------------
  // Subcategories: kitchen
  // -------------------------------------------------------------------------
  Cookware: 'Посуда для готовки',
  'Pans, pots and knives for daily cooking.': 'Сковороды, кастрюли и ножи для ежедневной готовки.',
  'Even heat across the base and a handle that stays cool.':
    'Равномерный нагрев по дну и ручка, которая не нагревается.',
  'Heavy-gauge construction resists warping, and the riveted handle is oven safe to 220°C.':
    'Толстостенный корпус не деформируется, а клёпаная ручка выдерживает до 220°C в духовке.',

  Tableware: 'Посуда для сервировки',
  'Dinner sets, glassware and serving pieces.':
    'Обеденные наборы, стеклянная посуда и предметы для подачи.',
  'Glazed by hand and fired for chip resistance.':
    'Глазурь нанесена вручную, обжиг делает посуду устойчивой к сколам.',
  'Safe for the dishwasher and the microwave, and stackable in a normal cupboard.':
    'Можно мыть в посудомоечной машине и ставить в микроволновку, штабелируется в обычном шкафу.',

  'Small Appliances': 'Мелкая бытовая техника',
  'Countertop appliances for everyday cooking.': 'Техника на столешницу для ежедневной готовки.',
  'Simple controls and parts that come apart for cleaning.':
    'Простые органы управления и детали, которые разбираются для мытья.',
  'Ships with a local two-pin plug and a two-year warranty handled in Tashkent.':
    'Поставляется с местной двухштырьковой вилкой и двухлетней гарантией с обслуживанием в Ташкенте.',

  // -------------------------------------------------------------------------
  // Subcategories: beauty
  // -------------------------------------------------------------------------
  Skincare: 'Уход за кожей',
  'Cleansers, serums, moisturisers and sun protection.':
    'Средства для очищения, сыворотки, увлажняющие кремы и защита от солнца.',
  'A short ingredient list with the actives high on it.':
    'Короткий состав, в котором активные компоненты стоят в начале списка.',
  'Dermatologically tested, fragrance free, and packed in airless pumps that keep the formula stable.':
    'Протестировано дерматологами, без ароматизаторов; вакуумные флаконы сохраняют формулу стабильной.',

  Makeup: 'Макияж',
  'Colour cosmetics for lips, eyes and complexion.': 'Цветная косметика для губ, глаз и тона лица.',
  'Pigment that goes on evenly and stays put through the day.':
    'Пигмент ложится ровно и держится весь день.',
  'Tested on a range of skin tones in the Tashkent studio, and never on animals.':
    'Протестировано на разных оттенках кожи в ташкентской студии и никогда — на животных.',

  Haircare: 'Уход за волосами',
  'Shampoo, conditioner, treatments and styling tools.':
    'Шампунь, кондиционер, уходовые средства и инструменты для укладки.',
  'Sulphate free and formulated for hard local water.':
    'Без сульфатов, формула рассчитана на жёсткую местную воду.',
  'Leaves the cuticle smooth, so hair dries without a heavy coating or residue.':
    'Сглаживает кутикулу, поэтому волосы высыхают без тяжёлого покрытия и остатка.',

  Fragrance: 'Парфюмерия',
  'Eau de parfum, eau de toilette and body mists.':
    'Парфюмерная вода, туалетная вода и спреи для тела.',
  'Composed in small batches with a long, warm dry-down.':
    'Создано малыми партиями: длинный, тёплый шлейф.',
  'Alcohol-based and supplied in a refillable glass bottle with a travel atomiser.':
    'На спиртовой основе, во флаконе из стекла с возможностью долива и дорожным атомайзером.',

  // -------------------------------------------------------------------------
  // Subcategories: electronics
  // -------------------------------------------------------------------------
  Smartphones: 'Смартфоны',
  'Ziyo handsets with local warranty and service.': 'Телефоны Ziyo с местной гарантией и сервисом.',
  'A bright display, a battery that lasts the day, and a clean build of Android.':
    'Яркий экран, батарея на весь день и чистый Android.',
  'Sold with a two-year local warranty and serviced at the Ziyo centre in Tashkent.':
    'Продаётся с двухлетней местной гарантией, обслуживание — в центре Ziyo в Ташкенте.',

  Audio: 'Аудио',
  'Headphones, earbuds and speakers.': 'Наушники, вкладыши и колонки.',
  'Tuned for warmth, with active noise cancelling on the flagship models.':
    'Настроены на тёплое звучание, в топовых моделях — активное шумоподавление.',
  'Pairs with two devices at once and charges over USB-C from empty in about an hour.':
    'Подключается к двум устройствам сразу и заряжается через USB-C с нуля примерно за час.',

  Laptops: 'Ноутбуки',
  'Ultrabooks and gaming laptops for work and study.':
    'Ультрабуки и игровые ноутбуки для работы и учёбы.',
  'Aluminium chassis, quiet fans, and a keyboard made for long sessions.':
    'Алюминиевый корпус, тихие вентиляторы и клавиатура для долгих сессий.',
  'Supplied with a 65 W USB-C charger, a UK/EU adapter set and a two-year local warranty.':
    'В комплекте зарядное устройство USB-C 65 Вт, набор переходников UK/EU и двухлетняя местная гарантия.',

  Accessories: 'Аксессуары',
  'Chargers, cables, power banks and sleeves.': 'Зарядные устройства, кабели, павербанки и чехлы.',
  'Certified for local mains voltage and built to survive a bag.':
    'Сертифицировано для местного напряжения и рассчитано на жизнь в сумке.',
  'Every unit is over-current protected and tested before it leaves the warehouse.':
    'Каждое устройство защищено от перегрузки по току и проверено перед отправкой со склада.',

  // -------------------------------------------------------------------------
  // Subcategories: toys
  // -------------------------------------------------------------------------
  'Building Blocks': 'Конструкторы',
  'Wooden blocks, brick sets and magnetic tiles.':
    'Деревянные кубики, наборы кирпичиков и магнитные плитки.',
  'Edges are sanded smooth and everything survives a dropped box.':
    'Края отшлифованы, и всё переживает падение коробки.',
  'Tested to EN 71 and packed in a sturdy box that doubles as storage.':
    'Протестировано по EN 71 и упаковано в прочную коробку, которая служит ещё и для хранения.',

  'Board Games': 'Настольные игры',
  'Family games, puzzles and strategy titles.': 'Семейные игры, пазлы и стратегии.',
  'Rules that a new player can learn in one sitting.':
    'Правила, которые новый игрок освоит за одну партию.',
  'Components are printed on recycled board with a linen finish that resists glare.':
    'Компоненты напечатаны на переработанном картоне с льняным покрытием, которое не бликует.',

  'Soft Toys': 'Мягкие игрушки',
  'Plush animals and comfort toys.': 'Плюшевые звери и игрушки для уюта.',
  'Stitched with reinforced seams and filled with hypoallergenic fibre.':
    'Прошиты усиленными швами и наполнены гипоаллергенным волокном.',
  'Surface washable, and every batch is pull-tested before it is boxed.':
    'Допускается поверхностная чистка, каждая партия проверяется на прочность перед упаковкой.',

  // -------------------------------------------------------------------------
  // Subcategories: grocery and deals
  // -------------------------------------------------------------------------
  Pantry: 'Бакалея',
  'Rice, oils, grains and honey.': 'Рис, масла, крупы и мёд.',
  'Bought in season from growers and packed close to harvest.':
    'Закупается в сезон у производителей и фасуется сразу после сбора урожая.',
  'Sealed in food-grade packaging with the harvest year printed on the back.':
    'Герметичная упаковка пищевого класса, год урожая указан на обратной стороне.',

  Beverages: 'Напитки',
  'Tea, coffee, juices and water.': 'Чай, кофе, соки и вода.',
  'Sourced from growers we buy from year after year.':
    'Закупается у производителей, у которых мы покупаем год за годом.',
  'Packed in light-blocking material so the aroma survives the shelf.':
    'Упаковано в светонепроницаемый материал, чтобы аромат сохранился на полке.',

  Snacks: 'Снеки',
  'Dried fruit, nuts and sweets.': 'Сухофрукты, орехи и сладости.',
  'Dried without added sugar and packed the week it is sorted.':
    'Сушится без добавленного сахара и фасуется в ту же неделю, когда отсортировано.',
  'Resealable pouches keep the fruit soft after the first opening.':
    'Пакеты с зип-застёжкой сохраняют фрукты мягкими и после вскрытия.',

  Clearance: 'Распродажа',
  'End-of-season stock at reduced prices.': 'Товары конца сезона по сниженным ценам.',
  'Last pieces from a finished season, sold well below list price.':
    'Последние экземпляры ушедшего сезона, продаются значительно ниже обычной цены.',
  'Stock is limited and not restocked, so the price only goes one way from here.':
    'Запас ограничен и не пополняется, поэтому цена отсюда может только снижаться.',

  'Bundle Deals': 'Наборы',
  'Curated sets priced below the sum of their parts.':
    'Подобранные наборы дешевле, чем сумма их составляющих.',
  'A set of things that are used together, priced as one purchase.':
    'Набор вещей, которые используются вместе, по цене одной покупки.',
  'Bundles ship in a single parcel and are covered by one warranty period.':
    'Наборы отправляются одной посылкой и покрываются одним гарантийным сроком.',

  // -------------------------------------------------------------------------
  // Product names: clothing and footwear
  // -------------------------------------------------------------------------
  "Men's Cotton Oxford Shirt": 'Мужская рубашка оксфорд из хлопка',
  "Men's Wool Blend Coat": 'Мужское пальто из смеси шерсти',
  "Men's Slim Fit Chinos": 'Мужские чиносы приталенного кроя',
  "Men's Merino Crewneck Sweater": 'Мужской свитер из мериноса с круглым вырезом',
  "Men's Leather Belt": 'Мужской кожаный ремень',
  "Women's Silk Blend Blouse": 'Женская блуза из смеси шёлка',
  "Women's Floral Summer Dress": 'Женское летнее платье с цветочным принтом',
  "Women's Cashmere Cardigan": 'Женский кардиган из кашемира',
  "Women's High-Waist Jeans": 'Женские джинсы с высокой посадкой',
  "Women's Wool Scarf": 'Женский шерстяной шарф',
  "Kids' Cotton Hoodie": 'Детское худи из хлопка',
  "Kids' Denim Overalls": 'Детский джинсовый комбинезон',
  "Kids' Winter Puffer Jacket": 'Детская зимняя куртка-пуховик',
  "Kids' Pajama Set": 'Детский пижамный комплект',
  "Kids' Graphic T-Shirt Set": 'Детский комплект футболок с принтом',
  "Men's Leather Derby Shoes": 'Мужские кожаные туфли дерби',
  "Women's Suede Ankle Boots": 'Женские замшевые ботинки',
  'Unisex Canvas Sneakers': 'Кеды унисекс из парусины',
  "Kids' Rain Boots": 'Детские резиновые сапоги',
  "Men's Running Shoes": 'Мужские кроссовки для бега',

  // -------------------------------------------------------------------------
  // Product names: home
  // -------------------------------------------------------------------------
  'Solid Oak Dining Table': 'Обеденный стол из массива дуба',
  'Walnut Bedside Cabinet': 'Прикроватная тумба из ореха',
  'Three-Seat Linen Sofa': 'Трёхместный диван из льна',
  'Walnut Bookshelf': 'Книжный стеллаж из ореха',
  'Ergonomic Study Chair': 'Эргономичное рабочее кресло',
  'Handwoven Wool Rug': 'Ковёр ручного ткачества из шерсти',
  'Ceramic Table Lamp': 'Керамический настольный светильник',
  'Framed Wall Mirror': 'Настенное зеркало в раме',
  'Cotton Cushion Cover Set': 'Комплект чехлов для подушек из хлопка',
  'Scented Soy Candle': 'Ароматическая свеча из соевого воска',
  'Egyptian Cotton Duvet Set': 'Комплект постельного белья из египетского хлопка',
  'Goose Down Pillow': 'Подушка из гусиного пуха',
  'Linen Bed Sheet Set': 'Комплект льняных простыней',
  'Weighted Blanket': 'Утяжелённое одеяло',
  'Wool Throw Blanket': 'Шерстяной плед',

  // -------------------------------------------------------------------------
  // Product names: kitchen
  // -------------------------------------------------------------------------
  'Cast Iron Dutch Oven': 'Чугунная кастрюля с крышкой',
  'Non-Stick Frying Pan Set': 'Набор сковород с антипригарным покрытием',
  'Stainless Steel Saucepan': 'Кастрюля из нержавеющей стали',
  'Carbon Steel Wok': 'Вок из углеродистой стали',
  'Kitchen Knife Block Set': 'Набор кухонных ножей с подставкой',
  'Porcelain Dinner Set (24 pieces)': 'Обеденный набор из фарфора (24 предмета)',
  'Handmade Ceramic Bowls (Set of 4)': 'Керамические пиалы ручной работы (набор из 4)',
  'Crystal Wine Glasses (Set of 6)': 'Хрустальные бокалы для вина (набор из 6)',
  'Stainless Steel Cutlery Set': 'Набор столовых приборов из нержавеющей стали',
  'Bamboo Serving Tray': 'Бамбуковый поднос',
  'Electric Kettle 1.7L': 'Электрический чайник 1.7L',
  'Stand Mixer 5L': 'Планетарный миксер 5L',
  'Air Fryer 6L': 'Аэрогриль 6L',
  'Espresso Coffee Machine': 'Кофемашина для эспрессо',
  'Blender with Glass Jar': 'Блендер со стеклянной чашей',

  // -------------------------------------------------------------------------
  // Product names: beauty
  // -------------------------------------------------------------------------
  'Vitamin C Brightening Serum': 'Сыворотка с витамином C для сияния кожи',
  'Hyaluronic Acid Day Cream': 'Дневной крем с гиалуроновой кислотой',
  'Gentle Foaming Cleanser': 'Мягкая пенка для умывания',
  'SPF 50 Sunscreen Fluid': 'Солнцезащитный флюид SPF 50',
  'Matte Liquid Lipstick': 'Матовая жидкая помада',
  'Mineral Foundation Powder': 'Минеральная пудра-основа',
  'Volumizing Mascara': 'Тушь для объёма ресниц',
  'Eyeshadow Palette (12 Shades)': 'Палетка теней для век (12 оттенков)',
  'Argan Oil Repair Shampoo': 'Шампунь с аргановым маслом для восстановления',
  'Silk Protein Conditioner': 'Кондиционер с шёлковым протеином',
  'Hair Growth Serum': 'Сыворотка для роста волос',
  'Ceramic Hair Straightener': 'Керамический утюжок для волос',
  'Amber Oud Eau de Parfum 50ml': 'Парфюмерная вода Amber Oud 50ml',
  'Rose Water Body Mist': 'Спрей для тела с розовой водой',
  'Sandalwood Eau de Toilette 100ml': 'Туалетная вода Sandalwood 100ml',

  // -------------------------------------------------------------------------
  // Product names: electronics
  // -------------------------------------------------------------------------
  'Ziyo Phone X5 128GB': 'Смартфон Ziyo Phone X5 128GB',
  'Ziyo Phone X5 Pro 256GB': 'Смартфон Ziyo Phone X5 Pro 256GB',
  'Ziyo Phone A3 64GB': 'Смартфон Ziyo Phone A3 64GB',
  'Ziyo Phone X5 Lite 128GB': 'Смартфон Ziyo Phone X5 Lite 128GB',
  'Ziyo Phone X5 256GB': 'Смартфон Ziyo Phone X5 256GB',
  'Anor Buds Pro Wireless Earbuds': 'Беспроводные наушники-вкладыши Anor Buds Pro',
  'Anor Studio Over-Ear Headphones': 'Полноразмерные наушники Anor Studio',
  'Anor Soundbar 2.1': 'Саундбар Anor Soundbar 2.1',
  'Anor Go Bluetooth Speaker': 'Портативная колонка Anor Go с Bluetooth',
  'Anor Buds Lite Earbuds': 'Наушники-вкладыши Anor Buds Lite',
  'Tashkent Tech UltraBook 14': 'Ноутбук Tashkent Tech UltraBook 14',
  'Tashkent Tech ProBook 15': 'Ноутбук Tashkent Tech ProBook 15',
  'Tashkent Tech GamingBook 16': 'Игровой ноутбук Tashkent Tech GamingBook 16',
  'Tashkent Tech ChromeBook 11': 'Ноутбук Tashkent Tech ChromeBook 11',
  'Tashkent Tech UltraBook 14 OLED': 'Ноутбук Tashkent Tech UltraBook 14 OLED',
  'Anor Fast Charger 65W': 'Быстрое зарядное устройство Anor 65W',
  'Braided USB-C Cable 2m': 'Плетёный кабель USB-C 2m',
  '20000mAh Power Bank': 'Павербанк 20000mAh',
  'Wireless Charging Pad': 'Площадка для беспроводной зарядки',
  'Laptop Sleeve 14"': 'Чехол для ноутбука 14"',

  // -------------------------------------------------------------------------
  // Product names: toys, grocery and deals
  // -------------------------------------------------------------------------
  'Wooden Building Blocks 100 Pieces': 'Деревянные кубики, 100 деталей',
  'City Builder Brick Set 850 Pieces': 'Набор кирпичиков «Город», 850 деталей',
  'Magnetic Tile Set 60 Pieces': 'Магнитные плитки, набор из 60 деталей',
  'Robot Engineer Building Kit': 'Конструктор «Робот-инженер»',
  'Uzbek Family Board Game': 'Узбекская семейная настольная игра',
  'Strategy Card Game Deluxe': 'Карточная стратегия Deluxe',
  'Wooden Chess Set': 'Деревянные шахматы',
  '1000-Piece Landscape Puzzle': 'Пазл «Пейзаж», 1000 деталей',
  'Plush Camel Toy 40cm': 'Мягкая игрушка «Верблюд» 40cm',
  'Plush Bear with Hoodie': 'Мягкий мишка в худи',
  'Handmade Felt Animal Set': 'Набор зверят из фетра ручной работы',
  'Weighted Sensory Plush Owl': 'Утяжелённая сенсорная игрушка «Сова»',
  'Uzbek Long Grain Rice 5kg': 'Узбекский рис длиннозёрный 5kg',
  'Extra Virgin Olive Oil 1L': 'Оливковое масло Extra Virgin 1L',
  'Buckwheat Groats 1kg': 'Гречневая крупа 1kg',
  'Wild Forest Honey 500g': 'Лесной мёд 500g',
  'Sunflower Oil 5L': 'Подсолнечное масло 5L',
  'Green Tea Leaves 250g': 'Зелёный чай, листовой 250g',
  'Ground Arabica Coffee 500g': 'Молотый кофе арабика 500g',
  'Pomegranate Juice 1L': 'Гранатовый сок 1L',
  'Mineral Water 1.5L (Pack of 6)': 'Минеральная вода 1.5L (упаковка из 6)',
  'Dried Apricots 500g': 'Курага 500g',
  'Walnut Kernels 500g': 'Ядра грецкого ореха 500g',
  'Assorted Halva Box 800g': 'Ассорти халвы, коробка 800g',
  'Dark Chocolate 70% Bar 100g': 'Тёмный шоколад 70%, плитка 100g',
  'Cotton Bath Towel Set (Clearance)': 'Набор хлопковых банных полотенец (распродажа)',
  'Stainless Steel Water Bottle 1L': 'Бутылка для воды из нержавеющей стали 1L',
  'Desk Organizer Bamboo': 'Бамбуковый органайзер для стола',
  'Travel Backpack 30L': 'Рюкзак для путешествий 30L',
  'Ceramic Plant Pot Trio': 'Набор из трёх керамических горшков для растений',
  'Kitchen Essentials Bundle': 'Набор «Всё для кухни»',
  'Skincare Starter Bundle': 'Стартовый набор для ухода за кожей',
  'Home Office Bundle': 'Набор для домашнего офиса',
  'Tea and Sweets Gift Bundle': 'Подарочный набор «Чай и сладости»',
  'Kids Play Bundle': 'Детский игровой набор',

  // -------------------------------------------------------------------------
  // Brands — the names stay in Latin script, the taglines are translated
  // -------------------------------------------------------------------------
  'Ziyo Wear': 'Ziyo Wear',
  'Everyday clothing made in Uzbekistan.': 'Повседневная одежда, сделанная в Узбекистане.',
  'Ziyo Home': 'Ziyo Home',
  'Furniture, textiles and kitchenware.': 'Мебель, текстиль и кухонная посуда.',
  'Anor Audio': 'Anor Audio',
  'Personal audio tuned in Tashkent.': 'Персональное аудио, настроенное в Ташкенте.',
  'Silk Road Beauty': 'Silk Road Beauty',
  'Skincare built on botanical actives.': 'Уход за кожей на основе растительных активов.',
  'Bukhara Craft': 'Bukhara Craft',
  'Handmade decor, toys and board games.': 'Декор, игрушки и настольные игры ручной работы.',
  'Tashkent Tech': 'Tashkent Tech',
  'Phones and computers with local service.': 'Телефоны и компьютеры с местным сервисом.',

  // -------------------------------------------------------------------------
  // Specification groups
  // -------------------------------------------------------------------------
  Material: 'Материал',
  Care: 'Уход',
  Upper: 'Верх',
  Sole: 'Подошва',
  Fit: 'Посадка',
  Assembly: 'Сборка',
  Delivery: 'Доставка',
  Origin: 'Происхождение',
  Use: 'Использование',
  Power: 'Питание',
  Warranty: 'Гарантия',
  Product: 'Продукт',
  Safety: 'Безопасность',
  Display: 'Экран',
  Battery: 'Батарея',
  Camera: 'Камера',
  Sound: 'Звук',
  Connectivity: 'Подключение',
  Performance: 'Производительность',
  Storage: 'Память',
  Compatibility: 'Совместимость',
  Age: 'Возраст',
  Condition: 'Состояние',
  Dimensions: 'Габариты',

  // -------------------------------------------------------------------------
  // Specification labels
  // -------------------------------------------------------------------------
  Composition: 'Состав',
  Weight: 'Вес',
  Washing: 'Стирка',
  Closure: 'Застёжка',
  Frame: 'Каркас',
  Finish: 'Отделка',
  Required: 'Требуется',
  'Weight class': 'Весовой класс',
  Primary: 'Основной',
  Cleaning: 'Чистка',
  'Made in': 'Страна производства',
  Fabric: 'Ткань',
  'Thread count': 'Плотность',
  Body: 'Корпус',
  Handle: 'Ручка',
  'Hob compatibility': 'Совместимость с плитами',
  'Microwave safe': 'Для микроволновки',
  'Dishwasher safe': 'Для посудомоечной машины',
  Voltage: 'Напряжение',
  Consumption: 'Потребляемая мощность',
  Coverage: 'Срок',
  Volume: 'Объём',
  'Skin type': 'Тип кожи',
  'Cruelty free': 'Без тестов на животных',
  'Shelf life after opening': 'Срок годности после вскрытия',
  Panel: 'Матрица',
  Capacity: 'Ёмкость',
  'Main sensor': 'Основной сенсор',
  Driver: 'Излучатель',
  Playback: 'Время работы',
  Bluetooth: 'Bluetooth',
  Memory: 'Оперативная память',
  Drive: 'Накопитель',
  Ports: 'Порты',
  Output: 'Выходная мощность',
  Recommended: 'Рекомендуемый возраст',
  Certification: 'Сертификация',
  'Net weight': 'Нетто',
  Conditions: 'Условия',
  'Country of origin': 'Страна происхождения',
  Grade: 'Категория',
  Processor: 'Процессор',
  Graphics: 'Графика',
  Length: 'Длина',
  Width: 'Ширина',
  Height: 'Высота',
  Top: 'Столешница',

  // -------------------------------------------------------------------------
  // Specification values
  // -------------------------------------------------------------------------
  '95% cotton, 5% elastane': '95% хлопок, 5% эластан',
  '220 g/m²': '220 г/м²',
  'Machine wash at 30°C': 'Машинная стирка при 30°C',
  'Machine wash at 40°C': 'Машинная стирка при 40°C',
  'Made in Uzbekistan': 'Сделано в Узбекистане',
  'Made in Turkey': 'Сделано в Турции',
  'Full-grain leather': 'Натуральная кожа',
  'Vulcanised rubber': 'Вулканизированная резина',
  'Lace-up': 'Шнуровка',
  'Kiln-dried solid wood': 'Массив дерева камерной сушки',
  'Water-based lacquer': 'Лак на водной основе',
  'Yes, tools included': 'Да, инструменты в комплекте',
  'Two-person lift': 'Подъём вдвоём',
  'Natural fibre': 'Натуральное волокно',
  'Spot clean only': 'Только локальная чистка',
  Uzbekistan: 'Узбекистан',
  '100% long-staple cotton': '100% хлопок с длинным волокном',
  '300 TC': '300 TC',
  'Cast aluminium': 'Литой алюминий',
  'Heat-resistant phenolic': 'Термостойкий фенопласт',
  'Gas, electric, induction': 'Газ, электричество, индукция',
  'Hand wash recommended': 'Рекомендуется мыть вручную',
  'Glazed porcelain': 'Глазурованный фарфор',
  Yes: 'Да',
  '220–240 V': '220–240 В',
  '1500 W': '1500 Вт',
  '24 months': '24 месяца',
  '12 months': '12 месяцев',
  China: 'Китай',
  '50 ml': '50 мл',
  'All skin types': 'Все типы кожи',
  '6.7-inch AMOLED, 120 Hz': '6,7-дюймовый AMOLED, 120 Гц',
  '5000 mAh': '5000 мА·ч',
  '50 MP with OIS': '50 Мп с OIS',
  '11 mm dynamic': 'Динамический 11 мм',
  'Up to 30 hours with case': 'До 30 часов с кейсом',
  '5.3, multipoint': '5.3, мультипоинт',
  '14-inch IPS, 1920 × 1200': '14-дюймовый IPS, 1920 × 1200',
  '15.6-inch IPS, 2560 × 1600': '15,6-дюймовый IPS, 2560 × 1600',
  '16-inch IPS, 165 Hz': '16-дюймовый IPS, 165 Гц',
  '11.6-inch IPS, 1366 × 768': '11,6-дюймовый IPS, 1366 × 768',
  '14-inch OLED, 2880 × 1800': '14-дюймовый OLED, 2880 × 1800',
  '16 GB LPDDR5': '16 ГБ LPDDR5',
  '32 GB LPDDR5': '32 ГБ LPDDR5',
  '8 GB LPDDR4': '8 ГБ LPDDR4',
  '32 GB DDR5': '32 ГБ DDR5',
  '512 GB NVMe SSD': '512 ГБ NVMe SSD',
  '1 TB NVMe SSD': '1 ТБ NVMe SSD',
  '128 GB eMMC': '128 ГБ eMMC',
  '8 GB discrete GPU': 'Дискретная графика 8 ГБ',
  '8-core, 3.4 GHz boost': '8 ядер, до 3,4 ГГц',
  '8-core, 3.6 GHz boost': '8 ядер, до 3,6 ГГц',
  '10-core, 4.1 GHz boost': '10 ядер, до 4,1 ГГц',
  'USB-C, USB-A': 'USB-C, USB-A',
  '65 W total': '65 Вт суммарно',
  '5 years and up': 'От 5 лет',
  'CE, EN 71': 'CE, EN 71',
  'FSC-certified wood': 'Древесина с сертификатом FSC',
  'See packaging': 'См. упаковку',
  'Cool, dry place': 'Сухое прохладное место',
  'New, end-of-season stock': 'Новое, остатки конца сезона',
  '180 cm': '180 см',
  '90 cm': '90 см',
  '75 cm': '75 см',
  'Solid oak, 40 mm': 'Массив дуба, 40 мм',

  // -------------------------------------------------------------------------
  // Variant presets and their values
  // -------------------------------------------------------------------------
  Size: 'Размер',
  Color: 'Цвет',
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

  // -------------------------------------------------------------------------
  // Delivery zones
  // -------------------------------------------------------------------------
  Tashkent: 'Ташкент',
  'Tashkent region': 'Ташкентская область',
  'Samarkand region': 'Самаркандская область',
  'Namangan region': 'Наманганская область',
  'Bukhara region': 'Бухарская область',
  'Rest of Uzbekistan': 'Остальной Узбекистан',
};
