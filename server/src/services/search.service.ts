/**
 * Search.
 *
 * Two questions are answered here: which products match a term, best match
 * first, and what the search box should suggest while the term is being typed.
 *
 * ## What a query is matched against
 *
 * Everything a product says about itself, in every language the catalogue
 * carries. The name, the short description, the description and the spec sheet
 * are searched in English, Russian and Uzbek at once, together with the brand
 * name and the category name. A shopper searching in Russian finds a product
 * whose Uzbek description is the one that mentions the term, because there is no
 * reason for the language of the query to decide what exists.
 *
 * ## How a match is scored
 *
 * Eight signals, combined with `GREATEST`, so a product takes its best reason to
 * be here rather than an average of reasons that cancels out:
 *
 *   1. the term appears verbatim inside a name, in any language (1.0)
 *   2. the name as a whole is trigram-similar to the term (0.4–1.0)
 *   3. the term is close to a whole word of the name or short description (0–0.9)
 *   4. a word of the name is within a small edit distance of the term (0–0.85,
 *      proportional to how few edits separate the two)
 *   5. the full text matches the term as a stemmed query, per language (0–0.85)
 *   6. the term appears only in the description or on the spec sheet (0–0.7)
 *   7. a Latin query against Cyrillic text (0–0.8)
 *   8. every word of the query is present, in the words the shopper chose or in
 *      another word for the same thing (0.9 when all of them are, less as they
 *      fall away)
 *
 * Signals 2 to 4 are what tolerate a typo, and they exist in that order because
 * each covers a case the one before it misses:
 *
 *   - `similarity` compares two whole strings. A misspelling of a long product
 *     name scores well; a misspelling of one short word inside a long name does
 *     not, because the rest of the name dilutes the shared trigrams.
 *   - `strict_word_similarity` compares the term against the closest single word
 *     of the name, which is what makes `shirt` find *Men's Cotton Oxford Shirt*.
 *   - `damerau_levenshtein` counts single-character edits against the closest
 *     word, and is the only one of the three that recognises `shrit` as `shirt`.
 *     Trigrams are close to useless at that length: a transposition in a
 *     five-letter word destroys most of its trigrams, so `shrit` and `shampoo`
 *     score the same.
 *
 * Signal 5 is what makes «рубашки» find «рубашка», because the Russian
 * dictionary reduces both to the same root. Signal 6 is why a term that only
 * ever appears on the spec sheet — `induction`, `LPDDR5` — still finds the
 * product. Signal 7 handles the shopper who types Latin on a Cyrillic keyboard
 * layout or transliterates by habit.
 *
 * Signal 8 is the one that answers what a shopper meant rather than what they
 * typed, and it is the one that was missing. Signals 1 to 7 all compare the
 * query against the product's own words; a catalogue writes a product down once,
 * and the shopper writes it down however they say it. «Телефон» is nowhere in
 * this catalogue — the product is *Смартфон Ziyo Phone X5* — so the ordinary
 * word for the thing returned nothing at all. This signal widens each query word
 * through `searchSynonyms`, a hand-written list of the words this catalogue's
 * goods go by in English, Russian and Uzbek, stems each of them, and then asks
 * how much of the query the product explains. All of it is a strong match; most
 * of it is a weak one; none of it is no match, and the product stays out.
 *
 * It is weighted below 1.0 deliberately, so that a product whose own name holds
 * the shopper's own word still outranks one that merely means the same thing.
 *
 * One restriction applies to short queries, and it is the second thing that was
 * wrong. Signals 2 to 7 compare strings for closeness, which is the wrong
 * question to ask of four letters: `ear` is close to `bear`, which is how a
 * plush toy answered a search for earbuds, and «часы» shares a root with
 * «часов», which is how headphones answered a search for a watch. Below
 * `SHORT_TERM_LENGTH` a term is therefore only compared where it opens a word.
 * A word grows at the end, so nothing real is lost: `ear` still finds *Earbuds*,
 * and «часы» now finds nothing, which is the truth — this catalogue has no
 * watches in it.
 *
 * Every fuzzy signal carries a floor, and the floor is the whole point. A
 * trigram comparison between a short term and an unrelated long string is never
 * zero: it returns some small number, the same small number for most of the
 * catalogue. Without a floor, that noise floors every product at the same score,
 * the real match stops standing out, and a typo search returns the catalogue in
 * rating order. With a floor, a weak signal is discarded rather than allowed to
 * vote.
 *
 * Anything scoring at or above `MATCH_THRESHOLD` is a match. That threshold is
 * low on purpose — the cost of a weak match the shopper scrolls past is lower
 * than the cost of a real match that never appears.
 *
 * Ordering is fully determined — score, then rating, then id — so the same query
 * always returns the same page in the same order.
 *
 * ## Filters
 *
 * A search may be narrowed the way a category listing can: by brand, price,
 * rating, stock, sale, and variant attributes. The score decides which products
 * match, and the filters decide which of those survive, so the two are applied in
 * that order. The filters themselves are not written here — the matched ids are
 * handed to the same `where` builder the catalog uses, because a second
 * description of what "on sale" means, written in SQL beside the scored query, is
 * a second description that will disagree with the first.
 *
 * ## Indexes
 *
 * Migrations install trigram indexes on the name columns and one GIN full-text
 * index per language. The scored query below filters on a computed score, which
 * no index can serve, so at the catalogue's current size it is a scan over an
 * active-product set that fits in a page of memory. The indexes are there for
 * the day that stops being true; the honest description of today is that this
 * query is fast because the catalogue is small, not because it is indexed.
 */

import { Prisma } from '@prisma/client';

import { prisma } from '../database/index.js';
import type { Paginated } from '../types/api.js';
import { LOCALE_SUFFIX, type CatalogLocale } from '../utils/locale.js';
import {
  listProductFacets,
  listProducts,
  listProductsByIds,
  selectProductIdsInOrder,
  type ProductFacets,
  type ProductFilterQuery,
  type ProductListQuery,
  type ProductSort,
  type ProductSummary,
} from './product.service.js';
import {
  alternativeWords,
  isListedWord,
  MAX_ALTERNATIVES,
  MAX_QUERY_WORDS,
  MIN_ALTERNATIVE_LENGTH,
  MIN_LISTED_LENGTH,
} from './searchSynonyms.js';

/**
 * A one-character term matches most of the catalog and tells the shopper
 * nothing, so anything shorter than this is answered without touching the
 * database.
 */
export const MIN_SEARCH_LENGTH = 2;

export const MAX_SUGGESTIONS = 8;

/**
 * The score a product has to reach to be a match. Low, because the two errors
 * are not equally bad: a weak result the shopper ignores costs nothing, a real
 * result that never appears costs the sale.
 */
const MATCH_THRESHOLD = 0.35;

/**
 * The length below which a query is only compared against word openings.
 *
 * A short string is a substring and a near-trigram of too much: the fuzzy signals
 * cannot tell a real match from an accident, and on this catalogue they did not.
 * See `shortTermGuard`. Five letters is a word — `charger`, `рубашк`, `куртка` —
 * and a word can be compared as one.
 */
const SHORT_TERM_LENGTH = 5;

/**
 * What the word signal awards when every word of the query was found, over the
 * product's name and over everything it says about itself.
 *
 * The first is just below a verbatim name match, so a product whose name holds
 * the shopper's own word still comes first. The second is below the first, so a
 * product named for the thing beats one that only mentions it: searching for a
 * bag returned a power bank above the backpack, because the power bank's
 * description says it fits in one.
 */
const NAME_COVERAGE_SCORE = 0.9;
const DESCRIPTION_COVERAGE_SCORE = 0.85;

/**
 * The floors below which a fuzzy signal is discarded rather than scored.
 *
 * Each number is a level an unrelated string does not reach in practice, measured
 * on this catalogue: `shirt` against *Argan Oil Repair Shampoo* peaks at 0.33,
 * and against a description at 0.55. A floor slightly above the noise is what
 * lets a real match stand out instead of tying with two hundred products that
 * share its noise.
 */
const NAME_SIMILARITY_FLOOR = 0.4;
const WORD_SIMILARITY_FLOOR = 0.6;
const DESCRIPTION_SIMILARITY_FLOOR = 0.5;
const SPEC_SIMILARITY_FLOOR = 0.6;

/** How the eight suggestions are shared out when all three kinds match. */
const SUGGESTION_PRODUCT_LIMIT = 4;
const SUGGESTION_BRAND_LIMIT = 2;
const SUGGESTION_CATEGORY_LIMIT = 2;

/** The score a suggestion has to reach. Slightly stricter than a result page. */
const SUGGESTION_THRESHOLD = 0.35;

export type SearchInput = {
  q?: string | undefined;
  sort?: ProductSort | undefined;
  page: number;
  limit: number;
  lang: CatalogLocale;
} & SearchFilters;

/**
 * What a search may be narrowed to, which is everything the catalog may be
 * narrowed to.
 *
 * The term is not here: it is what the ranked query matches on, while these are
 * what survives it. Keeping them apart is what lets one `where` describe a brand,
 * a price range, or a stock state for both a category listing and a search.
 */
export type SearchFilters = Omit<ProductListQuery, 'q' | 'ids' | 'sort' | 'page' | 'limit'>;

/**
 * How many matches the scored query will hand back to the filters.
 *
 * The ranked query orders by a computed score, which no index can serve, so it
 * reads the whole active set either way; taking the matches in one go is what
 * lets the filters — brand, price, rating, stock, sale, attributes — run through
 * the same `where` builder the catalog uses instead of a second copy of their
 * meaning written in SQL. The bound is what keeps that from being unbounded work
 * on a large catalog: past it, the weakest matches are the ones not offered. This
 * catalog holds a hundred and nineteen products, so the honest note is that the
 * limit cannot be reached today.
 */
const MAX_MATCHES = 1000;

/** The filters a search was given, without the term or the paging. */
function filtersOf(input: SearchInput): SearchFilters {
  return {
    category: input.category,
    brand: input.brand,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    minRating: input.minRating,
    inStock: input.inStock,
    onSale: input.onSale,
    attr: input.attr,
  };
}

/**
 * The same filters as the facets endpoint takes them, which is without the
 * attributes.
 *
 * A facet computed with its own selection applied would show every value the
 * shopper has not chosen as zero, so the attributes are not part of the question
 * the counts answer. The listing's facets endpoint draws the same line.
 */
function facetFiltersOf(input: SearchInput): ProductFilterQuery {
  return {
    category: input.category,
    brand: input.brand,
    minPrice: input.minPrice,
    maxPrice: input.maxPrice,
    minRating: input.minRating,
    inStock: input.inStock,
    onSale: input.onSale,
  };
}

export type SuggestionKind = 'product' | 'brand' | 'category';

export type Suggestion = {
  type: SuggestionKind;
  /** What the dropdown shows, in the requested language. */
  label: string;
  /** The slug the client turns into a link. */
  slug: string;
  /** A thumbnail for a product, a logo for a brand, artwork for a category. */
  imageUrl: string | null;
  /**
   * Price in minor units. Products only: a brand and a category have no single
   * price, and `null` is the honest answer for them rather than a zero that
   * would render as a free item.
   */
  price?: number | null;
  /** The price the product is reduced from, when it is on sale. */
  compareAtPrice?: number | null;
  /** The currency the two prices are in. */
  currency?: string;
};

type RankedRow = {
  id: string;
};

type NameRow = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  logoUrl: string | null;
};

/** Trimmed term, or the empty string when nothing usable was given. */
function normalizeTerm(term: string | undefined): string {
  return term?.trim() ?? '';
}

function isSearchable(term: string): boolean {
  return term.length >= MIN_SEARCH_LENGTH;
}

/**
 * How many edits a word of a name is allowed to be away from the term before the
 * comparison stops being evidence of anything.
 *
 * One edit per four characters, never fewer than one. The ratio is what keeps a
 * five-letter term from matching a different five-letter word two edits away —
 * `shirt` against `sheet` — while still reading `snekers` and `rubashka` as what
 * they were meant to be. A fixed budget of two would call the first pair a match
 * and the noise would return.
 *
 * A transposition is the case that needs care. `levenshtein` counts swapping two
 * adjacent characters as two edits, so at a budget of one it refuses `shrit` —
 * the one misspelling this signal exists for. Postgres ships
 * `damerau_levenshtein`, which counts a swap as a single edit, but not in every
 * build of `fuzzystrmatch`; comparing the word against the term's swap variants
 * gets the same answer out of the plain distance. Without it the two costs are
 * indistinguishable, and `shrit` scores the same as two unrelated letters:
 * `shirt` against `sheet`.
 */
function editBudget(term: string): number {
  return Math.max(1, Math.floor(term.length / 4));
}

/**
 * The term, and every string one adjacent swap away from it.
 *
 * `length(term)` strings where a Damerau-Levenshtein function would need one
 * comparison; a shopper types a handful of characters, so this is a handful of
 * extra comparisons per word.
 */
function swapVariants(term: string): Prisma.Sql {
  const lowered = term.toLowerCase();
  const variants = [lowered];

  for (let index = 0; index + 1 < lowered.length; index += 1) {
    variants.push(
      lowered.slice(0, index) + lowered[index + 1] + lowered[index] + lowered.slice(index + 2),
    );
  }

  return Prisma.join(variants);
}

/**
 * The term as every comparison sees it: unaccented, so «oʻzbek» and `ozbek` are
 * one search, and `café` finds `cafe`.
 *
 * Only `unaccent` is applied here, not `lower()`. Every comparison below is
 * either case-insensitive by definition (`ILIKE`), lowercases its own input
 * (`similarity`, `plainto_tsquery`), or compares against a column that was
 * stored through the same folding.
 */
function fold(value: string): Prisma.Sql {
  return Prisma.sql`ziyo_unaccent(${value})`;
}

/** A column, coalesced to the empty string so `NULL` never poisons a score. */
function column(name: string): Prisma.Sql {
  return Prisma.sql`ziyo_unaccent(coalesce(${Prisma.raw(`p."${name}"`)}, ''))`;
}

/**
 * How many letters may follow a matched word and still be the same word.
 *
 * A word is matched at its opening, because that is where a word is allowed to
 * grow: «рубашка» becomes «рубашки», «зарядка» becomes «зарядное», `charge`
 * becomes `charger`. The letters after the opening are an ending, and an ending
 * is short — three letters covers the Russian and Uzbek ones this catalogue
 * needs (`-ов`, `-ые`, `-lar`, `-ing`) and stops at the compounds. Unbounded,
 * `pan` reaches `pantry`, and a search for a saucepan offers rice; bounded, it
 * reaches `pans` and stops.
 */
const MAX_ENDING_LENGTH = 3;

/**
 * The pattern a word is matched by: the folded word at the start of a word, an
 * ending of at most a few letters, and then the end of that word.
 *
 * The boundary on both sides is what makes it a word match rather than a
 * substring one. `char` is not a substring of `character` in this pattern and
 * does not match it; the surrounding classes are written in terms of
 * `[[:alnum:]]`, which this database's collation applies to Cyrillic as well as
 * Latin, so the same expression works for all three languages the shop is read
 * in. That was checked against the live database rather than assumed.
 */
function wordPattern(word: string): Prisma.Sql {
  const ending = `[[:alnum:]]{0,${MAX_ENDING_LENGTH}}([^[:alnum:]]|$)`;

  return Prisma.sql`('(^|[^[:alnum:]])' || ${fold(word)} || ${ending})`;
}

/** Whether the value contains this word at the start of a word. */
function startsWord(value: Prisma.Sql, word: string): Prisma.Sql {
  return Prisma.sql`${value} ~* ${wordPattern(word)}`;
}

function emptyPage(page: number, limit: number): Paginated<ProductSummary> {
  return { items: [], total: 0, page, pageSize: limit, totalPages: 0 };
}

/**
 * Latin written as Cyrillic, for a shopper who transliterates by habit.
 *
 * The digraphs are replaced first and in order, because `sh` has to become one
 * letter before `s` and `h` are looked at individually. The single letters then
 * go through `translate`, which is a character-by-character map: it cannot
 * handle a digraph, which is exactly why the digraphs are already gone. `c` maps
 * to `к` and not to `ц` because `ц` is nearly always written `ts`, which the
 * digraph pass has already taken.
 */
function transliterate(value: Prisma.Sql): Prisma.Sql {
  return Prisma.sql`translate(
    replace(replace(replace(replace(replace(replace(replace(replace(
      ${value},
      'sh', 'ш'), 'ch', 'ч'), 'zh', 'ж'), 'ts', 'ц'), 'ya', 'я'), 'yu', 'ю'), 'yo', 'ё'), 'kh', 'х'),
    'abvgdezijklmnoprstufhcywq',
    'абвгдезийклмнопрстуфхкывк'
  )`;
}

/**
 * Every spec value, label and group of a product, in all three languages, as one
 * blob of text. A lateral join rather than a subquery in the score expression so
 * the concatenation happens once per product instead of once per signal.
 */
const SPEC_TEXT = Prisma.sql`(
  SELECT string_agg(
    coalesce(s."group", '') || ' ' || coalesce(s."groupRu", '') || ' ' || coalesce(s."groupUz", '') || ' ' ||
    coalesce(s."label", '') || ' ' || coalesce(s."labelRu", '') || ' ' || coalesce(s."labelUz", '') || ' ' ||
    coalesce(s."value", '') || ' ' || coalesce(s."valueRu", '') || ' ' || coalesce(s."valueUz", ''),
    ' '
  )
  FROM "ProductSpec" s
  WHERE s."productId" = p."id"
)`;

/**
 * What a product *is*, as one string: its names, its brand and its category, in
 * all three languages.
 *
 * The first of the two texts the word signal reads, and the one that counts for
 * more. A word found here is found in the product's own name — in the words the
 * catalogue would write the product down with — so it is the closest thing the
 * search has to a shopper naming the thing they want.
 */
const IDENTITY_TEXT = Prisma.sql`ziyo_unaccent(
  coalesce(p."name", '') || ' ' || coalesce(p."nameRu", '') || ' ' || coalesce(p."nameUz", '') || ' ' ||
  coalesce(b."name", '') || ' ' || coalesce(b."nameRu", '') || ' ' || coalesce(b."nameUz", '') || ' ' ||
  coalesce(c."name", '') || ' ' || coalesce(c."nameRu", '') || ' ' || coalesce(c."nameUz", '')
)`;

/**
 * What a product says about itself, as one string: everything above, and its
 * short descriptions too.
 *
 * The second text, and the one that counts for less. A short description is
 * prose about the product rather than a name for it, and prose mentions things:
 * a power bank's description explains that it fits in a bag, so searching for a
 * bag found a power bank and ranked it first, above the backpack whose name is
 * the word. A word here is a real match and a weaker one, which is what the two
 * levels are for.
 *
 * It still stops short of the long description and the spec sheet, where a term
 * is more often a part number or a sentence than a name, and where reading it
 * for a common word would match almost everything.
 */
const ABOUT_TEXT = Prisma.sql`ziyo_unaccent(
  coalesce(p."name", '') || ' ' || coalesce(p."nameRu", '') || ' ' || coalesce(p."nameUz", '') || ' ' ||
  coalesce(p."shortDescription", '') || ' ' || coalesce(p."shortDescriptionRu", '') || ' ' || coalesce(p."shortDescriptionUz", '') || ' ' ||
  coalesce(b."name", '') || ' ' || coalesce(b."nameRu", '') || ' ' || coalesce(b."nameUz", '') || ' ' ||
  coalesce(c."name", '') || ' ' || coalesce(c."nameRu", '') || ' ' || coalesce(c."nameUz", '')
)`;

/**
 * The meaningful words of a query, each already widened to every word this
 * catalogue might have used for it.
 *
 * A word is dropped when it is too short to be one (`MIN_SEARCH_LENGTH`), when it
 * has no alternative long enough to be worth matching at the front of a word
 * (`MIN_ALTERNATIVE_LENGTH`), or when the query simply has more words than the
 * signal will pay for (`MAX_QUERY_WORDS`). Numbers survive — `14` is part of the
 * product's name and a real thing to search for.
 *
 * The split is on everything that is not a letter or a digit in any script, so
 * «наушники, 2 шт» is three words and the comma does not become one of them.
 */
function queryWords(term: string): string[][] {
  return term
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length >= MIN_SEARCH_LENGTH)
    .slice(0, MAX_QUERY_WORDS)
    .map((word) =>
      alternativeWords(word)
        .filter(
          (alternative) =>
            alternative.length >= MIN_ALTERNATIVE_LENGTH ||
            (alternative.length >= MIN_LISTED_LENGTH && isListedWord(alternative)),
        )
        .slice(0, MAX_ALTERNATIVES),
    )
    .filter((alternatives) => alternatives.length > 0);
}

/**
 * How much of the query the product explains, as a score.
 *
 * Every word is asked its own yes-or-no question — does any of the words it could
 * have been, in any of the languages, open a word in this text — and the answers
 * are counted. The caller runs it twice, over the two texts above, and takes the
 * better answer: a word found in the product's name is worth more than the same
 * word found in a sentence about it.
 *
 * The comparison is a word prefix, with a short ending, and not a substring. That
 * is a restriction that took a real failure to find. A substring test let `char` —
 * the far end of the stems of `charger` — match `character`, and `character` is in
 * the boilerplate that a whole shelf of handmade homeware shares. A search for a
 * charger offered a carpet, a coat and a candle.
 *
 * All of them is a strong match: just below a verbatim name match, so a product
 * that says the shopper's own word still wins, and well above the match
 * threshold, so the answer is offered. Some of them is a weak match, scaled by
 * the share that landed, which is what keeps a three-word query with two words
 * answered from being thrown away. One of them is nothing: a single word out of
 * several is what an unrelated product will have by accident.
 *
 * The floor of two is what makes this a signal rather than a way of returning the
 * catalogue. A one-word query never reaches the scaled branch — its `covered` can
 * only be 1 or 0 — so a single word either explains the product or does not,
 * which is exactly the question a one-word query asks.
 */
function coverageSignal(
  words: readonly (readonly string[])[],
  text: Prisma.Sql,
  weight: number,
): Prisma.Sql {
  // A query with no widenable word — a single letter, or a word that is not in
  // the list — has nothing to ask. Answering zero rather than building an empty
  // `CASE` keeps the score expression a valid expression for every term, which
  // is what lets the same one be interpolated into the select and the filter.
  if (words.length === 0) {
    return Prisma.sql`0.0`;
  }

  const covered = Prisma.join(
    words.map((alternatives) => {
      const tests = alternatives.map((alternative) => startsWord(text, alternative));

      return Prisma.sql`CASE WHEN (${Prisma.join(tests, ' OR ')}) THEN 1 ELSE 0 END`;
    }),
    ' + ',
  );

  const total = words.length;
  const partial = weight * 0.6;

  return Prisma.sql`CASE
    WHEN (${covered}) = ${total} THEN ${weight}
    WHEN (${covered}) >= 2 THEN ${partial} * ((${covered})::float8 / ${total}::float8)
    ELSE 0.0
  END`;
}

/**
 * The score of a product against a folded term.
 *
 * `p`, `b`, `c` and `spec` have to be in scope where this is interpolated: the
 * product, its brand, its category, and the lateral join above.
 */
function scoreExpression(term: string): Prisma.Sql {
  const foldedTerm = fold(term);
  const namePattern = Prisma.sql`'%' || ${foldedTerm} || '%'`;

  // The full text of a product in one language, in the order the signals weigh
  // it: a term in the name matters more than the same term in the description,
  // so the name-only document and the whole document are separate queries.
  const nameDocument = (config: string, name: string, short: string): Prisma.Sql =>
    Prisma.sql`to_tsvector(${Prisma.raw(`'${config}'`)}, ziyo_unaccent(coalesce(${Prisma.raw(`p."${name}"`)}, '') || ' ' || coalesce(${Prisma.raw(`p."${short}"`)}, '')))`;

  const wholeDocument = (
    config: string,
    name: string,
    short: string,
    description: string,
  ): Prisma.Sql =>
    Prisma.sql`to_tsvector(${Prisma.raw(`'${config}'`)}, ziyo_unaccent(coalesce(${Prisma.raw(`p."${name}"`)}, '') || ' ' || coalesce(${Prisma.raw(`p."${short}"`)}, '') || ' ' || coalesce(${Prisma.raw(`p."${description}"`)}, '') || ' ' || coalesce(b."name", '') || ' ' || coalesce(b."nameRu", '') || ' ' || coalesce(b."nameUz", '') || ' ' || coalesce(c."name", '') || ' ' || coalesce(c."nameRu", '') || ' ' || coalesce(c."nameUz", '') || ' ' || ${SPEC_TEXT}))`;

  const query = (config: string): Prisma.Sql =>
    Prisma.sql`plainto_tsquery(${Prisma.raw(`'${config}'`)}, ${foldedTerm})`;

  const nameQuery = Prisma.sql`(${nameDocument('english', 'name', 'shortDescription')} @@ ${query('english')}
    OR ${nameDocument('russian', 'nameRu', 'shortDescriptionRu')} @@ ${query('russian')}
    OR ${nameDocument('simple', 'nameUz', 'shortDescriptionUz')} @@ ${query('simple')})`;

  const wholeQuery = Prisma.sql`(${wholeDocument('english', 'name', 'shortDescription', 'description')} @@ ${query('english')}
    OR ${wholeDocument('russian', 'nameRu', 'shortDescriptionRu', 'descriptionRu')} @@ ${query('russian')}
    OR ${wholeDocument('simple', 'nameUz', 'shortDescriptionUz', 'descriptionUz')} @@ ${query('simple')})`;

  const cyrillic = transliterate(foldedTerm);
  const cyrillicPattern = Prisma.sql`'%' || ${cyrillic} || '%'`;

  const specText = Prisma.sql`ziyo_unaccent(coalesce(${SPEC_TEXT}, ''))`;

  /**
   * Does the term open a word where the product says who it is, and anywhere it
   * talks about itself at all?
   *
   * The guard for a short query, in two scopes. A short term reaching a fuzzy
   * comparison is asking a question four letters cannot answer: `ear` is close to
   * `bear`, and a plush toy answered a search for earbuds; «часы» shares a root
   * with «часов», and headphones answered a search for a watch because their
   * spec sheet promises thirty hours of playing time. Below `SHORT_TERM_LENGTH`
   * a term is compared only where it opens a word.
   *
   * Two scopes because the signals look at two places. Signals about the name —
   * a verbatim appearance, the name's own similarity, the word it is closest to —
   * are held to a word opening in a *name*, so a term that only opens a word in a
   * paragraph cannot be what made the name match. The signals that read the whole
   * document — the stemmed query and the description — are held to an opening
   * anywhere, because that is where they read.
   *
   * Nothing is lost from the long queries, which is why the guard is only built
   * when the term is short: the regexes cost something, and a term of six letters
   * has enough of itself to compare.
   */
  const shortTermNameGuard =
    term.length >= SHORT_TERM_LENGTH
      ? Prisma.sql`1.0`
      : Prisma.sql`(CASE WHEN ${startsWord(column('name'), term)}
            OR ${startsWord(column('nameRu'), term)}
            OR ${startsWord(column('nameUz'), term)} THEN 1.0 ELSE 0.0 END)`;

  const shortTermAnywhereGuard =
    term.length >= SHORT_TERM_LENGTH
      ? Prisma.sql`1.0`
      : Prisma.sql`(CASE WHEN ${startsWord(column('name'), term)}
            OR ${startsWord(column('nameRu'), term)}
            OR ${startsWord(column('nameUz'), term)}
            OR ${startsWord(column('description'), term)}
            OR ${startsWord(column('descriptionRu'), term)}
            OR ${startsWord(column('descriptionUz'), term)}
            OR ${startsWord(specText, term)} THEN 1.0 ELSE 0.0 END)`;

  return Prisma.sql`GREATEST(
    -- 1. the term appears verbatim in a name, in any language. A long term is a
    --    substring of the name; a short one has to open a word of it, or a search
    --    for the three letters of earbuds would keep finding the plush bear.
    (CASE WHEN ${column('name')} ILIKE ${namePattern}
          OR ${column('nameRu')} ILIKE ${namePattern}
          OR ${column('nameUz')} ILIKE ${namePattern}
         THEN 1.0 ELSE 0.0 END) * ${shortTermNameGuard},
    -- 2. the name as a whole is close to the term. Floored: an unrelated name
    --    still scores something, and that something is what has to be dropped.
    CASE WHEN GREATEST(
      similarity(${column('name')}, ${foldedTerm}),
      similarity(${column('nameRu')}, ${foldedTerm}),
      similarity(${column('nameUz')}, ${foldedTerm})
    ) >= ${NAME_SIMILARITY_FLOOR} THEN GREATEST(
      similarity(${column('name')}, ${foldedTerm}),
      similarity(${column('nameRu')}, ${foldedTerm}),
      similarity(${column('nameUz')}, ${foldedTerm})
    ) ELSE 0.0 END * ${shortTermNameGuard},
    -- 3. the term is close to one whole word of the name or short description.
    CASE WHEN GREATEST(
      strict_word_similarity(${foldedTerm}, ${column('name')} || ' ' || ${column('shortDescription')}),
      strict_word_similarity(${foldedTerm}, ${column('nameRu')} || ' ' || ${column('shortDescriptionRu')}),
      strict_word_similarity(${foldedTerm}, ${column('nameUz')} || ' ' || ${column('shortDescriptionUz')})
    ) >= ${WORD_SIMILARITY_FLOOR} THEN 0.9 * GREATEST(
      strict_word_similarity(${foldedTerm}, ${column('name')} || ' ' || ${column('shortDescription')}),
      strict_word_similarity(${foldedTerm}, ${column('nameRu')} || ' ' || ${column('shortDescriptionRu')}),
      strict_word_similarity(${foldedTerm}, ${column('nameUz')} || ' ' || ${column('shortDescriptionUz')})
    ) ELSE 0.0 END * ${shortTermNameGuard},
    -- 4. a word of the name is within a small edit distance of the term. This is
    --    the only signal that catches a transposition in a short word; see the
    --    note at the top of the file. The distance comes from the lateral join
    --    that rankedRows adds.
    CASE WHEN words."distance" IS NOT NULL
         THEN 0.85 * (1.0 - words."distance"::float8 / ${term.length}) ELSE 0.0 END
      * ${shortTermNameGuard},
    -- 5. stemming: «рубашки» finds «рубашка».
    0.85 * (CASE WHEN ${nameQuery} THEN 1.0 ELSE 0.0 END) * ${shortTermAnywhereGuard},
    0.70 * (CASE WHEN ${wholeQuery} THEN 1.0 ELSE 0.0 END) * ${shortTermAnywhereGuard},
    -- 6. the term only in the description, or only on the spec sheet. The spec
    --    sheet is its own signal because a specification row is short and a term
    --    like induction in one is a real answer, while the same word buried in a
    --    long description is usually prose.
    CASE WHEN GREATEST(
      similarity(${column('description')}, ${foldedTerm}),
      similarity(${column('descriptionRu')}, ${foldedTerm}),
      similarity(${column('descriptionUz')}, ${foldedTerm})
    ) >= ${DESCRIPTION_SIMILARITY_FLOOR} THEN 0.55 * GREATEST(
      similarity(${column('description')}, ${foldedTerm}),
      similarity(${column('descriptionRu')}, ${foldedTerm}),
      similarity(${column('descriptionUz')}, ${foldedTerm})
    ) ELSE 0.0 END * ${shortTermAnywhereGuard},
    CASE WHEN word_similarity(${foldedTerm}, ${specText}) >= ${SPEC_SIMILARITY_FLOOR}
         THEN 0.7 ELSE 0.0 END * ${shortTermAnywhereGuard},
    -- 7. a Latin query against Cyrillic text. The regex guard keeps this from
    --    firing on a query that is already Cyrillic, where transliterating it
    --    would turn a real match into noise.
    0.8 * (CASE WHEN ${term} ~ '^[[:ascii:]]+$' THEN GREATEST(
      similarity(${column('nameRu')}, ${cyrillic}),
      CASE WHEN ${column('nameRu')} ILIKE ${cyrillicPattern} THEN 1.0 ELSE 0.0 END
    ) ELSE 0.0 END) * ${shortTermNameGuard},
    -- 8. the query as a whole, against the words the catalogue might have used
    --    for it: once over the words the product is named with, once over the
    --    words it describes itself with, and the better answer wins. Empty for a
    --    query whose words are all too short or too common to widen, which leaves
    --    the seven signals above deciding as they did. Not guarded: it matches
    --    word openings already, which is the same rule.
    ${coverageSignal(queryWords(term), IDENTITY_TEXT, NAME_COVERAGE_SCORE)},
    ${coverageSignal(queryWords(term), ABOUT_TEXT, DESCRIPTION_COVERAGE_SCORE)}
  )`;
}

/**
 * The closest a single word of a product name comes to the term, as a
 * Levenshtein distance.
 *
 * A lateral join, so each product splits its names into words once and the score
 * expression reads one number. Two filters keep the comparison meaningful: the
 * word has to be about as long as the term, and the distance has to be inside
 * the budget for that length. Without them a two-letter word is evidence that the
 * shopper meant an eleven-letter one, and a term two edits away from an
 * unrelated word of the same length scores as high as a typo.
 */
function wordsClause(term: string): Prisma.Sql {
  return Prisma.sql`LEFT JOIN LATERAL (
    SELECT MIN(levenshtein(ziyo_unaccent(lower(word)), ziyo_unaccent(variant))) AS "distance"
    FROM regexp_split_to_table(
      coalesce(p."name", '') || ' ' || coalesce(p."nameRu", '') || ' ' || coalesce(p."nameUz", ''),
      '\\s+'
    ) AS word
    CROSS JOIN unnest(ARRAY[${swapVariants(term)}]) AS variant
    WHERE length(word) BETWEEN ${term.length - editBudget(term)} AND ${term.length + editBudget(term)}
  ) words ON words."distance" <= ${editBudget(term)}`;
}

/**
 * The matching products with their score, as a shared definition.
 *
 * The page query and the count query have to agree on what a match is, and the
 * cheapest way to guarantee that is to have one definition of it. `Prisma.sql`
 * keeps every value a bound parameter.
 */
function rankedRows(term: string, take: number, offset: number): Prisma.Sql {
  return Prisma.sql`
    SELECT p."id", p."rating", ${scoreExpression(term)} AS "score"
    FROM "Product" p
    LEFT JOIN "Brand" b ON b."id" = p."brandId"
    LEFT JOIN "Category" c ON c."id" = p."categoryId"
    ${wordsClause(term)}
    WHERE p."isActive" = true
      AND ${scoreExpression(term)} >= ${MATCH_THRESHOLD}
    ORDER BY "score" DESC, p."rating" DESC, p."id" ASC
    LIMIT ${take} OFFSET ${offset}
  `;
}

/**
 * Ids of the matching products, best match first.
 *
 * The whole match set is read at once rather than one page of it, because the
 * filters run after the score and a page taken before them would be a page of
 * products that are not all in the answer. `MAX_MATCHES` is what bounds it.
 */
async function rankedProductIds(term: string, offset: number, take: number): Promise<string[]> {
  const rows = await prisma.$queryRaw<RankedRow[]>(rankedRows(term, take, offset));

  return rows.map((row) => row.id);
}

/**
 * Products matching a term, best match first.
 *
 * An explicit `sort` hands the request to the product list service with the term
 * as one more filter. That path is a plain `ILIKE` over the name, the short
 * description and the brand — deliberately narrower than the scored search,
 * because "cheapest first" is a request to order a result set the shopper already
 * has in mind, not a request to widen it.
 *
 * Otherwise the scored query decides which products match, and the filters decide
 * which of those survive. The order the score produced is what the answer keeps.
 */
export async function searchProducts(input: SearchInput): Promise<Paginated<ProductSummary>> {
  const term = normalizeTerm(input.q);

  if (!isSearchable(term)) {
    return emptyPage(input.page, input.limit);
  }

  const filters = filtersOf(input);

  if (input.sort !== undefined) {
    return listProducts(
      {
        q: term,
        ...filters,
        sort: input.sort,
        page: input.page,
        limit: input.limit,
      },
      input.lang,
    );
  }

  const matched = await selectProductIdsInOrder(
    await rankedProductIds(term, 0, MAX_MATCHES),
    filters,
  );

  const offset = (input.page - 1) * input.limit;
  const total = matched.length;

  return {
    items: await listProductsByIds(matched.slice(offset, offset + input.limit), input.lang),
    total,
    page: input.page,
    pageSize: input.limit,
    totalPages: Math.ceil(total / input.limit),
  };
}

/**
 * What the search page's filter panel can offer for a term.
 *
 * It counts the products the term actually matched — the scored set, not a
 * substring of the names — because the panel sits beside the results and a count
 * that describes a different set from the one on screen is worse than no count.
 * The attributes are left out for the same reason the listing leaves them out: a
 * facet computed with its own selection applied shows every unselected value as
 * zero.
 */
export async function searchFacets(input: SearchInput): Promise<ProductFacets> {
  const term = normalizeTerm(input.q);

  if (!isSearchable(term)) {
    return { total: 0, price: null, brands: [], attributes: [] };
  }

  return listProductFacets(
    { ...facetFiltersOf(input), ids: await rankedProductIds(term, 0, MAX_MATCHES) },
    input.lang,
  );
}

/**
 * Brands and categories whose name matches the term, best match first.
 *
 * Names only, and scored the same way a product name is: verbatim first, then
 * closeness, then a stemmed query. The label comes back in the requested
 * language, so a brand suggested on a Russian page reads in Russian.
 */
async function rankedNames(
  table: 'Brand' | 'Category',
  term: string,
  lang: CatalogLocale,
  limit: number,
): Promise<NameRow[]> {
  const alias = table === 'Brand' ? 'b' : 'c';
  const suffix = LOCALE_SUFFIX[lang];
  const foldedTerm = fold(term);
  const pattern = Prisma.sql`'%' || ${foldedTerm} || '%'`;

  const nameColumns = ['name', 'nameRu', 'nameUz'].map(
    (columnName) =>
      Prisma.sql`ziyo_unaccent(coalesce(${Prisma.raw(`${alias}."${columnName}"`)}, ''))`,
  );
  const shown = Prisma.sql`coalesce(${Prisma.raw(`${alias}."name${suffix}"`)}, ${Prisma.raw(`${alias}."name"`)})`;
  const imageColumn =
    table === 'Brand'
      ? Prisma.sql`${Prisma.raw(`${alias}."logoUrl"`)}`
      : Prisma.sql`${Prisma.raw(`${alias}."imageUrl"`)}`;

  // Only a brand has a logo. A category's picture is its `imageUrl`, and asking
  // for a column the table does not have fails the whole suggestion query, which
  // is what a bare `c."logoUrl"` did: Postgres reports the missing column and the
  // search box shows nothing for every term.
  const logoColumn =
    table === 'Brand' ? Prisma.sql`${Prisma.raw(`${alias}."logoUrl"`)}` : Prisma.sql`NULL::text`;

  const score = Prisma.sql`GREATEST(
    CASE WHEN ${nameColumns[0]!} ILIKE ${pattern}
          OR ${nameColumns[1]!} ILIKE ${pattern}
          OR ${nameColumns[2]!} ILIKE ${pattern}
         THEN 1.0 ELSE 0.0 END,
    GREATEST(
      similarity(${nameColumns[0]!}, ${foldedTerm}),
      similarity(${nameColumns[1]!}, ${foldedTerm}),
      similarity(${nameColumns[2]!}, ${foldedTerm})
    ),
    0.85 * (CASE WHEN ${transliterate(foldedTerm)} <> '' AND ${nameColumns[1]!} ILIKE ${Prisma.sql`'%' || ${transliterate(foldedTerm)} || '%'`} THEN 1.0 ELSE 0.0 END)
  )`;

  const activeFilter =
    table === 'Category'
      ? Prisma.sql`AND ${Prisma.raw(`${alias}."isActive"`)} = true`
      : Prisma.sql``;

  return prisma.$queryRaw<NameRow[]>`
    SELECT
      ${Prisma.raw(`${alias}."id"`)} AS "id",
      ${shown} AS "name",
      ${Prisma.raw(`${alias}."slug"`)} AS "slug",
      ${imageColumn} AS "imageUrl",
      ${logoColumn} AS "logoUrl"
    FROM ${Prisma.raw(`"${table}"`)} ${Prisma.raw(alias)}
    WHERE ${score} >= ${SUGGESTION_THRESHOLD}
      ${activeFilter}
    ORDER BY "name" ASC, "id" ASC
    LIMIT ${limit}
  `;
}

/**
 * Suggestions for the search box: product names, then brands, then categories,
 * capped at eight. Products come first because a shopper is usually looking for
 * one; a brand or a category is the broader answer.
 */
export async function searchSuggestions(
  rawTerm: string | undefined,
  lang: CatalogLocale,
): Promise<Suggestion[]> {
  const term = normalizeTerm(rawTerm);

  if (!isSearchable(term)) {
    return [];
  }

  const [productIds, brands, categories] = await Promise.all([
    rankedProductIds(term, 0, SUGGESTION_PRODUCT_LIMIT),
    rankedNames('Brand', term, lang, SUGGESTION_BRAND_LIMIT),
    rankedNames('Category', term, lang, SUGGESTION_CATEGORY_LIMIT),
  ]);

  const products = await listProductsByIds(productIds, lang);

  const suggestions: Suggestion[] = products.map((product) => ({
    type: 'product',
    label: product.name,
    slug: product.slug,
    imageUrl: product.image?.url ?? null,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
  }));

  for (const brand of brands) {
    suggestions.push({
      type: 'brand',
      label: brand.name,
      slug: brand.slug,
      imageUrl: brand.logoUrl,
    });
  }

  for (const category of categories) {
    suggestions.push({
      type: 'category',
      label: category.name,
      slug: category.slug,
      imageUrl: category.imageUrl,
    });
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
}
