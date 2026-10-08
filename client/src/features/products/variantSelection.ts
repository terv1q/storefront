/**
 * Choosing the options of a product.
 *
 * The catalog stores one row per option value, not one per combination: a shirt
 * has four `Size` rows and three `Color` rows, and no row names both. That is
 * what the facet endpoint publishes and what the listing filters on, and it is
 * what this module works with. A group of options is therefore one attribute
 * name with its values, a selection names one value per group, and two groups
 * are chosen independently.
 *
 * What follows from that shape, and what is stated here rather than in a
 * component: availability is a property of a value and not of a combination.
 * There is no combination to ask about — nothing in the catalog says how many
 * navy larges there are — so a value is offered when its own row has stock, and
 * the shopper's real ceiling is the smallest of the stocks they have chosen
 * between. This is what the interface says as well: a value that is out of stock
 * is disabled and cannot be selected, while the quantity control under the
 * buttons counts what is left of the choice.
 *
 * The labels come from the interface's tables, keyed by the English strings the
 * catalog stores, exactly as the filter panel reads them from the facets. A
 * value nobody has translated is shown as the stored string rather than hidden:
 * an option that vanished with the language would be a product nobody can buy.
 *
 * Prices are integers in minor units, as everywhere else in the client.
 */

import { strings } from '@/i18n/strings';
import type { ProductDetail, ProductVariant } from '@/types/product';

/** One value a shopper can choose, and whether choosing it is possible. */
export type VariantOption = {
  variant: ProductVariant;
  /** The value in the language being read, for example «Тёмно-синий». */
  label: string;
  /** False when this value has no stock of its own. */
  available: boolean;
};

/** One attribute of a product, with the values it offers. */
export type VariantGroup = {
  /** The stored English attribute name, the key a selection is held under. */
  name: string;
  /** The attribute name in the language being read, for example «Цвет». */
  label: string;
  options: VariantOption[];
  /** False when no value of this group can be chosen. */
  available: boolean;
};

/** One chosen value per attribute name. */
export type VariantSelection = Record<string, string>;

/** The value of an attribute in the language being read, or the stored string. */
function translated(
  table: Record<string, string>,
  stored: string,
  fallback?: Record<string, string>,
): string {
  return table[stored] ?? fallback?.[stored] ?? stored;
}

/** The attribute name as it is read, for example `Color` as «Цвет». */
export function variantNameLabel(name: string): string {
  return translated(strings.productPage.variant.attributes, name);
}

/** A value as it is read, for example `Navy` as «Тёмно-синий». */
export function variantValueLabel(value: string): string {
  return translated(strings.productPage.variant.values, value);
}

/** How a chosen option is written into the cart line: `Цвет: Тёмно-синий`. */
export function variantLabel(name: string, value: string): string {
  return strings.productPage.variant.selected(variantNameLabel(name), variantValueLabel(value));
}

/**
 * The product's option rows arranged into groups, in the order the catalog
 * returns them. Options keep that order too: sizes rise, and a set of colours is
 * shown in the order the store wrote them rather than alphabetically, which
 * would put «Песочный» before «Чёрный» in Russian and after it in English.
 */
export function groupVariants(variants: readonly ProductVariant[]): VariantGroup[] {
  const groups: VariantGroup[] = [];

  for (const variant of variants) {
    let group = groups.find((entry) => entry.name === variant.name);

    if (group === undefined) {
      group = {
        name: variant.name,
        label: variantNameLabel(variant.name),
        options: [],
        available: false,
      };
      groups.push(group);
    }

    group.options.push({
      variant,
      label: variantValueLabel(variant.value),
      available: variant.stock > 0,
    });
    group.available ||= variant.stock > 0;
  }

  return groups;
}

/**
 * What the page starts with: the first value that can actually be bought in each
 * group.
 *
 * A product whose options all have stock opens with the first of each, which is
 * what a shopper expects and what makes the add-to-cart button work without a
 * second thought. A group nobody can buy from is left unselected, because there
 * is nothing honest to preselect.
 */
export function defaultSelection(groups: readonly VariantGroup[]): VariantSelection {
  const selection: VariantSelection = {};

  for (const group of groups) {
    const first = group.options.find((option) => option.available);

    if (first !== undefined) {
      selection[group.name] = first.variant.id;
    }
  }

  return selection;
}

export type VariantChoice = {
  /** The chosen rows, in group order. */
  chosen: ProductVariant[];
  /** Their ids, which is what a cart line is identified by. */
  variantIds: string[];
  /** Minor units: the product's price plus every chosen value's difference. */
  price: number;
  /** How many units can be added, which is the smallest stock in the choice. */
  stock: number;
  /** The selection's own SKU, or the product's when nothing is chosen. */
  sku: string;
  /** The choice as a sentence for the cart line, or `null` when there is none. */
  label: string | null;
  /** True when every group has an available value chosen. */
  complete: boolean;
};

/**
 * What the shopper's choice amounts to.
 *
 * `variantIds` is the chosen rows in the order the groups are drawn, which makes
 * it stable for one selection and different for another — the cart compares two
 * lines by it. The price is the product's plus each difference, and the stock is
 * the smallest any chosen value has left, because that is the value that will
 * run out first.
 */
export function resolveChoice(
  product: Pick<ProductDetail, 'price' | 'stock' | 'sku'>,
  groups: readonly VariantGroup[],
  selection: VariantSelection,
): VariantChoice {
  const chosen: ProductVariant[] = [];

  for (const group of groups) {
    const option = group.options.find((entry) => entry.variant.id === selection[group.name]);

    if (option !== undefined) {
      chosen.push(option.variant);
    }
  }

  const price = chosen.reduce((total, variant) => total + variant.priceDelta, product.price);
  const stock = chosen.reduce((lowest, variant) => Math.min(lowest, variant.stock), product.stock);

  return {
    chosen,
    variantIds: chosen.map((variant) => variant.id),
    price,
    stock: Math.max(0, stock),
    sku: chosen.length === 0 ? product.sku : chosen.map((variant) => variant.sku).join(' · '),
    label:
      chosen.length === 0
        ? null
        : chosen.map((variant) => variantLabel(variant.name, variant.value)).join(' · '),
    complete: groups.every(
      (group) =>
        group.options.find((entry) => entry.variant.id === selection[group.name])?.available ===
        true,
    ),
  };
}
