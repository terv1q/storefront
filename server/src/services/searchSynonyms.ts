/**
 * What a shopper's word means, in the words the catalogue actually uses.
 *
 * The catalogue names a product once and translates it into three languages; a
 * shopper types whichever word is in their head, and it is frequently not any of
 * them. «Телефон» is nowhere in this catalogue — the product is *Смартфон Ziyo
 * Phone X5* — so a search for the ordinary word for the thing found nothing at
 * all, which is the worst answer a shop can give.
 *
 * This file is the bridge: groups of words that mean the same thing, listed in
 * the three languages the shop is read in, so a query word can be widened to
 * every way the catalogue might have spelled it.
 *
 * ## What belongs in a group
 *
 * Words a shopper would genuinely use for the same product, and nothing looser.
 * A group is a claim that these are interchangeable, and a group that is too
 * generous does not just add results, it puts wrong ones at the top of a search
 * that was already working. `soat` — the Uzbek for an hour, and a common word
 * for a watch — is deliberately absent, because this catalogue has no watches
 * and the word was matching headphones and speakers on the strength of a shared
 * syllable.
 *
 * Only words are listed, never phrases: the expansion works one query word at a
 * time, so `power bank` is two words and belongs in the group as `powerbank`
 * together with `power`.
 *
 * ## Why this is curated rather than learned
 *
 * Because there is nothing to learn from. A catalogue of a hundred and nineteen
 * products has no query log, and a synonym table derived from the product names
 * themselves would say that *Phone* and *X5* are related. This list is written
 * by hand against the catalogue's own vocabulary, and the honest note is that it
 * is the part of the search that has to be extended by hand when the catalogue
 * grows a shelf the words here do not cover.
 */

/** A group of words that name the same thing. Order does not matter. */
type Group = readonly string[];

const GROUPS: readonly Group[] = [
  // Phones. The brand words are here because a shopper says the product by the
  // name they know it by, and typing it is a search for the thing, not the brand.
  [
    'телефон',
    'телефоны',
    'смартфон',
    'смартфоны',
    'мобильный',
    'мобильник',
    'phone',
    'phones',
    'smartphone',
    'smartphones',
    'mobile',
    'iphone',
    'айфон',
    'telefon',
    'telefonlar',
    'smartfon',
    'smartfonlar',
  ],
  [
    'ноутбук',
    'ноутбуки',
    'лаптоп',
    'компьютер',
    'laptop',
    'laptops',
    'notebook',
    'ultrabook',
    'probook',
    'chromebook',
    'gamingbook',
    'noutbuk',
    'noutbuklar',
    'kompyuter',
  ],
  // Sound. Headphones and earbuds are one group because a shopper looking for
  // either is served by seeing both; a speaker is its own thing and is separate.
  [
    'наушники',
    'наушник',
    'гарнитура',
    'вкладыши',
    'headphones',
    'headphone',
    'earbuds',
    'earbud',
    'buds',
    'quloqchin',
    'naushniki',
  ],
  ['колонка', 'колонки', 'динамик', 'саундбар', 'speaker', 'speakers', 'soundbar', 'kolonka'],
  [
    'зарядка',
    'зарядное',
    'зарядное устройство',
    'charger',
    'charging',
    'powerbank',
    'пауэрбанк',
    'повербанк',
    'аккумулятор',
    'quvvatlagich',
  ],
  ['кабель', 'провод', 'шнур', 'cable', 'cables', 'usb', 'kabel'],
  ['чехол', 'сумка для ноутбука', 'sleeve', 'case', 'cover', 'chexol'],

  // Bags.
  [
    'сумка',
    'сумки',
    'рюкзак',
    'рюкзаки',
    'backpack',
    'backpacks',
    'bag',
    'bags',
    'sumka',
    'sumkalar',
    'ryukzak',
  ],

  // What is worn.
  [
    'обувь',
    'кроссовки',
    'кроссовок',
    'кеды',
    'ботинки',
    'туфли',
    'сапоги',
    'shoes',
    'shoe',
    'sneakers',
    'trainers',
    'boots',
    'krossovka',
    'tufli',
    'poyabzal',
  ],
  ['куртка', 'куртки', 'пуховик', 'пальто', 'jacket', 'coat', 'kurtka', 'palto'],
  ['платье', 'платья', 'dress', 'dresses', 'koʻylak', 'koylak'],
  ['рубашка', 'рубашки', 'футболка', 'рубаха', 'shirt', 'shirts', 'tshirt', 'rubashka', 'koʻylak'],
  [
    'свитер',
    'свитера',
    'кардиган',
    'джемпер',
    'кофта',
    'sweater',
    'sweaters',
    'cardigan',
    'jumper',
    'sviter',
  ],
  ['джинсы', 'брюки', 'штаны', 'чиносы', 'jeans', 'trousers', 'pants', 'chinos', 'shim'],
  ['шарф', 'платок', 'scarf', 'sharf', 'sharf '],
  ['ремень', 'пояс', 'belt', 'belts', 'remen'],
  ['носки', 'socks', 'sock', 'paypoq'],
  ['пижама', 'pajamas', 'pyjamas', 'pijama'],

  // The home.
  [
    'мебель',
    'стол',
    'стул',
    'шкаф',
    'кровать',
    'диван',
    'комод',
    'furniture',
    'table',
    'chair',
    'desk',
    'wardrobe',
    'sofa',
    'bed',
    'stol',
    'stul',
    'shkaf',
    'divan',
  ],
  ['лампа', 'светильник', 'торшер', 'lamp', 'light', 'chiroq'],
  ['зеркало', 'mirror', 'oyna'],
  ['ковёр', 'ковер', 'плед', 'одеяло', 'rug', 'carpet', 'blanket', 'gilam'],
  [
    'постель',
    'постельное',
    'бельё',
    'белье',
    'bedding',
    'bedlinen',
    'pillow',
    'подушка',
    'sheets',
    'towel',
    'полотенце',
    'choynak',
  ],
  [
    'посуда',
    'стакан',
    'чашка',
    'кружка',
    'тарелка',
    'glass',
    'glasses',
    'mug',
    'cup',
    'plate',
    'bowls',
    'idish',
  ],

  // The kitchen.
  [
    'кастрюля',
    'кастрюли',
    'сковорода',
    'казан',
    'pot',
    'pots',
    'pan',
    'pans',
    'cookware',
    'qozon',
    'tava',
  ],
  ['нож', 'ножи', 'knife', 'knives', 'pichoq'],
  ['чайник', 'kettle', 'choynak'],
  ['холодильник', 'холодильники', 'fridge', 'refrigerator', 'muzlatgich'],
  ['блендер', 'blender', 'миксер', 'mixer', 'blender'],
  ['фритюрница', 'аэрогриль', 'air fryer', 'airfryer', 'fryer'],

  // Drink and food.
  ['кофе', 'кофемашина', 'кофеварка', 'coffee', 'espresso', 'qahva'],
  ['чай', 'tea', 'choy'],
  ['мёд', 'мед', 'honey', 'asal'],
  ['рис', 'rice', 'guruch'],
  ['масло', 'oil', 'yog', 'масло оливковое', 'olive'],
  ['вода', 'water', 'suv'],
  ['орехи', 'орех', 'nuts', 'walnut', 'walnuts', 'грецкий', 'yongʻoq'],
  ['шоколад', 'chocolate', 'shokolad'],
  ['печенье', 'сладости', 'sweets', 'halva', 'халва', 'cookie'],

  // Beauty.
  ['крем', 'кремы', 'cream', 'creams', 'skincare', 'уход', 'krem'],
  ['шампунь', 'шампуни', 'shampoo', 'conditioner', 'кондиционер', 'shampun'],
  [
    'парфюм',
    'парфюмерия',
    'духи',
    'туалетная вода',
    'perfume',
    'fragrance',
    'parfum',
    'eau de parfum',
    'atir',
  ],
  [
    'макияж',
    'косметика',
    'makeup',
    'помада',
    'lipstick',
    'тушь',
    'mascara',
    'тени',
    'eyeshadow',
    'тон',
    'foundation',
  ],
  ['помазок', 'бритва', 'razor', 'shaving'],

  // Toys and games.
  ['игрушка', 'игрушки', 'toy', 'toys', 'oʻyinchoq', 'oyinchoq'],
  ['конструктор', 'кубики', 'blocks', 'lego', 'building', 'konstruktor'],
  [
    'игра',
    'игры',
    'настольная',
    'game',
    'games',
    'boardgame',
    'puzzle',
    'пазл',
    'шахматы',
    'chess',
    'oʻyin',
  ],
];

/**
 * The shortest a word can be and still be stemmed.
 *
 * Below this, dropping a letter stops being morphology and starts being a
 * different word: `чай` cut to `ча` is not a word, and matching it would find
 * every product whose name contains those two letters.
 */
const MIN_STEM_LENGTH = 4;

/**
 * How many letters a stemmer may drop from the end of a word.
 *
 * Two, and no more. Three was tried first and produced `теле` from «телефон»,
 * which is also the first four letters of «телевизор»: searching for a phone
 * would have offered the televisions. Morphology is worth a letter or two; past
 * that the rule stops describing the same word and starts describing the same
 * shelf.
 */
const MAX_STEM_TRIM = 2;

/**
 * A word and the shorter forms of it that are still the same word.
 *
 * A shopper writes «телефоны» or «телефона», the catalogue holds «телефон», and
 * a Russian dictionary would reduce both to one root. This does the same job
 * without a dictionary, which is the one Postgres does not have loaded for the
 * comparison the search runs: it drops up to two letters from the end, while
 * what is left is at least four letters long.
 *
 * It reaches `charg` from `charger`, which is what lets a half-typed word find
 * the group below. It does not reach `sumka` from `sumkalar`, because the Uzbek
 * plural is three letters; those plurals are written into the groups instead,
 * which is the honest way to handle a rule that is regular in a language rather
 * than a rule about word length.
 */
function stems(word: string): string[] {
  const forms = [word];

  for (let trim = 1; trim <= MAX_STEM_TRIM; trim += 1) {
    if (word.length - trim < MIN_STEM_LENGTH) {
      break;
    }

    forms.push(word.slice(0, word.length - trim));
  }

  return forms;
}

/**
 * A lookup from a word — or from a stem of one — to the group it belongs to.
 *
 * Built once at import. The first group to claim a word wins, and a word that
 * appears in two groups is a mistake in the list above rather than something to
 * resolve here — the duplicate is a sign the two groups should be one.
 *
 * Stems are indexed as well as the words themselves, because a shopper types
 * `charg` and the list holds `charger`. Without them a half-typed word would
 * find nothing at all, which is the one answer a search box gives while somebody
 * is still typing.
 */
const BY_WORD: ReadonlyMap<string, Group> = (() => {
  const index = new Map<string, Group>();

  for (const group of GROUPS) {
    for (const word of group) {
      for (const form of stems(word.toLowerCase().trim())) {
        if (!index.has(form)) {
          index.set(form, group);
        }
      }
    }
  }

  return index;
})();

/**
 * How many words of one query take part in the expansion.
 *
 * A shopper types two or three words; past six the query is a sentence, and
 * every word added multiplies the comparisons the scored query makes.
 */
export const MAX_QUERY_WORDS = 6;

/**
 * The shortest a *stemmed* form may be and still be matched.
 *
 * A stem is a guess — nothing was written down that says `charg` means
 * `charger` — so the guess has to be long enough to be worth making. `char` is
 * the far end of `charger` and also the beginning of `character`, and a whole
 * shelf of this catalogue describes itself with the same sentence, so a search
 * for a charger offered a carpet, a coat and a candle. Five letters is where that
 * stops happening here.
 *
 * A word that is written in a group below is not a guess, so it may be a letter
 * shorter — see {@link MIN_LISTED_LENGTH}.
 */
export const MIN_ALTERNATIVE_LENGTH = 5;

/**
 * The shortest listed word that may be matched, and why it is four and not three.
 *
 * A match is a word opening, so a three-letter word opens every word that begins
 * with it: `pan` opened `pantry`, and «кастрюля» — a saucepan — offered rice,
 * honey and sunflower oil, because all of them are described as things for the
 * pantry. Four letters is short enough for the words that need it («духи»,
 * `atir`, `shoe`) and long enough that this stops.
 */
export const MIN_LISTED_LENGTH = 4;

/**
 * Whether this word is in the list below, rather than a form derived from one.
 *
 * The distinction the search draws between a word somebody wrote down and a word
 * a rule produced. The listed words are matched at {@link MIN_LISTED_LENGTH} and
 * up; derived forms have to reach {@link MIN_ALTERNATIVE_LENGTH}.
 */
export function isListedWord(word: string): boolean {
  return BY_WORD.has(word.toLowerCase().trim());
}

/** How many alternatives of one word are tried. A bound on the query's size. */
export const MAX_ALTERNATIVES = 20;

/**
 * Every word the catalogue might have used for this one.
 *
 * The result always contains the shopper's own word, so an expansion can only
 * ever widen a search and never replace what was asked for. The group is added
 * when the word or one of its stems is in it.
 */
export function alternativeWords(word: string): string[] {
  const normalized = word.toLowerCase().trim();

  if (normalized.length === 0) {
    return [];
  }

  const alternatives = new Set(stems(normalized));

  for (const stem of alternatives) {
    const group = BY_WORD.get(stem);

    if (group === undefined) {
      continue;
    }

    for (const member of group) {
      for (const form of stems(member.toLowerCase())) {
        alternatives.add(form);
      }
    }
  }

  return [...alternatives];
}

/** How many groups the list holds, for the note in the search service. */
export const SYNONYM_GROUP_COUNT = GROUPS.length;
