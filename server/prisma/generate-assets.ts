/**
 * Draws the placeholder artwork the seed references.
 *
 * The seed stores paths such as `/assets/products/cast-iron-dutch-oven.jpg` in
 * the database, and those files have to exist for the storefront to render.
 * `fetch-photos.ts` fills them with real photography, downloaded from Wikimedia
 * Commons. This script is the fallback for when it has not run — a fresh clone,
 * an offline machine, a catalog whose new products have not been photographed
 * yet. It draws one deterministic SVG per product, subcategory, category and
 * brand.
 *
 * Run it from `server/` after changing `seed-data.ts`:
 *
 *   pnpm prisma:assets             # draws only what is missing, or what it drew before
 *   pnpm prisma:assets -- --force  # redraws over photographs too
 *
 * Output is a pure function of `seed-data.ts`: the same input always writes the
 * same bytes, so re-running it never produces a spurious diff.
 *
 * A drawn card is SVG bytes written to whatever path the seed currently names,
 * which is `.jpg` while the catalog is in its photographed state. That is
 * deliberate: the two scripts are alternative producers of the same paths, and
 * keeping them on one path means a card drawn here always lands where the seed
 * is looking. `ARTWORK_EXTENSION` in `seed-data.ts` is the single switch that
 * decides which of the two is the current producer. Because the two producers
 * share a path, this one refuses to overwrite a file it did not draw unless
 * `--force` is given — see `write()`.
 */

import { mkdir, open, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BRANDS,
  CATEGORIES,
  buildCatalog,
  categoryImageUrl,
  productImageUrls,
  secondImageUrl,
  type ProductSeed,
} from './seed-data.js';

const ASSETS_ROOT = fileURLToPath(new URL('../../client/public/assets', import.meta.url));

/** One accent per top-level category, so a grid of products reads as grouped. */
const ACCENTS: Record<string, { background: string; accent: string; ink: string }> = {
  clothing: { background: '#F4EFE7', accent: '#8C6A4A', ink: '#2C2620' },
  home: { background: '#EFF1EC', accent: '#5F6F55', ink: '#23291F' },
  kitchen: { background: '#F6F0EA', accent: '#A4613C', ink: '#2E211A' },
  beauty: { background: '#F7EFF2', accent: '#A8527A', ink: '#2E1F28' },
  electronics: { background: '#ECEFF4', accent: '#3E5C87', ink: '#1E2633' },
  toys: { background: '#F4F2E6', accent: '#B08A2E', ink: '#2C2718' },
  grocery: { background: '#EFF3EA', accent: '#4F7A3A', ink: '#1F291A' },
  deals: { background: '#F3EDED', accent: '#9B3B3B', ink: '#2B1E1E' },
};

const FALLBACK_ACCENT = { background: '#F1F1F1', accent: '#666666', ink: '#222222' };

/** `--force` redraws over photographs. Without it, a file this script did not draw is left alone. */
const force = process.argv.includes('--force');

const TOP_OF_SUBCATEGORY = new Map<string, string>();
for (const top of CATEGORIES) {
  TOP_OF_SUBCATEGORY.set(top.slug, top.slug);
  for (const sub of top.children) {
    TOP_OF_SUBCATEGORY.set(sub.slug, top.slug);
  }
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Breaks a label into at most `maxLines` lines of roughly `width` characters. */
function wrap(value: string, width: number, maxLines: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  return kept;
}

type CardOptions = {
  title: string;
  subtitle: string;
  accentKey: string;
  /** Marks the secondary gallery image so the two files differ. */
  variant?: 'primary' | 'alt';
};

function card({ title, subtitle, accentKey, variant = 'primary' }: CardOptions): string {
  const palette = ACCENTS[accentKey] ?? FALLBACK_ACCENT;
  const titleLines = wrap(title, 18, 3);
  const subtitleLines = wrap(subtitle, 34, 2);
  const titleStartY = 400 - (titleLines.length - 1) * 34;

  const titleSpans = titleLines
    .map(
      (line, index) =>
        `    <tspan x="400" y="${titleStartY + index * 68}">${escapeXml(line)}</tspan>`,
    )
    .join('\n');

  const subtitleSpans = subtitleLines
    .map((line, index) => `    <tspan x="400" y="${560 + index * 34}">${escapeXml(line)}</tspan>`)
    .join('\n');

  // The alt image swaps the composition so the two gallery images are visibly
  // distinct instead of byte-identical drawings.
  const shape =
    variant === 'primary'
      ? `    <circle cx="400" cy="240" r="96" fill="${palette.accent}" opacity="0.18" />\n` +
        `    <rect x="304" y="216" width="192" height="48" rx="24" fill="${palette.accent}" opacity="0.28" />`
      : `    <rect x="312" y="152" width="176" height="176" rx="28" fill="${palette.accent}" opacity="0.18" />\n` +
        `    <circle cx="400" cy="240" r="44" fill="${palette.accent}" opacity="0.3" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" role="img" aria-label="${escapeXml(title)}">
  <rect width="800" height="800" fill="${palette.background}" />
${shape}
  <text x="400" y="88" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="26" letter-spacing="6" fill="${palette.accent}">ZIYO</text>
  <text text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="54" font-weight="bold" fill="${palette.ink}">
${titleSpans}
  </text>
  <text text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="3" fill="${palette.accent}">
${subtitleSpans}
  </text>
  <rect x="48" y="48" width="704" height="704" fill="none" stroke="${palette.ink}" stroke-opacity="0.12" stroke-width="2" />
</svg>
`;
}

/**
 * Writes one drawn card, unless a downloaded photograph is already there.
 *
 * The two scripts write to the same paths, so the last one to run wins, and
 * running this one over a photographed catalog would replace nine minutes of
 * downloads with placeholders. A photograph is expensive and a drawn card is a
 * pure function of `seed-data.ts`, so the guard is one-sided: this script will
 * not overwrite a file that is not one of its own drawings. `--force` overrides
 * it, for the case where the artwork really should go back to placeholders.
 *
 * "One of its own drawings" is read from the file's first bytes rather than
 * assumed from the extension, because the extension is `.jpg` on both.
 */
async function write(relativePath: string, contents: string): Promise<boolean> {
  const absolute = join(ASSETS_ROOT, relativePath);

  if (!force && existsSync(absolute) && !(await isDrawnCard(absolute))) {
    return false;
  }

  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, contents, 'utf8');
  return true;
}

/** Whether an existing file starts the way this script's own output starts. */
async function isDrawnCard(absolutePath: string): Promise<boolean> {
  const handle = await open(absolutePath, 'r');

  try {
    const buffer = Buffer.alloc(64);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const head = buffer.subarray(0, bytesRead).toString('utf8').trimStart();

    return head.startsWith('<svg') || head.startsWith('<?xml');
  } finally {
    await handle.close();
  }
}

/** Turns the public path a URL builder returns into one relative to the assets root. */
function assetPath(publicPath: string): string {
  return publicPath.replace('/assets/', '');
}

function productSubtitle(product: ProductSeed): string {
  const brand = BRANDS.find((entry) => entry.slug === product.brandSlug);
  return brand ? brand.name.toUpperCase() : 'ZIYO SELECTION';
}

function subtitleForCategorySlug(slug: string): string {
  const top = CATEGORIES.find((entry) => entry.slug === slug);
  if (top) {
    return 'COLLECTION';
  }
  for (const entry of CATEGORIES) {
    if (entry.children.some((sub) => sub.slug === slug)) {
      return entry.name.toUpperCase();
    }
  }
  return 'ZIYO';
}

async function main(): Promise<void> {
  const { categories, products } = buildCatalog();
  let drawn = 0;
  let kept = 0;

  const record = (written: boolean): void => {
    if (written) {
      drawn += 1;
    } else {
      kept += 1;
    }
  };

  for (const category of categories) {
    record(
      await write(
        assetPath(categoryImageUrl(category.slug)),
        card({
          title: category.name,
          subtitle: subtitleForCategorySlug(category.slug),
          accentKey: TOP_OF_SUBCATEGORY.get(category.slug) ?? 'deals',
        }),
      ),
    );
  }

  for (const brand of BRANDS) {
    record(
      await write(
        `brands/${brand.slug}.svg`,
        card({
          title: brand.name,
          subtitle: 'BRAND',
          accentKey: 'home',
          variant: 'alt',
        }),
      ),
    );
  }

  for (const product of products) {
    const accentKey = TOP_OF_SUBCATEGORY.get(product.categorySlug) ?? 'deals';
    const altUrl = secondImageUrl(product);

    // The paths come from `seed-data.ts`, the same builders the photo script
    // writes to, so a card drawn here and a photograph downloaded there always
    // land on the path the seed has stored. The extension is the seed's, which
    // is why this script draws SVG bytes at a `.jpg` name when the catalog is
    // in its photographed state: see the note at the top of the file.
    for (const publicPath of productImageUrls(product)) {
      record(
        await write(
          assetPath(publicPath),
          card({
            title: product.name,
            subtitle: productSubtitle(product),
            accentKey,
            variant: publicPath === altUrl ? 'alt' : 'primary',
          }),
        ),
      );
    }
  }

  const altCount = products.filter((product) => secondImageUrl(product) !== null).length;
  console.log(
    `Drew ${drawn} images to client/public/assets: ${products.length} products ` +
      `(plus ${altCount} alternates), ${categories.length} categories and ${BRANDS.length} brands.`,
  );

  if (kept > 0) {
    console.log(
      `Left ${kept} photographs in place — they are not this script's output. ` +
        'Run with --force to replace them with drawings.',
    );
  }
}

await main();
