/**
 * Uzbek (Latin) catalogue text, keyed by the English source string.
 *
 * Keys are the English strings exactly as `seed-data.ts` writes them — the seed
 * looks a translation up by the string it is about to write, so a key that has
 * drifted by one character is a missing translation and the seed stops.
 *
 * Why key by the English source instead of by a slug or an id? Because the seed
 * data already is a set of English literals, and a literal is the one handle
 * that needs no maintenance of its own: there is no id to mint, no numbering to
 * keep in step with a reordering of `CATEGORIES`, and no second file to consult
 * when a new product is added. A translator reads the English, writes the Uzbek
 * under the same key, and the pair is complete. The cost is that the English
 * text becomes a load-bearing identifier — renaming "Men's Cotton Oxford Shirt"
 * in the source silently orphans its translation — so the seed treats a missing
 * key as a hard failure rather than falling back to English. A locale that
 * partially renders is worse than one that refuses to seed: it ships half-Uzbek
 * pages that nobody notices until a customer does. When the seed encounters an
 * English string with no entry here, it throws, and the fix is always the same:
 * add the key.
 *
 * The table is also flat on purpose. Many English strings repeat across the
 * catalogue — `Material` is both a spec group and a spec label, `Yes` is the
 * value of three different safety rows, `Size` names three variant presets, and
 * `Storage` names a preset and a spec group — and because all of them resolve to
 * the same key, they collapse into a single entry by construction. Translating
 * `Material` once is therefore translating it everywhere, and there is no way to
 * accidentally give two identical English strings two different Uzbek readings.
 * Where a shared string wants a different nuance in its two contexts, the source
 * strings are what must diverge, not this table.
 *
 * A note on the Uzbek itself: this is Latin-script Uzbek, which spells the
 * sound in "Oʻzbekiston" with the modifier letter ʻ (U+02BB), not the ASCII
 * apostrophe or the right single quotation mark. The same letter appears in
 * oʻlcham, koʻylak, yongʻoq and hundreds of other words below. It is a distinct
 * character, so it must not be normalised away: a translation containing a plain
 * ' instead of ʻ is a typo, not a variant spelling.
 */
export const uz: Record<string, string> = {
  // -------------------------------------------------------------------------
  // Top-level categories
  // -------------------------------------------------------------------------
  Clothing: 'Kiyim-kechak',
  'Everyday and occasion wear for women, men and children.':
    'Ayollar, erkaklar va bolalar uchun kundalik va bayram kiyimlari.',
  Home: 'Uy',
  'Furniture, textiles and decor for every room.':
    'Har bir xona uchun mebel, toʻqimachilik va bezak buyumlari.',
  Kitchen: 'Oshxona',
  'Cookware, tableware and countertop appliances.':
    'Pishirish idishlari, dasturxon buyumlari va stol usti texnikasi.',
  Beauty: 'Goʻzallik',
  'Skincare, makeup, haircare and fragrance.':
    'Teri parvarishi, makiyaj, soch parvarishi va atirlar.',
  Electronics: 'Elektronika',
  'Phones, audio, computers and accessories.': 'Telefonlar, audio, kompyuterlar va aksessuarlar.',
  Toys: 'Oʻyinchoqlar',
  'Building sets, games and plush toys for children.':
    'Bolalar uchun konstruktorlar, oʻyinlar va yumshoq oʻyinchoqlar.',
  Grocery: 'Oziq-ovqat',
  'Pantry staples, drinks and snacks.': 'Asosiy oziq-ovqat mahsulotlari, ichimliklar va gazaklar.',
  Deals: 'Chegirmalar',
  'Discounted stock and money-saving bundles.': 'Chegirmadagi tovarlar va tejamkor toʻplamlar.',

  // -------------------------------------------------------------------------
  // Subcategories
  // -------------------------------------------------------------------------
  "Men's Clothing": 'Erkaklar kiyimi',
  'Shirts, trousers, knitwear and outerwear for men.':
    'Erkaklar uchun koʻylaklar, shimlar, trikotaj va ustki kiyimlar.',
  'Cut from breathable fabric with a clean, everyday silhouette.':
    'Nafas oladigan matodan tikilgan, sodda va kundalik bichim.',
  'Finished with reinforced seams and a shape that survives repeat washing.':
    'Choklari mustahkamlangan, shakli koʻp marta yuvishdan keyin ham saqlanadi.',

  "Women's Clothing": 'Ayollar kiyimi',
  'Dresses, blouses, knitwear and denim for women.':
    'Ayollar uchun koʻylaklar, bluzkalar, trikotaj va jinsi kiyimlar.',
  'A soft drape and a considered, wearable cut.':
    'Yumshoq tushadigan mato va puxta oʻylangan, kiyishga qulay bichim.',
  'The fabric holds its colour after washing, and the seams are finished flat so nothing chafes.':
    'Mato yuvgandan keyin ham rangini saqlaydi, choklar tekis ishlangan, shuning uchun hech narsa ishqalanmaydi.',

  "Kids' Clothing": 'Bolalar kiyimi',
  'Durable everyday clothing for children aged two to twelve.':
    'Ikki yoshdan oʻn ikki yoshgacha bolalar uchun mustahkam kundalik kiyim.',
  'Built for play: soft on skin, tough at the knees.':
    'Oʻyin uchun tikilgan: teriga yumshoq, tizzada mustahkam.',
  'Every piece is tested against repeated washing and keeps its shape and colour.':
    'Har bir buyum koʻp marta yuvishga sinovdan oʻtgan va shakli hamda rangini saqlaydi.',

  Footwear: 'Poyabzal',
  'Shoes and boots for the whole family.': 'Butun oila uchun tufli va etiklar.',
  'Cushioned underfoot and shaped for all-day walking.':
    'Tagi yumshoq, kun boʻyi yurishga mos shaklda.',
  'A stitched sole keeps the shoe together far longer than glued construction.':
    'Tikilgan tag tuflini yopishtirilganidan ancha uzoq saqlaydi.',

  Furniture: 'Mebel',
  'Tables, seating and storage built from solid wood.':
    'Yogʻochdan yasalgan stollar, oʻrindiqlar va saqlash joylari.',
  'Solid wood joinery that gets better with age.':
    'Yillar oʻtgani sayin chiroyliroq boʻladigan tabiiy yogʻoch birikmalari.',
  'Assembled with metal hardware and finished with a low-sheen lacquer that resists marks.':
    'Metall furnitura bilan yigʻilgan va iz qoldirmaydigan yarim yaltiroq lak bilan ishlangan.',

  'Home Decor': 'Uy bezaklari',
  'Rugs, lighting, mirrors and small decorative pieces.':
    'Gilamlar, yoritqichlar, koʻzgular va kichik bezak buyumlari.',
  'Handmade pieces that give a room its character.':
    'Xonaga oʻziga xos kayfiyat beruvchi qoʻlda yasalgan buyumlar.',
  'Produced in small batches, so small variations between items are part of the finish.':
    'Kichik partiyalarda ishlab chiqariladi, shuning uchun buyumlar orasidagi mayda farqlar tabiiy hisoblanadi.',

  Bedding: 'Choyshab',
  'Duvet covers, sheets, pillows and blankets.':
    'Koʻrpa jildlari, choyshablar, yostiqlar va adyollar.',
  'Long-staple cotton woven for a soft, breathable night.':
    'Yumshoq va nafas oladigan tun uchun uzun tolali paxtadan toʻqilgan.',
  'OEKO-TEX certified and pre-shrunk, so the fit stays true after the first wash.':
    'OEKO-TEX sertifikatiga ega va oldindan tortib olingan, shuning uchun birinchi yuvishdan keyin ham oʻlchami oʻzgarmaydi.',

  Cookware: 'Pishirish idishlari',
  'Pans, pots and knives for daily cooking.':
    'Har kungi pishirish uchun tovalar, qozonlar va pichoqlar.',
  'Even heat across the base and a handle that stays cool.':
    'Tagi boʻylab bir tekis qiziydi, dastasi esa qizimaydi.',
  'Heavy-gauge construction resists warping, and the riveted handle is oven safe to 220°C.':
    'Qalin devorli korpus deformatsiyaga chidamli, parchinlangan dastasi 220°C gacha pechda ishlatishga yaroqli.',

  Tableware: 'Dasturxon buyumlari',
  'Dinner sets, glassware and serving pieces.':
    'Ovqat toʻplamlari, shisha idishlar va tortish uchun idishlar.',
  'Glazed by hand and fired for chip resistance.':
    'Qoʻlda sirlangan va parchalanishga chidamli qilib pishirilgan.',
  'Safe for the dishwasher and the microwave, and stackable in a normal cupboard.':
    'Idish yuvish mashinasi va mikrotoʻlqinli pechda xavfsiz, oddiy javonda ustma-ust qoʻyiladi.',

  'Small Appliances': 'Kichik maishiy texnika',
  'Countertop appliances for everyday cooking.': 'Har kungi pishirish uchun stol usti texnikasi.',
  'Simple controls and parts that come apart for cleaning.':
    'Oddiy boshqaruv va tozalash uchun ajraladigan qismlar.',
  'Ships with a local two-pin plug and a two-year warranty handled in Tashkent.':
    'Mahalliy ikki tishli vilka va Toshkentda xizmat koʻrsatiladigan ikki yillik kafolat bilan yetkaziladi.',

  Skincare: 'Teri parvarishi',
  'Cleansers, serums, moisturisers and sun protection.':
    'Tozalagichlar, serumlar, namlagichlar va quyoshdan himoya vositalari.',
  'A short ingredient list with the actives high on it.':
    'Qisqa tarkib, faol moddalar esa roʻyxatning boshida.',
  'Dermatologically tested, fragrance free, and packed in airless pumps that keep the formula stable.':
    'Dermatologik sinovdan oʻtgan, xushboʻy hidsiz va formulasini barqaror saqlaydigan havosiz dispenserlarda.',

  Makeup: 'Makiyaj',
  'Colour cosmetics for lips, eyes and complexion.': 'Lab, koʻz va yuz uchun rangli kosmetika.',
  'Pigment that goes on evenly and stays put through the day.':
    'Bir tekis surtiladigan va kun boʻyi turuvchi pigment.',
  'Tested on a range of skin tones in the Tashkent studio, and never on animals.':
    'Toshkent studiyasida turli teri ranglarida sinovdan oʻtkazilgan, hayvonlarda esa hech qachon.',

  Haircare: 'Soch parvarishi',
  'Shampoo, conditioner, treatments and styling tools.':
    'Shampunlar, konditsionerlar, parvarish vositalari va shakl berish asboblari.',
  'Sulphate free and formulated for hard local water.':
    'Sulfatsiz va mahalliy qattiq suv uchun ishlab chiqilgan.',
  'Leaves the cuticle smooth, so hair dries without a heavy coating or residue.':
    'Soch qatlamini silliq qoldiradi, shuning uchun soch ogʻir qoplama va qoldiqsiz quriydi.',

  Fragrance: 'Atirlar',
  'Eau de parfum, eau de toilette and body mists.': 'Parfyum suvi, tualet suvi va tana spraylari.',
  'Composed in small batches with a long, warm dry-down.':
    'Kichik partiyalarda tuzilgan, hidi uzoq va iliq ochiladi.',
  'Alcohol-based and supplied in a refillable glass bottle with a travel atomiser.':
    'Spirt asosida, qayta toʻldiriladigan shisha idishda va sayohat atomayzeri bilan beriladi.',

  Smartphones: 'Smartfonlar',
  'Ziyo handsets with local warranty and service.':
    'Mahalliy kafolat va xizmatga ega Ziyo telefonlari.',
  'A bright display, a battery that lasts the day, and a clean build of Android.':
    'Yorqin ekran, kun boʻyi yetadigan batareya va toza Android tizimi.',
  'Sold with a two-year local warranty and serviced at the Ziyo centre in Tashkent.':
    'Ikki yillik mahalliy kafolat bilan sotiladi va Toshkentdagi Ziyo markazida xizmat koʻrsatiladi.',

  Audio: 'Audio',
  'Headphones, earbuds and speakers.': 'Quloqchinlar, simsiz quloqchinlar va dinamiklar.',
  'Tuned for warmth, with active noise cancelling on the flagship models.':
    'Iliq ovoz uchun sozlangan, flagman modellarda faol shovqin bostirish bor.',
  'Pairs with two devices at once and charges over USB-C from empty in about an hour.':
    'Bir vaqtda ikkita qurilmaga ulanadi va USB-C orqali boʻsh holatdan taxminan bir soatda quvvatlanadi.',

  Laptops: 'Noutbuklar',
  'Ultrabooks and gaming laptops for work and study.':
    'Ish va oʻqish uchun ultrabuklar va oʻyin noutbuklari.',
  'Aluminium chassis, quiet fans, and a keyboard made for long sessions.':
    'Alyuminiy korpus, shovqinsiz ventilyatorlar va uzoq ishlashga moʻljallangan klaviatura.',
  'Supplied with a 65 W USB-C charger, a UK/EU adapter set and a two-year local warranty.':
    '65 W USB-C quvvatlagich, UK/EU adapterlar toʻplami va ikki yillik mahalliy kafolat bilan beriladi.',

  Accessories: 'Aksessuarlar',
  'Chargers, cables, power banks and sleeves.':
    'Quvvatlagichlar, kabellar, quvvat banklari va gʻiloflar.',
  'Certified for local mains voltage and built to survive a bag.':
    'Mahalliy tarmoq kuchlanishiga sertifikatlangan va sumkada yurishga chidamli.',
  'Every unit is over-current protected and tested before it leaves the warehouse.':
    'Har bir qurilma ortiqcha tokdan himoyalangan va ombordan chiqishdan oldin sinovdan oʻtadi.',

  'Building Blocks': 'Konstruktorlar',
  'Wooden blocks, brick sets and magnetic tiles.':
    'Yogʻoch kublar, gʻishtcha toʻplamlari va magnitli plitkalar.',
  'Edges are sanded smooth and everything survives a dropped box.':
    'Qirralari silliqlangan, toʻplam yerga tushsa ham buzilmaydi.',
  'Tested to EN 71 and packed in a sturdy box that doubles as storage.':
    'EN 71 standartida sinovdan oʻtgan va saqlash uchun ham xizmat qiladigan mustahkam qutida.',

  'Board Games': 'Stol oʻyinlari',
  'Family games, puzzles and strategy titles.':
    'Oilaviy oʻyinlar, boshqotirmalar va strategiyalar.',
  'Rules that a new player can learn in one sitting.':
    'Yangi oʻyinchi bir oʻtirishda oʻrgana oladigan qoidalar.',
  'Components are printed on recycled board with a linen finish that resists glare.':
    'Qismlar qayta ishlangan karton ustiga chop etilgan, yaltiramaydigan zigʻir qoplama bilan.',

  'Soft Toys': 'Yumshoq oʻyinchoqlar',
  'Plush animals and comfort toys.': 'Yumshoq hayvonchalar va taskin beruvchi oʻyinchoqlar.',
  'Stitched with reinforced seams and filled with hypoallergenic fibre.':
    'Choklari mustahkamlangan holda tikilgan va gipoallergen tolalar bilan toʻldirilgan.',
  'Surface washable, and every batch is pull-tested before it is boxed.':
    'Yuzasini yuvish mumkin, har bir partiya qadoqlashdan oldin tortish sinovidan oʻtadi.',

  Pantry: 'Oziq-ovqat zaxirasi',
  'Rice, oils, grains and honey.': 'Guruch, moylar, donlar va asal.',
  'Bought in season from growers and packed close to harvest.':
    'Mavsumida dehqonlardan olinadi va hosildan koʻp oʻtmay qadoqlanadi.',
  'Sealed in food-grade packaging with the harvest year printed on the back.':
    'Oziq-ovqat uchun moʻljallangan qadoqda yopiladi, orqa tomonida hosil yili yozilgan.',

  Beverages: 'Ichimliklar',
  'Tea, coffee, juices and water.': 'Choy, kofe, sharbatlar va suv.',
  'Sourced from growers we buy from year after year.':
    'Yildan yilga xarid qiladigan dehqonlarimizdan olinadi.',
  'Packed in light-blocking material so the aroma survives the shelf.':
    'Yorugʻlik oʻtkazmaydigan materialda qadoqlangan, shuning uchun xushboʻy hidi saqlanadi.',

  Snacks: 'Gazaklar',
  'Dried fruit, nuts and sweets.': 'Quritilgan mevalar, yongʻoqlar va shirinliklar.',
  'Dried without added sugar and packed the week it is sorted.':
    'Shakar qoʻshmasdan quritiladi va saralangan haftasida qadoqlanadi.',
  'Resealable pouches keep the fruit soft after the first opening.':
    'Qayta yopiladigan paketlar birinchi ochilgandan keyin ham mevani yumshoq saqlaydi.',

  Clearance: 'Chegirma savdosi',
  'End-of-season stock at reduced prices.': 'Mavsum oxiridagi tovarlar arzon narxlarda.',
  'Last pieces from a finished season, sold well below list price.':
    'Tugagan mavsumning oxirgi buyumlari, narxlar roʻyxatidan ancha past narxda.',
  'Stock is limited and not restocked, so the price only goes one way from here.':
    'Tovar cheklangan va qayta keltirilmaydi, shuning uchun narx bundan faqat pastga tushadi.',

  'Bundle Deals': 'Toʻplam takliflari',
  'Curated sets priced below the sum of their parts.':
    'Alohida narxlar yigʻindisidan arzon qilib tanlangan toʻplamlar.',
  'A set of things that are used together, priced as one purchase.':
    'Birga ishlatiladigan buyumlar toʻplami, bitta xarid sifatida narxlangan.',
  'Bundles ship in a single parcel and are covered by one warranty period.':
    'Toʻplamlar bitta posilkada yuboriladi va bitta kafolat muddati bilan qoplanadi.',

  // -------------------------------------------------------------------------
  // Brands — names stay in Latin script unchanged, taglines are translated
  // -------------------------------------------------------------------------
  'Ziyo Wear': 'Ziyo Wear',
  'Everyday clothing made in Uzbekistan.': 'Oʻzbekistonda ishlab chiqarilgan kundalik kiyimlar.',
  'Ziyo Home': 'Ziyo Home',
  'Furniture, textiles and kitchenware.': 'Mebel, toʻqimachilik va oshxona buyumlari.',
  'Anor Audio': 'Anor Audio',
  'Personal audio tuned in Tashkent.': 'Toshkentda sozlangan shaxsiy audio.',
  'Silk Road Beauty': 'Silk Road Beauty',
  'Skincare built on botanical actives.': 'Oʻsimlik faol moddalariga asoslangan teri parvarishi.',
  'Bukhara Craft': 'Bukhara Craft',
  'Handmade decor, toys and board games.':
    'Qoʻlda yasalgan bezaklar, oʻyinchoqlar va stol oʻyinlari.',
  'Tashkent Tech': 'Tashkent Tech',
  'Phones and computers with local service.': 'Mahalliy xizmatga ega telefonlar va kompyuterlar.',

  // -------------------------------------------------------------------------
  // Variant presets — names and values
  // -------------------------------------------------------------------------
  Size: 'Oʻlcham',
  Color: 'Rang',
  Finish: 'Qoplama',
  Capacity: 'Sigʻimi',
  Storage: 'Xotira',
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
  King: 'King',
  '3 L': '3 L',
  '5 L': '5 L',
  '128 GB': '128 GB',
  '256 GB': '256 GB',

  // -------------------------------------------------------------------------
  // Specification groups
  // -------------------------------------------------------------------------
  Material: 'Material',
  Care: 'Parvarish',
  Upper: 'Yuqori qism',
  Sole: 'Tag',
  Fit: 'Kiyilishi',
  Assembly: 'Yigʻish',
  Delivery: 'Yetkazib berish',
  Origin: 'Kelib chiqishi',
  Use: 'Ishlatish',
  Power: 'Quvvat',
  Warranty: 'Kafolat',
  Product: 'Mahsulot',
  Safety: 'Xavfsizlik',
  Display: 'Ekran',
  Battery: 'Batareya',
  Camera: 'Kamera',
  Sound: 'Ovoz',
  Connectivity: 'Ulanish',
  Performance: 'Unumdorlik',
  Compatibility: 'Moslik',
  Age: 'Yosh',
  Condition: 'Holati',
  Dimensions: 'Oʻlchamlari',

  // -------------------------------------------------------------------------
  // Specification labels
  // -------------------------------------------------------------------------
  Composition: 'Tarkibi',
  Weight: 'Vazni',
  Washing: 'Yuvish',
  Frame: 'Karkas',
  Required: 'Talab qilinadi',
  'Weight class': 'Ogʻirlik toifasi',
  Primary: 'Asosiy',
  Cleaning: 'Tozalash',
  'Made in': 'Ishlab chiqarilgan joy',
  Fabric: 'Mato',
  'Thread count': 'Ip zichligi',
  Body: 'Korpus',
  Handle: 'Dasta',
  'Hob compatibility': 'Plita bilan mosligi',
  'Microwave safe': 'Mikrotoʻlqinli pechda ishlatish',
  'Dishwasher safe': 'Idish yuvish mashinasida yuvish',
  Voltage: 'Kuchlanish',
  Consumption: 'Quvvat sarfi',
  Coverage: 'Muddati',
  Volume: 'Hajmi',
  'Skin type': 'Teri turi',
  'Cruelty free': 'Hayvonlarda sinovdan oʻtkazilmagan',
  'Shelf life after opening': 'Ochilgandan keyin saqlash muddati',
  Panel: 'Panel',
  'Main sensor': 'Asosiy sensor',
  Driver: 'Dinamik',
  Playback: 'Ijro vaqti',
  Bluetooth: 'Bluetooth',
  Processor: 'Protsessor',
  Memory: 'Operativ xotira',
  Drive: 'Disk',
  Ports: 'Portlar',
  Output: 'Chiqish quvvati',
  Recommended: 'Tavsiya etiladi',
  Certification: 'Sertifikat',
  'Net weight': 'Sof vazni',
  Conditions: 'Sharoitlari',
  'Country of origin': 'Ishlab chiqarilgan davlat',
  Grade: 'Sinfi',
  Length: 'Uzunligi',
  Width: 'Kengligi',
  Height: 'Balandligi',
  Top: 'Usti',
  Closure: 'Bogʻlanish',
  Graphics: 'Grafika',

  // -------------------------------------------------------------------------
  // Specification values
  // -------------------------------------------------------------------------
  '95% cotton, 5% elastane': '95% paxta, 5% elastan',
  '220 g/m²': '220 g/m²',
  'Machine wash at 30°C': '30°C da mashinada yuviladi',
  'Machine wash at 40°C': '40°C da mashinada yuviladi',
  'Made in Uzbekistan': 'Oʻzbekistonda ishlab chiqarilgan',
  'Full-grain leather': 'Tabiiy charm',
  'Vulcanised rubber': 'Vulkanizatsiya qilingan kauchuk',
  'Lace-up': 'Bogʻichli',
  'Made in Turkey': 'Turkiyada ishlab chiqarilgan',
  'Kiln-dried solid wood': 'Pechda quritilgan tabiiy yogʻoch',
  'Water-based lacquer': 'Suv asosidagi lak',
  'Yes, tools included': 'Ha, asboblar qoʻshilgan',
  'Two-person lift': 'Ikki kishi koʻtaradi',
  'Natural fibre': 'Tabiiy tola',
  'Spot clean only': 'Faqat dogʻini tozalash',
  Uzbekistan: 'Oʻzbekiston',
  '100% long-staple cotton': '100% uzun tolali paxta',
  '300 TC': '300 TC',
  'Cast aluminium': 'Quyma alyuminiy',
  'Heat-resistant phenolic': 'Issiqqa chidamli fenol',
  'Gas, electric, induction': 'Gaz, elektr, induksiya',
  'Hand wash recommended': 'Qoʻlda yuvish tavsiya etiladi',
  'Glazed porcelain': 'Sirlangan chinni',
  Yes: 'Ha',
  '220–240 V': '220–240 V',
  '1500 W': '1500 W',
  '24 months': '24 oy',
  '12 months': '12 oy',
  China: 'Xitoy',
  '50 ml': '50 ml',
  'All skin types': 'Barcha teri turlari uchun',
  '6.7-inch AMOLED, 120 Hz': '6.7 dyuymli AMOLED, 120 Hz',
  '5000 mAh': '5000 mAh',
  '50 MP with OIS': 'OIS bilan 50 MP',
  '11 mm dynamic': '11 mm dinamik',
  'Up to 30 hours with case': 'Keys bilan 30 soatgacha',
  '5.3, multipoint': '5.3, koʻp qurilmali ulanish',
  '14-inch IPS, 1920 × 1200': '14 dyuymli IPS, 1920 × 1200',
  '16 GB LPDDR5': '16 GB LPDDR5',
  '512 GB NVMe SSD': '512 GB NVMe SSD',
  'USB-C, USB-A': 'USB-C, USB-A',
  '65 W total': 'Jami 65 W',
  '5 years and up': '5 yoshdan yuqori',
  'CE, EN 71': 'CE, EN 71',
  'FSC-certified wood': 'FSC sertifikatiga ega yogʻoch',
  'See packaging': 'Qadoqqa qarang',
  'Cool, dry place': 'Salqin, quruq joy',
  'New, end-of-season stock': 'Yangi, mavsum oxiri tovari',

  // Inline specs: Solid Oak Dining Table
  '180 cm': '180 cm',
  '90 cm': '90 cm',
  '75 cm': '75 cm',
  'Solid oak, 40 mm': 'Tabiiy eman, 40 mm',

  // Inline specs: laptops
  '8-core, 3.4 GHz boost': '8 yadroli, 3.4 GHz gacha',
  '15.6-inch IPS, 2560 × 1600': '15.6 dyuymli IPS, 2560 × 1600',
  '10-core, 4.1 GHz boost': '10 yadroli, 4.1 GHz gacha',
  '32 GB LPDDR5': '32 GB LPDDR5',
  '1 TB NVMe SSD': '1 TB NVMe SSD',
  '16-inch IPS, 165 Hz': '16 dyuymli IPS, 165 Hz',
  '8 GB discrete GPU': '8 GB diskret GPU',
  '32 GB DDR5': '32 GB DDR5',
  '11.6-inch IPS, 1366 × 768': '11.6 dyuymli IPS, 1366 × 768',
  '8 GB LPDDR4': '8 GB LPDDR4',
  '128 GB eMMC': '128 GB eMMC',
  '14-inch OLED, 2880 × 1800': '14 dyuymli OLED, 2880 × 1800',
  '8-core, 3.6 GHz boost': '8 yadroli, 3.6 GHz gacha',

  // -------------------------------------------------------------------------
  // Products — men's clothing
  // -------------------------------------------------------------------------
  "Men's Cotton Oxford Shirt": 'Erkaklar paxta oksford koʻylagi',
  "Men's Wool Blend Coat": 'Erkaklar jun aralashmali paltosi',
  "Men's Slim Fit Chinos": 'Erkaklar tor bichim chinos shimi',
  "Men's Merino Crewneck Sweater": 'Erkaklar merinos sviteri',
  "Men's Leather Belt": 'Erkaklar charm kamari',

  // Women's clothing
  "Women's Silk Blend Blouse": 'Ayollar shoyi aralashmali bluzkasi',
  "Women's Floral Summer Dress": 'Ayollar gulli yozgi koʻylagi',
  "Women's Cashmere Cardigan": 'Ayollar kashmir kardigani',
  "Women's High-Waist Jeans": 'Ayollar baland bel jinsi shimi',
  "Women's Wool Scarf": 'Ayollar jun sharfi',

  // Kids' clothing
  "Kids' Cotton Hoodie": 'Bolalar paxta xudi',
  "Kids' Denim Overalls": 'Bolalar jinsi kombinezoni',
  "Kids' Winter Puffer Jacket": 'Bolalar qishki kurtkasi',
  "Kids' Pajama Set": 'Bolalar pijama toʻplami',
  "Kids' Graphic T-Shirt Set": 'Bolalar chizma futbolka toʻplami',

  // Footwear
  "Men's Leather Derby Shoes": 'Erkaklar charm derbi tuflisi',
  "Women's Suede Ankle Boots": 'Ayollar zamsh etigi',
  'Unisex Canvas Sneakers': 'Uniseks kanvas krossovkalari',
  "Kids' Rain Boots": 'Bolalar yomgʻir etigi',
  "Men's Running Shoes": 'Erkaklar yugurish krossovkalari',

  // Furniture
  'Solid Oak Dining Table': 'Tabiiy eman ovqat stoli',
  'Walnut Bedside Cabinet': 'Yongʻoq karavot yonidagi tumba',
  'Three-Seat Linen Sofa': 'Uch oʻrinli zigʻir divan',
  'Walnut Bookshelf': 'Yongʻoq kitob javoni',
  'Ergonomic Study Chair': 'Ergonomik ish stuli',

  // Home decor
  'Handwoven Wool Rug': 'Qoʻlda toʻqilgan jun gilam',
  'Ceramic Table Lamp': 'Keramika stol chirogʻi',
  'Framed Wall Mirror': 'Ramkali devor koʻzgusi',
  'Cotton Cushion Cover Set': 'Paxta yostiqcha jildlari toʻplami',
  'Scented Soy Candle': 'Xushboʻy soya sham',

  // Bedding
  'Egyptian Cotton Duvet Set': 'Misr paxtasidan koʻrpa jildi toʻplami',
  'Goose Down Pillow': 'Gʻoz patli yostiq',
  'Linen Bed Sheet Set': 'Zigʻir choyshab toʻplami',
  'Weighted Blanket': 'Vaznli adyol',
  'Wool Throw Blanket': 'Jun yengil adyol',

  // Cookware
  'Cast Iron Dutch Oven': 'Choʻyan qozon',
  'Non-Stick Frying Pan Set': 'Yopishmaydigan tova toʻplami',
  'Stainless Steel Saucepan': 'Zanglamaydigan poʻlat kastrulka',
  'Carbon Steel Wok': 'Uglerod poʻlatli vok',
  'Kitchen Knife Block Set': 'Oshxona pichoqlari toʻplami',

  // Tableware
  'Porcelain Dinner Set (24 pieces)': 'Chinni ovqat toʻplami (24 dona)',
  'Handmade Ceramic Bowls (Set of 4)': 'Qoʻlda yasalgan keramik kosalar (4 dona)',
  'Crystal Wine Glasses (Set of 6)': 'Kristall vino qadahlari (6 dona)',
  'Stainless Steel Cutlery Set': 'Zanglamaydigan poʻlat asboblar toʻplami',
  'Bamboo Serving Tray': 'Bambuk tortish patnisi',

  // Small appliances
  'Electric Kettle 1.7L': 'Elektr choynak 1.7L',
  'Stand Mixer 5L': 'Stendli mikser 5L',
  'Air Fryer 6L': 'Havoli fritür 6L',
  'Espresso Coffee Machine': 'Espresso kofe mashinasi',
  'Blender with Glass Jar': 'Shisha idishli blender',

  // Skincare
  'Vitamin C Brightening Serum': 'C vitamini yorqinlashtiruvchi serum',
  'Hyaluronic Acid Day Cream': 'Gialuron kislotali kunduzgi krem',
  'Gentle Foaming Cleanser': 'Yumshoq koʻpikli tozalagich',
  'SPF 50 Sunscreen Fluid': 'SPF 50 quyoshdan himoya suyuqligi',

  // Makeup
  'Matte Liquid Lipstick': 'Mat suyuq lab boʻyogʻi',
  'Mineral Foundation Powder': 'Mineral tonal kukun',
  'Volumizing Mascara': 'Hajm beruvchi maskara',
  'Eyeshadow Palette (12 Shades)': 'Koʻz soyalari palitrasi (12 rang)',

  // Haircare
  'Argan Oil Repair Shampoo': 'Argan moyli tiklovchi shampun',
  'Silk Protein Conditioner': 'Ipak oqsilli konditsioner',
  'Hair Growth Serum': 'Soch oʻsishini tezlashtiruvchi serum',
  'Ceramic Hair Straightener': 'Keramik soch toʻgʻrilagich',

  // Fragrance
  'Amber Oud Eau de Parfum 50ml': 'Amber Ud parfyum suvi 50ml',
  'Rose Water Body Mist': 'Atirgul suvli tana sprayi',
  'Sandalwood Eau de Toilette 100ml': 'Sandal daraxti tualet suvi 100ml',

  // Smartphones
  'Ziyo Phone X5 128GB': 'Ziyo Phone X5 128GB smartfoni',
  'Ziyo Phone X5 Pro 256GB': 'Ziyo Phone X5 Pro 256GB smartfoni',
  'Ziyo Phone A3 64GB': 'Ziyo Phone A3 64GB smartfoni',
  'Ziyo Phone X5 Lite 128GB': 'Ziyo Phone X5 Lite 128GB smartfoni',
  'Ziyo Phone X5 256GB': 'Ziyo Phone X5 256GB smartfoni',

  // Audio
  'Anor Buds Pro Wireless Earbuds': 'Anor Buds Pro simsiz quloqchinlari',
  'Anor Studio Over-Ear Headphones': 'Anor Studio quloqqa taqiladigan quloqchinlari',
  'Anor Soundbar 2.1': 'Anor Soundbar 2.1',
  'Anor Go Bluetooth Speaker': 'Anor Go Bluetooth dinamiki',
  'Anor Buds Lite Earbuds': 'Anor Buds Lite quloqchinlari',

  // Laptops
  'Tashkent Tech UltraBook 14': 'Tashkent Tech UltraBook 14 noutbuki',
  'Tashkent Tech ProBook 15': 'Tashkent Tech ProBook 15 noutbuki',
  'Tashkent Tech GamingBook 16': 'Tashkent Tech GamingBook 16 noutbuki',
  'Tashkent Tech ChromeBook 11': 'Tashkent Tech ChromeBook 11 noutbuki',
  'Tashkent Tech UltraBook 14 OLED': 'Tashkent Tech UltraBook 14 OLED noutbuki',

  // Electronics accessories
  'Anor Fast Charger 65W': 'Anor tez quvvatlagich 65W',
  'Braided USB-C Cable 2m': 'Toʻqilgan USB-C kabel 2m',
  '20000mAh Power Bank': '20000mAh quvvat banki',
  'Wireless Charging Pad': 'Simsiz quvvatlash paneli',
  'Laptop Sleeve 14"': 'Noutbuk gʻilofi 14"',

  // Building blocks
  'Wooden Building Blocks 100 Pieces': 'Yogʻoch konstruktor 100 dona',
  'City Builder Brick Set 850 Pieces': 'Shahar quruvchi gʻishtcha toʻplami 850 dona',
  'Magnetic Tile Set 60 Pieces': 'Magnitli plitkalar toʻplami 60 dona',
  'Robot Engineer Building Kit': 'Robot konstruktor toʻplami',

  // Board games
  'Uzbek Family Board Game': 'Oʻzbek oilaviy stol oʻyini',
  'Strategy Card Game Deluxe': 'Strategik karta oʻyini Deluxe',
  'Wooden Chess Set': 'Yogʻoch shaxmat toʻplami',
  '1000-Piece Landscape Puzzle': '1000 qismli manzara boshqotirmasi',

  // Soft toys
  'Plush Camel Toy 40cm': 'Yumshoq tuya oʻyinchoq 40cm',
  'Plush Bear with Hoodie': 'Kapyushonli yumshoq ayiqcha',
  'Handmade Felt Animal Set': 'Qoʻlda yasalgan kigiz hayvonchalar toʻplami',
  'Weighted Sensory Plush Owl': 'Vaznli sezgir yumshoq boyqush',

  // Pantry
  'Uzbek Long Grain Rice 5kg': 'Oʻzbek uzun donli guruch 5kg',
  'Extra Virgin Olive Oil 1L': 'Extra Virgin zaytun moyi 1L',
  'Buckwheat Groats 1kg': 'Grechka yormasi 1kg',
  'Wild Forest Honey 500g': 'Yovvoyi oʻrmon asali 500g',
  'Sunflower Oil 5L': 'Kungaboqar moyi 5L',

  // Beverages
  'Green Tea Leaves 250g': 'Koʻk choy barglari 250g',
  'Ground Arabica Coffee 500g': 'Maydalangan Arabika kofesi 500g',
  'Pomegranate Juice 1L': 'Anor sharbati 1L',
  'Mineral Water 1.5L (Pack of 6)': 'Mineral suv 1.5L (6 dona)',

  // Snacks
  'Dried Apricots 500g': 'Quritilgan oʻrik 500g',
  'Walnut Kernels 500g': 'Yongʻoq magʻzi 500g',
  'Assorted Halva Box 800g': 'Assorti holva qutisi 800g',
  'Dark Chocolate 70% Bar 100g': 'Qora shokolad 70% batonchasi 100g',

  // Clearance
  'Cotton Bath Towel Set (Clearance)': 'Paxta hammom sochiqlari toʻplami (chegirma)',
  'Stainless Steel Water Bottle 1L': 'Zanglamaydigan poʻlat suv idishi 1L',
  'Desk Organizer Bamboo': 'Bambuk stol tashkilotchisi',
  'Travel Backpack 30L': 'Sayohat ryukzagi 30L',
  'Ceramic Plant Pot Trio': 'Uchta keramika guldon toʻplami',

  // Bundle deals
  'Kitchen Essentials Bundle': 'Oshxona asosiy buyumlari toʻplami',
  'Skincare Starter Bundle': 'Teri parvarishi boshlangʻich toʻplami',
  'Home Office Bundle': 'Uydagi ish joyi toʻplami',
  'Tea and Sweets Gift Bundle': 'Choy va shirinliklar sovgʻa toʻplami',
  'Kids Play Bundle': 'Bolalar oʻyin toʻplami',

  // -------------------------------------------------------------------------
  // Delivery zones
  // -------------------------------------------------------------------------
  Tashkent: 'Toshkent',
  'Tashkent region': 'Toshkent viloyati',
  'Samarkand region': 'Samarqand viloyati',
  'Namangan region': 'Namangan viloyati',
  'Bukhara region': 'Buxoro viloyati',
  'Rest of Uzbekistan': 'Oʻzbekistonning qolgan hududi',
};
