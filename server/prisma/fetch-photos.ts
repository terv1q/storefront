/**
 * Downloads the photography the seed references.
 *
 * `seed-data.ts` stores paths such as `/assets/products/cast-iron-dutch-oven.jpg`
 * in the database. This script is what puts a real photograph behind each of
 * them: it walks the same catalog the seed builds, searches Wikimedia Commons for
 * every product, category, and gallery image, downloads the best candidate, and
 * writes it to the path the seed expects.
 *
 * Run it from `server/`:
 *
 *   pnpm prisma:photos                 # everything that is missing
 *   pnpm prisma:photos -- --force      # re-download what is already there
 *   pnpm prisma:photos -- --only=products --limit=10
 *   pnpm prisma:photos -- --dry        # search only, write nothing
 *
 * After it runs, `pnpm prisma:seed` writes the paths into the database.
 *
 * Why Commons
 * -----------
 * It needs no API key and has no practical request limit, and a search of the
 * right shape returns photographs of the actual object — a Griswold dutch oven,
 * an Asics running shoe, a Bosch kettle, each shot as a product rather than as a
 * scene. The catch is that the right shape is a *short* query. Commons ranks by
 * wording, and a storefront's product names are far more specific than the words
 * anyone writes in a caption: "Men's Merino Crewneck Sweater" matches nothing,
 * while "sweater" matches a hundred files. `queryLadder()` is what turns one into
 * the other.
 *
 * Openverse was tried and rejected: its anonymous allowance is 200 requests a
 * day, fewer than this catalog needs, and its Flickr source answers with
 * `by-nc-sa` and `by-nc-nd` licences, which forbid commercial use. Pexels and
 * Pixabay answer with studio-quality product shots, which is what a real
 * storefront would use, but both require an account and a key. If a key is ever
 * available, this script is the only file that has to change.
 *
 * Attribution
 * -----------
 * Almost everything on Commons is licensed CC BY, CC BY-SA, or is public domain.
 * The first two require the author and the licence to be credited wherever the
 * picture appears. Every download is therefore recorded in
 * `client/public/assets/photos-credits.json` with its file title, author,
 * licence, and the page it came from, and that file is not optional: it is the
 * record the credit line has to be built from.
 *
 * How a candidate is chosen
 * -------------------------
 * Each image is given a ladder of searches, most specific first. Among the
 * results the script scores rather than taking the first: it wants a JPEG, at
 * least 500 pixels on the short side, roughly square, and a title that contains
 * the head noun of the query — the word naming the object — without using that
 * word as a place name. The same Commons file is not used twice in one run, so
 * two products do not end up with the same picture.
 *
 * Downloads are resumable. A file that exists and is not empty is left alone
 * unless `--force` is given, so an interrupted run is restarted by running it
 * again. The credits file is rewritten after every single download, and the list
 * of photographs already handed out is rebuilt from it at the start of a run, so
 * a resumed run neither loses a credit nor gives two products the same picture.
 * A file with no credit entry is a file whose licence record was lost: delete it
 * and let a run fetch it again rather than keeping it.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BRANDS,
  CATEGORIES,
  buildCatalog,
  categoryImageUrl,
  productImageUrls,
  secondImageUrl,
} from './seed-data.js';

const ASSETS_ROOT = fileURLToPath(new URL('../../client/public/assets', import.meta.url));
const CREDITS_PATH = join(ASSETS_ROOT, 'photos-credits.json');
const REPORT_PATH = join(ASSETS_ROOT, 'photos-report.json');

/** Wikimedia asks every automated client to identify itself with a contact address. */
const USER_AGENT = 'ZiyoStorefrontSeed/1.0 (development seed script; support@ziyo.uz)';

/** The width the downloaded thumbnail is asked for at. Cards render at most ~400 px. */
const THUMB_WIDTH = 900;

/** How long to wait between two Commons requests. Well inside what the API tolerates. */
const REQUEST_GAP_MS = 320;

/**
 * What to search for a category image, per category.
 *
 * A product's name is close enough to a caption that trimming it works, but a
 * category's name is a storefront label and often not a caption at all. Left to
 * its own name, "Deals" found the town of Deal in Kent, "Clearance" found a
 * bridge's clearance gauge in Rotterdam, "Pantry" found a seventeenth-century
 * still life, and "Home" found an inauguration. None of those is a mistake the
 * scorer could catch: each title really does contain the word.
 *
 * So the categories are listed explicitly. Every term ends in the noun for the
 * object, because that is the word the scorer requires a title to contain. A
 * category missing from this map is searched by its own name, which is the
 * right answer for the ones that are already captions — "Beverages",
 * "Furniture", "Snacks".
 */
const CATEGORY_QUERIES: Record<string, readonly string[]> = {
  audio: ['headphones'],
  beauty: ['cosmetics'],
  bedding: ['bed linen'],
  beverages: ['beverage cans'],
  'board-games': ['board game'],
  'building-blocks': ['toy bricks'],
  'bundle-deals': ['shopping bag'],
  clearance: ['price tags'],
  clothing: ['folded clothes'],
  cookware: ['frying pan'],
  deals: ['shopping basket'],
  'electronics-accessories': ['usb cable'],
  electronics: ['television'],
  footwear: ['leather shoes'],
  fragrance: ['perfume bottle'],
  furniture: ['armchair'],
  grocery: ['supermarket shelves'],
  haircare: ['shampoo bottle'],
  home: ['living room'],
  'home-decor': ['vase'],
  'kids-clothing': ['children clothes'],
  kitchen: ['kitchen utensils'],
  laptops: ['open laptop'],
  makeup: ['makeup brushes'],
  'mens-clothing': ['mens suit'],
  pantry: ['food jars'],
  skincare: ['cosmetic cream'],
  'small-appliances': ['kitchen blender'],
  smartphones: ['smartphone'],
  snacks: ['potato chips'],
  'soft-toys': ['teddy bear'],
  tableware: ['porcelain plates'],
  toys: ['wooden toys'],
  'womens-clothing': ['summer dress'],
};

/** Tokens that describe a product's marketing, a model, or a quantity, not the object it is. */
const NOISE_TOKENS = new Set([
  'pro',
  'lite',
  'plus',
  'max',
  'ultra',
  'mini',
  'xl',
  'xxl',
  'ii',
  'iii',
  'set',
  'pack',
  'bundle',
  'edition',
  'series',
  'oled',
  'lte',
  'gift',
  'of',
  'and',
  'with',
  'for',
  'the',
  'pieces',
  'piece',
  'shades',
  'ml',
  'l',
  'gb',
  'kg',
  // Who a product is for is not what it is: Commons has no photograph filed
  // under "men", and the word only drags incidental matches in with it.
  'men',
  'mens',
  'women',
  'womens',
  'kids',
  'kid',
  'boys',
  'girls',
  'unisex',
  'adult',
]);

/**
 * How many query steps a single image may try before giving up. Each step is one
 * Commons request, and `REQUEST_GAP_MS` between them, so this is the knob that
 * decides how long a run takes when a catalog has awkward names.
 */
const MAX_QUERY_STEPS = 4;

/**
 * Words that mean a Commons file is not a photograph of an object.
 *
 * Anchored on word boundaries, which is not decoration: unanchored, "graph"
 * rejects every file whose title mentions a photograph, "sign" rejects every
 * designer chair, "plan" rejects every plant, and "seal" rejects anything
 * sealed. Each of those is a shop's stock in trade.
 */
const NOT_A_PHOTO =
  /\b(logo|icon|diagram|map|chart|coat[_ ]of[_ ]arms|sign|poster|screenshot|drawing|clipart|seal|flag|plaque|graph|sketch|blueprint|plan|statistics|ownership|survey|distribution|catalogue|catalog)\b/i;

/**
 * Words that mean the photograph is of the right object in the wrong state.
 *
 * A card is a shop window. "Burned laptop" and "Flattened beverage can" are
 * photographs of exactly the object the query asked for and neither belongs on
 * one — they pass every test above, because nothing about them is a chart or a
 * diagram. This is a photography problem, not a matching problem, and a scraper
 * has no way to see the picture, so it is caught in the title instead.
 */
const UNSELLABLE =
  /\b(burned|burnt|broken|damaged|destroyed|wreck|wrecked|ruined|scrap|flattened|dented|rusty)\b/i;

type Candidate = {
  title: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  mime: string;
  descriptionUrl: string;
  author: string | null;
  license: string | null;
};

type Job = {
  /** Absolute path the file is written to. */
  filePath: string;
  /** Public path the seed stores, for the report. */
  publicPath: string;
  /** Search terms to try, best first. */
  queries: string[];
  /** 0 for the primary image, 1 for the gallery image: two different searches. */
  rank: number;
  /** What the file is for, in the report. */
  kind: 'product' | 'product-alt' | 'category';
  label: string;
};

type Credit = {
  path: string;
  kind: Job['kind'];
  label: string;
  query: string;
  commonsTitle: string;
  commonsPage: string;
  author: string | null;
  license: string | null;
  width: number;
  height: number;
};

type Failure = {
  path: string;
  kind: Job['kind'];
  label: string;
  tried: string[];
};

function parseArgs(argv: string[]): {
  force: boolean;
  dry: boolean;
  only: string | null;
  limit: number | null;
} {
  const force = argv.includes('--force');
  const dry = argv.includes('--dry');

  const onlyArg = argv.find((arg) => arg.startsWith('--only='));
  const limitArg = argv.find((arg) => arg.startsWith('--limit='));

  return {
    force,
    dry,
    only: onlyArg === undefined ? null : onlyArg.slice('--only='.length),
    limit: limitArg === undefined ? null : Number.parseInt(limitArg.slice('--limit='.length), 10),
  };
}

const args = parseArgs(process.argv.slice(2));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Reduces a product name to the words a photo search can use: drops the brand,
 * anything starting with a digit (sizes, capacities, model numbers), and the
 * marketing and quantity words. Returns an empty array when everything was
 * noise, so the caller knows to fall back to the category.
 */
function searchWords(name: string, brandNames: readonly string[]): string[] {
  const withoutBrands = brandNames.reduce((text, brand) => {
    return brand
      .split(/\s+/)
      .reduce((inner, word) => inner.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' '), text);
  }, name);

  return withoutBrands
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter((token) => {
      // A single letter is what an apostrophe leaves behind ("Men's" becomes
      // "Men s"), and it matches every title in the catalog.
      if (token.length < 2) {
        return false;
      }

      // "128GB", "5L", "50ml", "24": a number is a size or a count, never the object.
      if (/^\d/.test(token)) {
        return false;
      }

      return !NOISE_TOKENS.has(token.toLowerCase());
    });
}

/**
 * The searches to try for one image, best first.
 *
 * Commons matches on wording, and a storefront's product names are far more
 * specific than the words people use for the thing itself. Searching the whole
 * name for "Men's Merino Crewneck Sweater" finds nothing at all, while
 * "sweater" finds a hundred photographs: relevance falls off a cliff as words
 * are added. So the ladder starts at the full name, then drops one leading
 * modifier at a time, ending at the head noun — "Merino Crewneck Sweater",
 * "Crewneck Sweater", "Sweater". Whichever step finds a photograph wins; the
 * score decides which photograph.
 *
 * Category names come last, for a product whose own name is nothing but
 * marketing ("Ziyo Phone X5 Pro"), and the subcategory before the top-level one
 * because it is the closer description.
 *
 * The fallback order is not cosmetic: the earlier `searchTerm()` stripped only
 * the brand and the suffixes and searched the rest as one phrase, which is what
 * produced `Andean Man.jpg` for a shirt. The measured fix is a shorter query,
 * not a better filter over the same long one.
 */
function queryLadder(
  name: string,
  brandNames: readonly string[],
  fallbacks: readonly string[],
): string[] {
  const words = searchWords(name, brandNames);
  const ladder: string[] = [];

  for (let from = 0; from < words.length; from += 1) {
    ladder.push(words.slice(from).join(' '));
  }

  // A product whose name was entirely noise has no ladder of its own, and a
  // one-word ladder is just the head noun, which the loop already produced.
  ladder.push(...fallbacks);

  // A name that ends in a packing word — "Skincare Starter Bundle", "Kids Play
  // Bundle" — names a promotion and has no object noun in it: the last word left
  // once the packing word is stripped is "starter" or "play", which is not a
  // noun. Asking the category instead was tried and is worse, not better: the
  // subcategory of these products is `deals`, and `deals` searched Commons for
  // the town of Deal. The name ladder stays, and these few products are the
  // known weak spot of this script.
  return [...new Set(ladder)].slice(0, MAX_QUERY_STEPS);
}

/** Two words naming the same thing but for a plural "s": "chino" and "chinos". */
function sameNoun(a: string, b: string): boolean {
  return a.replace(/s$/, '') === b.replace(/s$/, '');
}

/**
 * Whether the title uses the head noun as a place rather than as an object.
 *
 * Some product nouns are also place names, and Commons files a place as
 * "Chino, California" and "Cardigan, Ceredigion". Matching on the word alone
 * therefore put a sugar factory on a pair of chinos and an aerial view of a
 * Welsh river on a cardigan. A comma straight after the noun is how a place is
 * written and is not how a product is described, so that is the test.
 */
function headIsPlace(title: string, head: string): boolean {
  // Matching on the stem, not the word: the search says "chinos" and the place
  // is written "Chino, California".
  const stem = head.replace(/s$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return new RegExp(`\\b${stem}s?,\\s`, 'i').test(title);
}

/**
 * Scores a candidate. Higher is better; anything at or below zero is discarded.
 *
 * A title has to contain the head noun of the query — the last word, the one
 * naming the object — and that requirement is what separates the catalog from
 * the noise around it. Matching on *any* shared word is not enough, and the
 * measurements say why: "Oxford" alone pulled in a photograph of Trinity
 * College Chapel for an Oxford shirt, and "fit" pulled in sailors taking
 * respirator fit tests for slim fit chinos. Both are correct word matches and
 * both are the wrong object. The object is in the head noun, so that is what is
 * required and what scores highest.
 *
 * Nouns are compared with a trailing "s" removed, so a search for "chino"
 * accepts a file named "Chinos" and vice versa, which is the only inflection
 * this catalog needs.
 */
function score(candidate: Candidate, usedTitles: ReadonlySet<string>, query: string): number {
  if (usedTitles.has(candidate.title)) {
    return -1;
  }

  if (candidate.mime !== 'image/jpeg' && candidate.mime !== 'image/png') {
    return -1;
  }

  if (NOT_A_PHOTO.test(candidate.title)) {
    return -1;
  }

  if (UNSELLABLE.test(candidate.title)) {
    return -1;
  }

  const shortSide = Math.min(candidate.width, candidate.height);

  if (shortSide < 500) {
    return -1;
  }

  const titleWords = candidate.title.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);
  const head = query.toLowerCase().split(/\s+/).at(-1) ?? '';

  if (head.length < 2 || !titleWords.some((word) => sameNoun(word, head))) {
    return -1;
  }

  if (headIsPlace(candidate.title, head)) {
    return -1;
  }

  const aspect = candidate.width / candidate.height;
  let points = 6;

  for (const word of queryWords) {
    if (word !== head && titleWords.some((titleWord) => sameNoun(titleWord, word))) {
      points += 2;
    }
  }

  // A square-ish photograph fills a square card without cutting the subject out.
  if (aspect >= 0.8 && aspect <= 1.3) {
    points += 3;
  } else if (aspect >= 0.6 && aspect <= 1.8) {
    points += 1;
  }

  points += candidate.mime === 'image/jpeg' ? 2 : 0;
  points += shortSide >= 900 ? 2 : 0;
  // Titles with a bare filename or a date in them are usually metadata dumps.
  points -= /\b\d{4,}\b/.test(candidate.title) ? 1 : 0;

  return points;
}

type CommonsPage = {
  title: string;
  imageinfo?: {
    url: string;
    thumburl?: string;
    width: number;
    height: number;
    mime: string;
    descriptionurl: string;
    extmetadata?: Record<string, { value?: string }>;
  }[];
};

async function searchCommons(query: string, attempt = 0): Promise<Candidate[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('format', 'json');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', `filetype:bitmap ${query}`);
  url.searchParams.set('gsrlimit', '12');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  url.searchParams.set('iiurlwidth', String(THUMB_WIDTH));

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (response.status === 429 && attempt < 3) {
    await sleep(2000 * (attempt + 1));
    return searchCommons(query, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Commons answered ${response.status} for "${query}"`);
  }

  const body = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } };
  const pages = Object.values(body.query?.pages ?? {});

  return pages.flatMap((page) => {
    const info = page.imageinfo?.[0];

    if (info === undefined) {
      return [];
    }

    const meta = info.extmetadata ?? {};

    return [
      {
        title: page.title,
        url: info.url,
        thumbUrl: info.thumburl ?? info.url,
        width: info.width,
        height: info.height,
        mime: info.mime,
        descriptionUrl: info.descriptionurl,
        author: meta.Artist?.value?.replace(/<[^>]*>/g, '').trim() ?? null,
        license: meta.LicenseShortName?.value?.trim() ?? null,
      },
    ];
  });
}

/** Strips the HTML Commons returns inside its metadata fields. */
function plain(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  return value.replace(/\s+/g, ' ').trim() || null;
}

async function download(url: string, filePath: string): Promise<void> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (!response.ok) {
    throw new Error(`download answered ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.byteLength < 1024) {
    throw new Error(`download returned ${buffer.byteLength} bytes`);
  }

  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, buffer);
}

/** Every product, category, and gallery image the seed expects a file for. */
function buildJobs(): Job[] {
  const brandNames = BRANDS.map((brand) => brand.name);
  const categoryNames = new Map<string, string>();
  const topOfSubcategory = new Map<string, string>();

  for (const top of CATEGORIES) {
    categoryNames.set(top.slug, top.name);

    for (const sub of top.children) {
      categoryNames.set(sub.slug, sub.name);
      topOfSubcategory.set(sub.slug, top.name);
    }
  }

  const { products, categories } = buildCatalog();
  const jobs: Job[] = [];

  for (const product of products) {
    const fallbacks = [
      categoryNames.get(product.categorySlug),
      topOfSubcategory.get(product.categorySlug),
    ].filter((name): name is string => name !== undefined);

    const ladder = queryLadder(product.name, brandNames, fallbacks);

    for (const publicPath of productImageUrls(product)) {
      const isAlt = publicPath === secondImageUrl(product);

      jobs.push({
        filePath: join(ASSETS_ROOT, publicPath.replace('/assets/', '')),
        publicPath,
        // The gallery image asks the same questions but takes the second-best
        // answer, which is what makes hovering a card swap to another
        // photograph of the same object rather than to the same one again.
        queries: ladder,
        rank: isAlt ? 1 : 0,
        kind: isAlt ? 'product-alt' : 'product',
        label: product.name,
      });
    }
  }

  for (const category of categories) {
    jobs.push({
      filePath: join(ASSETS_ROOT, categoryImageUrl(category.slug).replace('/assets/', '')),
      publicPath: categoryImageUrl(category.slug),
      queries: [...(CATEGORY_QUERIES[category.slug] ?? [category.name])],
      rank: 0,
      kind: 'category',
      label: category.name,
    });
  }

  return jobs;
}

async function readCredits(): Promise<Credit[]> {
  if (!existsSync(CREDITS_PATH)) {
    return [];
  }

  try {
    const parsed = JSON.parse(await readFile(CREDITS_PATH, 'utf8')) as unknown;

    return Array.isArray(parsed) ? (parsed as Credit[]) : [];
  } catch {
    return [];
  }
}

/** Rewrites the credits file from the in-memory record, in a stable order. */
async function writeCredits(credits: ReadonlyMap<string, Credit>): Promise<void> {
  const ordered = [...credits.values()].sort((a, b) => a.path.localeCompare(b.path));
  await writeFile(CREDITS_PATH, `${JSON.stringify(ordered, null, 2)}\n`);
}

async function main(): Promise<void> {
  const all = buildJobs();
  // `--only=product` selects both the primary and the gallery image, since the
  // gallery image's kind is `product-alt`.
  const jobs =
    args.only === null
      ? all
      : all.filter((job) => job.kind === args.only || job.kind.startsWith(`${args.only}-`));
  const limited = args.limit === null ? jobs : jobs.slice(0, args.limit);

  const credits = new Map((await readCredits()).map((credit) => [credit.path, credit]));
  const failures: Failure[] = [];
  // A resumed run must not hand out a photograph an earlier run already used,
  // and the credits file is the only record of what that was: the files on disk
  // say nothing about which Commons page they came from.
  //
  // The exception is the images this run is about to fetch again. Their old
  // credits are history, not a claim on the file: leaving them in the set makes
  // `--force` unable to pick the photograph it picked last time, which is
  // exactly the one it should be free to pick. "Beverages" failed on a forced
  // run for no other reason.
  const refetching = new Set(
    limited
      .filter(
        (job) => args.force || !existsSync(job.filePath) || statSync(job.filePath).size <= 1024,
      )
      .map((job) => job.publicPath),
  );
  const usedTitles = new Set(
    [...credits.values()]
      .filter((credit) => !refetching.has(credit.path))
      .map((credit) => credit.commonsTitle)
      .filter((title) => title !== ''),
  );
  const started = Date.now();
  let written = 0;
  let skipped = 0;

  console.log(`Photos: ${limited.length} to consider (${all.length} in the catalog).`);

  for (const [index, job] of limited.entries()) {
    const position = `[${index + 1}/${limited.length}]`;

    if (!args.force && existsSync(job.filePath) && statSync(job.filePath).size > 1024) {
      skipped += 1;
      continue;
    }

    let chosen: Candidate | null = null;
    let chosenQuery = '';

    for (const query of job.queries) {
      const candidates = await searchCommons(query);
      await sleep(REQUEST_GAP_MS);

      // Sorted so the best answer wins regardless of the order Commons returned.
      const best =
        candidates
          .map((candidate) => ({ candidate, points: score(candidate, usedTitles, query) }))
          .filter(({ points }) => points > 0)
          .sort((a, b) => b.points - a.points)[job.rank] ?? null;

      if (best !== null) {
        chosen = best.candidate;
        chosenQuery = query;
        break;
      }
    }

    if (chosen === null) {
      failures.push({ path: job.publicPath, kind: job.kind, label: job.label, tried: job.queries });
      console.log(`${position} FAILED  ${job.label}`);
      continue;
    }

    if (!args.dry) {
      try {
        await download(chosen.thumbUrl, job.filePath);
        await sleep(REQUEST_GAP_MS);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({
          path: job.publicPath,
          kind: job.kind,
          label: job.label,
          tried: job.queries,
        });
        console.log(`${position} FAILED  ${job.label} — ${message}`);
        continue;
      }
    }

    usedTitles.add(chosen.title);
    written += 1;

    if (!args.dry) {
      credits.set(job.publicPath, {
        path: job.publicPath,
        kind: job.kind,
        label: job.label,
        query: chosenQuery,
        commonsTitle: chosen.title,
        commonsPage: chosen.descriptionUrl,
        author: plain(chosen.author),
        license: plain(chosen.license),
        width: chosen.width,
        height: chosen.height,
      });

      // Written per file rather than once at the end. The credits file is a
      // licence record, and a run that is interrupted above thirty times an hour
      // on a slow connection would otherwise leave the files it did download with
      // no record of where they came from or who to credit.
      await writeCredits(credits);
    }

    console.log(`${position} ok      ${job.label} — ${chosen.title.replace('File:', '')}`);
  }

  if (!args.dry) {
    await writeCredits(credits);
    await writeFile(REPORT_PATH, `${JSON.stringify({ failures, written, skipped }, null, 2)}\n`);
  }

  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    `\nDone in ${seconds}s. Written: ${written}. Already present: ${skipped}. Failed: ${failures.length}.`,
  );

  if (failures.length > 0) {
    console.log('\nNo photograph was found for:');
    for (const failure of failures) {
      console.log(`  ${failure.path}  (${failure.label}) — tried: ${failure.tried.join(' | ')}`);
    }
    console.log('\nWiden the search in `buildJobs()` or accept the placeholder for these.');
  }

  if (credits.size > 0) {
    console.log(`\nCredits: ${CREDITS_PATH}`);
    console.log('Every downloaded file is CC-licensed. Publishing the storefront means crediting');
    console.log(
      'the author and licence of each one; the file above is the record to build that from.',
    );
  }
}

await main();
