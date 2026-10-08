/**
 * Deterministic catalog data for the Ziyo seed.
 *
 * Everything here is a plain literal: no randomness, no clock reads, no
 * network. The same input always produces the same rows, so `prisma db seed`
 * can run repeatedly and land on identical state.
 *
 * Money is written in so'm for readability and converted to tiyin (minor
 * units) once, by `toTiyin`, because Prisma stores every monetary column as an
 * integer number of tiyin.
 *
 * `prisma/generate-assets.ts` imports this module as well, so the placeholder
 * images written under `client/public/assets` always match the paths the seed
 * stores in the database.
 *
 * Catalogue text is written per locale. The literals below are the English
 * originals, and every one of them is also a key into `prisma/translations.ru.ts`
 * and `prisma/translations.uz.ts`. `collectCatalogStrings` lists the keys so the
 * seed can check them all before it writes anything, and `buildCatalog` expands
 * each row into three languages.
 */

import { composeDescription, shortDescriptionFor, t, type SeedLocale } from './translations.js';

/** Minor units in one so'm. */
export const TIYIN_PER_SOM = 100;

/** Every seeded account shares this password. Development only. */
export const DEV_PASSWORD = 'ziyo1234';

/**
 * bcryptjs hash of `DEV_PASSWORD` at cost 10, precomputed so seeding is
 * deterministic and does not spend time hashing on every run.
 */
export const DEV_PASSWORD_HASH = '$2b$10$43ikBMtXWOEYZBqXVk6V3ucCMsW06ALBFNT/o24qfK9ynrqJQvoNO';

export function toTiyin(soM: number): number {
  return soM * TIYIN_PER_SOM;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Variant and specification presets
// ---------------------------------------------------------------------------

export type VariantValue = { value: string; priceDeltaSoM?: number };
export type VariantPreset = { name: string; values: VariantValue[] };

const VARIANTS = {
  'apparel-sizes': {
    name: 'Size',
    values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }, { value: 'XL' }],
  },
  'footwear-sizes': {
    name: 'Size',
    values: [{ value: '39' }, { value: '40' }, { value: '41' }, { value: '42' }, { value: '43' }],
  },
  'colors-basic': {
    name: 'Color',
    values: [{ value: 'Black' }, { value: 'Navy' }, { value: 'Sand' }],
  },
  finishes: {
    name: 'Finish',
    values: [{ value: 'Natural Oak' }, { value: 'Walnut' }, { value: 'Matte White' }],
  },
  'bed-sizes': {
    name: 'Size',
    values: [{ value: 'Single' }, { value: 'Double' }, { value: 'King', priceDeltaSoM: 240000 }],
  },
  capacity: {
    name: 'Capacity',
    values: [{ value: '3 L' }, { value: '5 L', priceDeltaSoM: 180000 }],
  },
  storage: {
    name: 'Storage',
    values: [{ value: '128 GB' }, { value: '256 GB', priceDeltaSoM: 800000 }],
  },
} as const satisfies Record<string, VariantPreset>;

export type VariantPresetKey = keyof typeof VARIANTS;

export function variantPreset(key: VariantPresetKey): VariantPreset {
  return VARIANTS[key];
}

export type SpecRow = [group: string, label: string, value: string];

const SPECS: Record<string, SpecRow[]> = {
  apparel: [
    ['Material', 'Composition', '95% cotton, 5% elastane'],
    ['Material', 'Weight', '220 g/m²'],
    ['Care', 'Washing', 'Machine wash at 30°C'],
    ['Care', 'Origin', 'Made in Uzbekistan'],
  ],
  footwear: [
    ['Upper', 'Material', 'Full-grain leather'],
    ['Sole', 'Material', 'Vulcanised rubber'],
    ['Fit', 'Closure', 'Lace-up'],
    ['Care', 'Origin', 'Made in Turkey'],
  ],
  furniture: [
    ['Material', 'Frame', 'Kiln-dried solid wood'],
    ['Material', 'Finish', 'Water-based lacquer'],
    ['Assembly', 'Required', 'Yes, tools included'],
    ['Delivery', 'Weight class', 'Two-person lift'],
  ],
  'home-decor': [
    ['Material', 'Primary', 'Natural fibre'],
    ['Care', 'Cleaning', 'Spot clean only'],
    ['Origin', 'Made in', 'Uzbekistan'],
  ],
  bedding: [
    ['Material', 'Fabric', '100% long-staple cotton'],
    ['Material', 'Thread count', '300 TC'],
    ['Care', 'Washing', 'Machine wash at 40°C'],
  ],
  cookware: [
    ['Material', 'Body', 'Cast aluminium'],
    ['Material', 'Handle', 'Heat-resistant phenolic'],
    ['Use', 'Hob compatibility', 'Gas, electric, induction'],
    ['Care', 'Washing', 'Hand wash recommended'],
  ],
  tableware: [
    ['Material', 'Body', 'Glazed porcelain'],
    ['Use', 'Microwave safe', 'Yes'],
    ['Use', 'Dishwasher safe', 'Yes'],
  ],
  'small-appliances': [
    ['Power', 'Voltage', '220–240 V'],
    ['Power', 'Consumption', '1500 W'],
    ['Warranty', 'Coverage', '24 months'],
    ['Origin', 'Made in', 'China'],
  ],
  beauty: [
    ['Product', 'Volume', '50 ml'],
    ['Product', 'Skin type', 'All skin types'],
    ['Safety', 'Cruelty free', 'Yes'],
    ['Safety', 'Shelf life after opening', '12 months'],
  ],
  smartphones: [
    ['Display', 'Panel', '6.7-inch AMOLED, 120 Hz'],
    ['Battery', 'Capacity', '5000 mAh'],
    ['Camera', 'Main sensor', '50 MP with OIS'],
    ['Warranty', 'Coverage', '24 months'],
  ],
  audio: [
    ['Sound', 'Driver', '11 mm dynamic'],
    ['Battery', 'Playback', 'Up to 30 hours with case'],
    ['Connectivity', 'Bluetooth', '5.3, multipoint'],
    ['Warranty', 'Coverage', '12 months'],
  ],
  laptops: [
    ['Display', 'Panel', '14-inch IPS, 1920 × 1200'],
    ['Performance', 'Memory', '16 GB LPDDR5'],
    ['Storage', 'Drive', '512 GB NVMe SSD'],
    ['Warranty', 'Coverage', '24 months'],
  ],
  'electronics-accessories': [
    ['Compatibility', 'Ports', 'USB-C, USB-A'],
    ['Power', 'Output', '65 W total'],
    ['Warranty', 'Coverage', '12 months'],
  ],
  toys: [
    ['Age', 'Recommended', '5 years and up'],
    ['Safety', 'Certification', 'CE, EN 71'],
    ['Material', 'Primary', 'FSC-certified wood'],
  ],
  grocery: [
    ['Product', 'Net weight', 'See packaging'],
    ['Storage', 'Conditions', 'Cool, dry place'],
    ['Origin', 'Country of origin', 'Uzbekistan'],
  ],
  deals: [
    ['Condition', 'Grade', 'New, end-of-season stock'],
    ['Warranty', 'Coverage', '12 months'],
  ],
};

const SUB_SPEC_PRESET: Record<string, keyof typeof SPECS> = {
  'mens-clothing': 'apparel',
  'womens-clothing': 'apparel',
  'kids-clothing': 'apparel',
  footwear: 'footwear',
  furniture: 'furniture',
  'home-decor': 'home-decor',
  bedding: 'bedding',
  cookware: 'cookware',
  tableware: 'tableware',
  'small-appliances': 'small-appliances',
  skincare: 'beauty',
  makeup: 'beauty',
  haircare: 'beauty',
  fragrance: 'beauty',
  smartphones: 'smartphones',
  audio: 'audio',
  laptops: 'laptops',
  'electronics-accessories': 'electronics-accessories',
  'building-blocks': 'toys',
  'board-games': 'toys',
  'soft-toys': 'toys',
  pantry: 'grocery',
  beverages: 'grocery',
  snacks: 'grocery',
  clearance: 'deals',
  'bundle-deals': 'deals',
};

const SUB_VARIANT_PRESETS: Record<string, VariantPresetKey[]> = {
  'mens-clothing': ['apparel-sizes', 'colors-basic'],
  'womens-clothing': ['apparel-sizes', 'colors-basic'],
  'kids-clothing': ['apparel-sizes'],
  footwear: ['footwear-sizes'],
  furniture: ['finishes'],
  bedding: ['bed-sizes'],
  cookware: ['capacity'],
  smartphones: ['storage'],
};

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type RawProduct = {
  name: string;
  price: number;
  was?: number;
  stock: number;
  rating: number;
  reviews: number;
  featured?: boolean;
  isNew?: boolean;
  hidden?: boolean;
  brand?: string;
  specs?: SpecRow[];
};

export type SubcategorySeed = {
  slug: string;
  name: string;
  description: string;
  blurb: string;
  detail: string;
  brand: string | null;
  products: RawProduct[];
};

export type TopCategorySeed = {
  slug: string;
  name: string;
  description: string;
  code: string;
  children: SubcategorySeed[];
};

export const CATEGORIES: TopCategorySeed[] = [
  {
    slug: 'clothing',
    name: 'Clothing',
    description: 'Everyday and occasion wear for women, men and children.',
    code: 'CLO',
    children: [
      {
        slug: 'mens-clothing',
        name: "Men's Clothing",
        description: 'Shirts, trousers, knitwear and outerwear for men.',
        blurb: 'Cut from breathable fabric with a clean, everyday silhouette.',
        detail: 'Finished with reinforced seams and a shape that survives repeat washing.',
        brand: 'ziyo-wear',
        products: [
          {
            name: "Men's Cotton Oxford Shirt",
            price: 349000,
            stock: 42,
            rating: 4.7,
            reviews: 186,
          },
          {
            name: "Men's Wool Blend Coat",
            price: 1290000,
            was: 1690000,
            stock: 12,
            rating: 4.6,
            reviews: 94,
            featured: true,
          },
          { name: "Men's Slim Fit Chinos", price: 459000, stock: 30, rating: 4.5, reviews: 142 },
          {
            name: "Men's Merino Crewneck Sweater",
            price: 689000,
            stock: 18,
            rating: 4.8,
            reviews: 77,
            isNew: true,
          },
          { name: "Men's Leather Belt", price: 249000, stock: 55, rating: 4.4, reviews: 63 },
        ],
      },
      {
        slug: 'womens-clothing',
        name: "Women's Clothing",
        description: 'Dresses, blouses, knitwear and denim for women.',
        blurb: 'A soft drape and a considered, wearable cut.',
        detail:
          'The fabric holds its colour after washing, and the seams are finished flat so nothing chafes.',
        brand: 'ziyo-wear',
        products: [
          {
            name: "Women's Silk Blend Blouse",
            price: 529000,
            stock: 26,
            rating: 4.6,
            reviews: 118,
          },
          {
            name: "Women's Floral Summer Dress",
            price: 699000,
            was: 899000,
            stock: 22,
            rating: 4.7,
            reviews: 204,
            featured: true,
          },
          {
            name: "Women's Cashmere Cardigan",
            price: 1490000,
            stock: 9,
            rating: 4.9,
            reviews: 58,
          },
          { name: "Women's High-Waist Jeans", price: 599000, stock: 34, rating: 4.5, reviews: 167 },
          { name: "Women's Wool Scarf", price: 289000, stock: 47, rating: 4.6, reviews: 89 },
        ],
      },
      {
        slug: 'kids-clothing',
        name: "Kids' Clothing",
        description: 'Durable everyday clothing for children aged two to twelve.',
        blurb: 'Built for play: soft on skin, tough at the knees.',
        detail: 'Every piece is tested against repeated washing and keeps its shape and colour.',
        brand: 'ziyo-wear',
        products: [
          { name: "Kids' Cotton Hoodie", price: 279000, stock: 40, rating: 4.7, reviews: 132 },
          { name: "Kids' Denim Overalls", price: 319000, stock: 25, rating: 4.5, reviews: 74 },
          {
            name: "Kids' Winter Puffer Jacket",
            price: 749000,
            was: 949000,
            stock: 14,
            rating: 4.8,
            reviews: 96,
            featured: true,
          },
          { name: "Kids' Pajama Set", price: 189000, stock: 60, rating: 4.6, reviews: 151 },
          { name: "Kids' Graphic T-Shirt Set", price: 219000, stock: 52, rating: 4.4, reviews: 88 },
        ],
      },
      {
        slug: 'footwear',
        name: 'Footwear',
        description: 'Shoes and boots for the whole family.',
        blurb: 'Cushioned underfoot and shaped for all-day walking.',
        detail: 'A stitched sole keeps the shoe together far longer than glued construction.',
        brand: 'ziyo-wear',
        products: [
          {
            name: "Men's Leather Derby Shoes",
            price: 1190000,
            stock: 16,
            rating: 4.7,
            reviews: 102,
          },
          {
            name: "Women's Suede Ankle Boots",
            price: 899000,
            was: 1090000,
            stock: 13,
            rating: 4.6,
            reviews: 87,
            featured: true,
          },
          { name: 'Unisex Canvas Sneakers', price: 419000, stock: 38, rating: 4.5, reviews: 213 },
          { name: "Kids' Rain Boots", price: 259000, stock: 28, rating: 4.3, reviews: 65 },
          {
            name: "Men's Running Shoes",
            price: 749000,
            stock: 21,
            rating: 4.8,
            reviews: 176,
            isNew: true,
          },
        ],
      },
    ],
  },
  {
    slug: 'home',
    name: 'Home',
    description: 'Furniture, textiles and decor for every room.',
    code: 'HOM',
    children: [
      {
        slug: 'furniture',
        name: 'Furniture',
        description: 'Tables, seating and storage built from solid wood.',
        blurb: 'Solid wood joinery that gets better with age.',
        detail:
          'Assembled with metal hardware and finished with a low-sheen lacquer that resists marks.',
        brand: 'ziyo-home',
        products: [
          {
            name: 'Solid Oak Dining Table',
            price: 6890000,
            was: 7990000,
            stock: 6,
            rating: 4.8,
            reviews: 64,
            featured: true,
            specs: [
              ['Dimensions', 'Length', '180 cm'],
              ['Dimensions', 'Width', '90 cm'],
              ['Dimensions', 'Height', '75 cm'],
              ['Material', 'Top', 'Solid oak, 40 mm'],
            ],
          },
          { name: 'Walnut Bedside Cabinet', price: 2190000, stock: 11, rating: 4.7, reviews: 48 },
          {
            name: 'Three-Seat Linen Sofa',
            price: 9450000,
            stock: 4,
            rating: 4.6,
            reviews: 39,
            featured: true,
          },
          { name: 'Walnut Bookshelf', price: 2790000, stock: 9, rating: 4.5, reviews: 57 },
          {
            name: 'Ergonomic Study Chair',
            price: 1890000,
            was: 2390000,
            stock: 17,
            rating: 4.7,
            reviews: 143,
            isNew: true,
          },
        ],
      },
      {
        slug: 'home-decor',
        name: 'Home Decor',
        description: 'Rugs, lighting, mirrors and small decorative pieces.',
        blurb: 'Handmade pieces that give a room its character.',
        detail:
          'Produced in small batches, so small variations between items are part of the finish.',
        brand: 'bukhara-craft',
        products: [
          {
            name: 'Handwoven Wool Rug',
            price: 2490000,
            stock: 8,
            rating: 4.8,
            reviews: 71,
            featured: true,
          },
          { name: 'Ceramic Table Lamp', price: 749000, stock: 23, rating: 4.6, reviews: 92 },
          { name: 'Framed Wall Mirror', price: 899000, stock: 15, rating: 4.5, reviews: 46 },
          { name: 'Cotton Cushion Cover Set', price: 219000, stock: 64, rating: 4.4, reviews: 128 },
          { name: 'Scented Soy Candle', price: 129000, stock: 90, rating: 4.7, reviews: 235 },
        ],
      },
      {
        slug: 'bedding',
        name: 'Bedding',
        description: 'Duvet covers, sheets, pillows and blankets.',
        blurb: 'Long-staple cotton woven for a soft, breathable night.',
        detail: 'OEKO-TEX certified and pre-shrunk, so the fit stays true after the first wash.',
        brand: 'ziyo-home',
        products: [
          {
            name: 'Egyptian Cotton Duvet Set',
            price: 1790000,
            was: 2190000,
            stock: 12,
            rating: 4.8,
            reviews: 118,
            featured: true,
          },
          { name: 'Goose Down Pillow', price: 649000, stock: 26, rating: 4.6, reviews: 84 },
          { name: 'Linen Bed Sheet Set', price: 1290000, stock: 14, rating: 4.7, reviews: 67 },
          { name: 'Weighted Blanket', price: 1090000, stock: 10, rating: 4.5, reviews: 73 },
          { name: 'Wool Throw Blanket', price: 549000, stock: 20, rating: 4.6, reviews: 55 },
        ],
      },
    ],
  },
  {
    slug: 'kitchen',
    name: 'Kitchen',
    description: 'Cookware, tableware and countertop appliances.',
    code: 'KIT',
    children: [
      {
        slug: 'cookware',
        name: 'Cookware',
        description: 'Pans, pots and knives for daily cooking.',
        blurb: 'Even heat across the base and a handle that stays cool.',
        detail:
          'Heavy-gauge construction resists warping, and the riveted handle is oven safe to 220°C.',
        brand: 'ziyo-home',
        products: [
          {
            name: 'Cast Iron Dutch Oven',
            price: 1490000,
            was: 1790000,
            stock: 13,
            rating: 4.9,
            reviews: 156,
            featured: true,
          },
          { name: 'Non-Stick Frying Pan Set', price: 749000, stock: 24, rating: 4.5, reviews: 189 },
          { name: 'Stainless Steel Saucepan', price: 529000, stock: 31, rating: 4.6, reviews: 97 },
          {
            name: 'Carbon Steel Wok',
            price: 619000,
            stock: 18,
            rating: 4.7,
            reviews: 82,
            isNew: true,
          },
          { name: 'Kitchen Knife Block Set', price: 1290000, stock: 11, rating: 4.8, reviews: 104 },
        ],
      },
      {
        slug: 'tableware',
        name: 'Tableware',
        description: 'Dinner sets, glassware and serving pieces.',
        blurb: 'Glazed by hand and fired for chip resistance.',
        detail: 'Safe for the dishwasher and the microwave, and stackable in a normal cupboard.',
        brand: 'ziyo-home',
        products: [
          {
            name: 'Porcelain Dinner Set (24 pieces)',
            price: 1690000,
            was: 1990000,
            stock: 9,
            rating: 4.7,
            reviews: 78,
            featured: true,
          },
          {
            name: 'Handmade Ceramic Bowls (Set of 4)',
            price: 449000,
            stock: 28,
            rating: 4.8,
            reviews: 112,
          },
          {
            name: 'Crystal Wine Glasses (Set of 6)',
            price: 859000,
            stock: 16,
            rating: 4.6,
            reviews: 59,
          },
          {
            name: 'Stainless Steel Cutlery Set',
            price: 699000,
            stock: 22,
            rating: 4.5,
            reviews: 91,
          },
          { name: 'Bamboo Serving Tray', price: 259000, stock: 37, rating: 4.4, reviews: 66 },
        ],
      },
      {
        slug: 'small-appliances',
        name: 'Small Appliances',
        description: 'Countertop appliances for everyday cooking.',
        blurb: 'Simple controls and parts that come apart for cleaning.',
        detail: 'Ships with a local two-pin plug and a two-year warranty handled in Tashkent.',
        brand: 'ziyo-home',
        products: [
          { name: 'Electric Kettle 1.7L', price: 399000, stock: 33, rating: 4.6, reviews: 224 },
          {
            name: 'Stand Mixer 5L',
            price: 2890000,
            was: 3290000,
            stock: 7,
            rating: 4.8,
            reviews: 88,
            featured: true,
          },
          { name: 'Air Fryer 6L', price: 1790000, stock: 19, rating: 4.7, reviews: 197 },
          {
            name: 'Espresso Coffee Machine',
            price: 3490000,
            stock: 8,
            rating: 4.7,
            reviews: 119,
            isNew: true,
          },
          { name: 'Blender with Glass Jar', price: 849000, stock: 21, rating: 4.4, reviews: 143 },
        ],
      },
    ],
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    description: 'Skincare, makeup, haircare and fragrance.',
    code: 'BEA',
    children: [
      {
        slug: 'skincare',
        name: 'Skincare',
        description: 'Cleansers, serums, moisturisers and sun protection.',
        blurb: 'A short ingredient list with the actives high on it.',
        detail:
          'Dermatologically tested, fragrance free, and packed in airless pumps that keep the formula stable.',
        brand: 'silk-road-beauty',
        products: [
          {
            name: 'Vitamin C Brightening Serum',
            price: 329000,
            stock: 44,
            rating: 4.8,
            reviews: 312,
            featured: true,
          },
          {
            name: 'Hyaluronic Acid Day Cream',
            price: 289000,
            stock: 51,
            rating: 4.7,
            reviews: 268,
          },
          { name: 'Gentle Foaming Cleanser', price: 179000, stock: 68, rating: 4.6, reviews: 341 },
          {
            name: 'SPF 50 Sunscreen Fluid',
            price: 219000,
            was: 259000,
            stock: 57,
            rating: 4.7,
            reviews: 289,
            featured: true,
          },
        ],
      },
      {
        slug: 'makeup',
        name: 'Makeup',
        description: 'Colour cosmetics for lips, eyes and complexion.',
        blurb: 'Pigment that goes on evenly and stays put through the day.',
        detail: 'Tested on a range of skin tones in the Tashkent studio, and never on animals.',
        brand: 'silk-road-beauty',
        products: [
          { name: 'Matte Liquid Lipstick', price: 149000, stock: 72, rating: 4.6, reviews: 402 },
          {
            name: 'Mineral Foundation Powder',
            price: 249000,
            stock: 39,
            rating: 4.5,
            reviews: 187,
          },
          { name: 'Volumizing Mascara', price: 169000, stock: 63, rating: 4.7, reviews: 233 },
          {
            name: 'Eyeshadow Palette (12 Shades)',
            price: 359000,
            stock: 27,
            rating: 4.8,
            reviews: 141,
            isNew: true,
          },
        ],
      },
      {
        slug: 'haircare',
        name: 'Haircare',
        description: 'Shampoo, conditioner, treatments and styling tools.',
        blurb: 'Sulphate free and formulated for hard local water.',
        detail: 'Leaves the cuticle smooth, so hair dries without a heavy coating or residue.',
        brand: 'silk-road-beauty',
        products: [
          { name: 'Argan Oil Repair Shampoo', price: 139000, stock: 80, rating: 4.6, reviews: 356 },
          { name: 'Silk Protein Conditioner', price: 149000, stock: 74, rating: 4.7, reviews: 294 },
          {
            name: 'Hair Growth Serum',
            price: 379000,
            was: 449000,
            stock: 25,
            rating: 4.5,
            reviews: 176,
            featured: true,
          },
          {
            name: 'Ceramic Hair Straightener',
            price: 899000,
            stock: 17,
            rating: 4.6,
            reviews: 128,
          },
        ],
      },
      {
        slug: 'fragrance',
        name: 'Fragrance',
        description: 'Eau de parfum, eau de toilette and body mists.',
        blurb: 'Composed in small batches with a long, warm dry-down.',
        detail: 'Alcohol-based and supplied in a refillable glass bottle with a travel atomiser.',
        brand: 'silk-road-beauty',
        products: [
          {
            name: 'Amber Oud Eau de Parfum 50ml',
            price: 1890000,
            stock: 12,
            rating: 4.9,
            reviews: 154,
            featured: true,
          },
          { name: 'Rose Water Body Mist', price: 199000, stock: 58, rating: 4.5, reviews: 211 },
          {
            name: 'Sandalwood Eau de Toilette 100ml',
            price: 1240000,
            was: 1490000,
            stock: 14,
            rating: 4.7,
            reviews: 96,
          },
        ],
      },
    ],
  },
  {
    slug: 'electronics',
    name: 'Electronics',
    description: 'Phones, audio, computers and accessories.',
    code: 'ELE',
    children: [
      {
        slug: 'smartphones',
        name: 'Smartphones',
        description: 'Ziyo handsets with local warranty and service.',
        blurb: 'A bright display, a battery that lasts the day, and a clean build of Android.',
        detail: 'Sold with a two-year local warranty and serviced at the Ziyo centre in Tashkent.',
        brand: 'tashkent-tech',
        products: [
          {
            name: 'Ziyo Phone X5 128GB',
            price: 6490000,
            was: 6990000,
            stock: 15,
            rating: 4.6,
            reviews: 218,
            featured: true,
          },
          {
            name: 'Ziyo Phone X5 Pro 256GB',
            price: 9890000,
            stock: 10,
            rating: 4.8,
            reviews: 132,
            featured: true,
          },
          { name: 'Ziyo Phone A3 64GB', price: 2790000, stock: 24, rating: 4.4, reviews: 276 },
          {
            name: 'Ziyo Phone X5 Lite 128GB',
            price: 4490000,
            stock: 19,
            rating: 4.5,
            reviews: 164,
          },
          {
            name: 'Ziyo Phone X5 256GB',
            price: 7290000,
            stock: 12,
            rating: 4.7,
            reviews: 98,
            isNew: true,
          },
        ],
      },
      {
        slug: 'audio',
        name: 'Audio',
        description: 'Headphones, earbuds and speakers.',
        blurb: 'Tuned for warmth, with active noise cancelling on the flagship models.',
        detail:
          'Pairs with two devices at once and charges over USB-C from empty in about an hour.',
        brand: 'anor-audio',
        products: [
          {
            name: 'Anor Buds Pro Wireless Earbuds',
            price: 1290000,
            was: 1590000,
            stock: 32,
            rating: 4.7,
            reviews: 287,
            featured: true,
          },
          {
            name: 'Anor Studio Over-Ear Headphones',
            price: 2490000,
            stock: 14,
            rating: 4.8,
            reviews: 143,
          },
          { name: 'Anor Soundbar 2.1', price: 3290000, stock: 9, rating: 4.6, reviews: 76 },
          {
            name: 'Anor Go Bluetooth Speaker',
            price: 749000,
            stock: 28,
            rating: 4.5,
            reviews: 198,
          },
          { name: 'Anor Buds Lite Earbuds', price: 549000, stock: 41, rating: 4.4, reviews: 232 },
        ],
      },
      {
        slug: 'laptops',
        name: 'Laptops',
        description: 'Ultrabooks and gaming laptops for work and study.',
        blurb: 'Aluminium chassis, quiet fans, and a keyboard made for long sessions.',
        detail:
          'Supplied with a 65 W USB-C charger, a UK/EU adapter set and a two-year local warranty.',
        brand: 'tashkent-tech',
        products: [
          {
            name: 'Tashkent Tech UltraBook 14',
            price: 14900000,
            was: 16900000,
            stock: 6,
            rating: 4.7,
            reviews: 68,
            featured: true,
            specs: [
              ['Display', 'Panel', '14-inch IPS, 1920 × 1200'],
              ['Performance', 'Processor', '8-core, 3.4 GHz boost'],
              ['Performance', 'Memory', '16 GB LPDDR5'],
              ['Storage', 'Drive', '512 GB NVMe SSD'],
            ],
          },
          {
            name: 'Tashkent Tech ProBook 15',
            price: 18900000,
            stock: 4,
            rating: 4.8,
            reviews: 41,
            specs: [
              ['Display', 'Panel', '15.6-inch IPS, 2560 × 1600'],
              ['Performance', 'Processor', '10-core, 4.1 GHz boost'],
              ['Performance', 'Memory', '32 GB LPDDR5'],
              ['Storage', 'Drive', '1 TB NVMe SSD'],
            ],
          },
          {
            name: 'Tashkent Tech GamingBook 16',
            price: 19900000,
            stock: 3,
            rating: 4.6,
            reviews: 29,
            isNew: true,
            specs: [
              ['Display', 'Panel', '16-inch IPS, 165 Hz'],
              ['Performance', 'Graphics', '8 GB discrete GPU'],
              ['Performance', 'Memory', '32 GB DDR5'],
              ['Storage', 'Drive', '1 TB NVMe SSD'],
            ],
          },
          {
            name: 'Tashkent Tech ChromeBook 11',
            price: 5990000,
            stock: 11,
            rating: 4.3,
            reviews: 87,
            specs: [
              ['Display', 'Panel', '11.6-inch IPS, 1366 × 768'],
              ['Performance', 'Memory', '8 GB LPDDR4'],
              ['Storage', 'Drive', '128 GB eMMC'],
              ['Warranty', 'Coverage', '24 months'],
            ],
          },
          {
            name: 'Tashkent Tech UltraBook 14 OLED',
            price: 17400000,
            stock: 5,
            rating: 4.9,
            reviews: 52,
            featured: true,
            specs: [
              ['Display', 'Panel', '14-inch OLED, 2880 × 1800'],
              ['Performance', 'Processor', '8-core, 3.6 GHz boost'],
              ['Performance', 'Memory', '16 GB LPDDR5'],
              ['Storage', 'Drive', '1 TB NVMe SSD'],
            ],
          },
        ],
      },
      {
        slug: 'electronics-accessories',
        name: 'Accessories',
        description: 'Chargers, cables, power banks and sleeves.',
        blurb: 'Certified for local mains voltage and built to survive a bag.',
        detail: 'Every unit is over-current protected and tested before it leaves the warehouse.',
        brand: 'tashkent-tech',
        products: [
          { name: 'Anor Fast Charger 65W', price: 349000, stock: 48, rating: 4.6, reviews: 176 },
          { name: 'Braided USB-C Cable 2m', price: 89000, stock: 120, rating: 4.5, reviews: 428 },
          {
            name: '20000mAh Power Bank',
            price: 549000,
            was: 649000,
            stock: 35,
            rating: 4.7,
            reviews: 253,
            featured: true,
          },
          { name: 'Wireless Charging Pad', price: 299000, stock: 42, rating: 4.3, reviews: 118 },
          { name: 'Laptop Sleeve 14"', price: 219000, stock: 39, rating: 4.4, reviews: 94 },
        ],
      },
    ],
  },
  {
    slug: 'toys',
    name: 'Toys',
    description: 'Building sets, games and plush toys for children.',
    code: 'TOY',
    children: [
      {
        slug: 'building-blocks',
        name: 'Building Blocks',
        description: 'Wooden blocks, brick sets and magnetic tiles.',
        blurb: 'Edges are sanded smooth and everything survives a dropped box.',
        detail: 'Tested to EN 71 and packed in a sturdy box that doubles as storage.',
        brand: 'bukhara-craft',
        products: [
          {
            name: 'Wooden Building Blocks 100 Pieces',
            price: 449000,
            stock: 26,
            rating: 4.8,
            reviews: 147,
          },
          {
            name: 'City Builder Brick Set 850 Pieces',
            price: 1090000,
            stock: 12,
            rating: 4.7,
            reviews: 118,
            featured: true,
          },
          {
            name: 'Magnetic Tile Set 60 Pieces',
            price: 749000,
            was: 899000,
            stock: 18,
            rating: 4.8,
            reviews: 203,
            featured: true,
          },
          {
            name: 'Robot Engineer Building Kit',
            price: 659000,
            stock: 15,
            rating: 4.5,
            reviews: 76,
            isNew: true,
          },
        ],
      },
      {
        slug: 'board-games',
        name: 'Board Games',
        description: 'Family games, puzzles and strategy titles.',
        blurb: 'Rules that a new player can learn in one sitting.',
        detail: 'Components are printed on recycled board with a linen finish that resists glare.',
        brand: 'bukhara-craft',
        products: [
          { name: 'Uzbek Family Board Game', price: 289000, stock: 33, rating: 4.7, reviews: 162 },
          {
            name: 'Strategy Card Game Deluxe',
            price: 349000,
            stock: 27,
            rating: 4.6,
            reviews: 131,
          },
          { name: 'Wooden Chess Set', price: 549000, stock: 16, rating: 4.8, reviews: 88 },
          {
            name: '1000-Piece Landscape Puzzle',
            price: 219000,
            stock: 44,
            rating: 4.5,
            reviews: 174,
          },
        ],
      },
      {
        slug: 'soft-toys',
        name: 'Soft Toys',
        description: 'Plush animals and comfort toys.',
        blurb: 'Stitched with reinforced seams and filled with hypoallergenic fibre.',
        detail: 'Surface washable, and every batch is pull-tested before it is boxed.',
        brand: 'bukhara-craft',
        products: [
          { name: 'Plush Camel Toy 40cm', price: 229000, stock: 51, rating: 4.7, reviews: 189 },
          { name: 'Plush Bear with Hoodie', price: 279000, stock: 38, rating: 4.6, reviews: 143 },
          { name: 'Handmade Felt Animal Set', price: 319000, stock: 24, rating: 4.8, reviews: 97 },
          {
            name: 'Weighted Sensory Plush Owl',
            price: 359000,
            was: 419000,
            stock: 20,
            rating: 4.5,
            reviews: 112,
          },
        ],
      },
    ],
  },
  {
    slug: 'grocery',
    name: 'Grocery',
    description: 'Pantry staples, drinks and snacks.',
    code: 'GRO',
    children: [
      {
        slug: 'pantry',
        name: 'Pantry',
        description: 'Rice, oils, grains and honey.',
        blurb: 'Bought in season from growers and packed close to harvest.',
        detail: 'Sealed in food-grade packaging with the harvest year printed on the back.',
        brand: null,
        products: [
          {
            name: 'Uzbek Long Grain Rice 5kg',
            price: 189000,
            stock: 64,
            rating: 4.7,
            reviews: 208,
          },
          {
            name: 'Extra Virgin Olive Oil 1L',
            price: 249000,
            stock: 42,
            rating: 4.6,
            reviews: 137,
          },
          { name: 'Buckwheat Groats 1kg', price: 69000, stock: 88, rating: 4.5, reviews: 246 },
          {
            name: 'Wild Forest Honey 500g',
            price: 219000,
            was: 259000,
            stock: 36,
            rating: 4.8,
            reviews: 164,
            featured: true,
          },
          { name: 'Sunflower Oil 5L', price: 179000, stock: 55, rating: 4.4, reviews: 192 },
        ],
      },
      {
        slug: 'beverages',
        name: 'Beverages',
        description: 'Tea, coffee, juices and water.',
        blurb: 'Sourced from growers we buy from year after year.',
        detail: 'Packed in light-blocking material so the aroma survives the shelf.',
        brand: null,
        products: [
          { name: 'Green Tea Leaves 250g', price: 79000, stock: 96, rating: 4.7, reviews: 318 },
          {
            name: 'Ground Arabica Coffee 500g',
            price: 189000,
            stock: 47,
            rating: 4.6,
            reviews: 226,
            isNew: true,
          },
          { name: 'Pomegranate Juice 1L', price: 45000, stock: 110, rating: 4.5, reviews: 184 },
          {
            name: 'Mineral Water 1.5L (Pack of 6)',
            price: 59000,
            stock: 130,
            rating: 4.4,
            reviews: 402,
          },
        ],
      },
      {
        slug: 'snacks',
        name: 'Snacks',
        description: 'Dried fruit, nuts and sweets.',
        blurb: 'Dried without added sugar and packed the week it is sorted.',
        detail: 'Resealable pouches keep the fruit soft after the first opening.',
        brand: null,
        products: [
          { name: 'Dried Apricots 500g', price: 99000, stock: 74, rating: 4.6, reviews: 231 },
          { name: 'Walnut Kernels 500g', price: 189000, stock: 52, rating: 4.7, reviews: 176 },
          {
            name: 'Assorted Halva Box 800g',
            price: 139000,
            was: 169000,
            stock: 44,
            rating: 4.5,
            reviews: 148,
          },
          {
            name: 'Dark Chocolate 70% Bar 100g',
            price: 39000,
            stock: 150,
            rating: 4.8,
            reviews: 367,
          },
        ],
      },
    ],
  },
  {
    slug: 'deals',
    name: 'Deals',
    description: 'Discounted stock and money-saving bundles.',
    code: 'DEA',
    children: [
      {
        slug: 'clearance',
        name: 'Clearance',
        description: 'End-of-season stock at reduced prices.',
        blurb: 'Last pieces from a finished season, sold well below list price.',
        detail: 'Stock is limited and not restocked, so the price only goes one way from here.',
        brand: null,
        products: [
          {
            name: 'Cotton Bath Towel Set (Clearance)',
            price: 199000,
            was: 349000,
            stock: 22,
            rating: 4.5,
            reviews: 118,
          },
          {
            name: 'Stainless Steel Water Bottle 1L',
            price: 89000,
            was: 149000,
            stock: 47,
            rating: 4.4,
            reviews: 214,
          },
          {
            name: 'Desk Organizer Bamboo',
            price: 129000,
            was: 219000,
            stock: 33,
            rating: 4.6,
            reviews: 96,
          },
          {
            name: 'Travel Backpack 30L',
            price: 399000,
            was: 649000,
            stock: 18,
            rating: 4.7,
            reviews: 152,
          },
          {
            name: 'Ceramic Plant Pot Trio',
            price: 159000,
            was: 249000,
            stock: 29,
            rating: 4.3,
            reviews: 74,
          },
        ],
      },
      {
        slug: 'bundle-deals',
        name: 'Bundle Deals',
        description: 'Curated sets priced below the sum of their parts.',
        blurb: 'A set of things that are used together, priced as one purchase.',
        detail: 'Bundles ship in a single parcel and are covered by one warranty period.',
        brand: null,
        products: [
          {
            name: 'Kitchen Essentials Bundle',
            price: 1990000,
            was: 2450000,
            stock: 8,
            rating: 4.8,
            reviews: 63,
            featured: true,
          },
          {
            name: 'Skincare Starter Bundle',
            price: 749000,
            was: 929000,
            stock: 21,
            rating: 4.7,
            reviews: 187,
          },
          {
            name: 'Home Office Bundle',
            price: 3290000,
            was: 3990000,
            stock: 6,
            rating: 4.6,
            reviews: 48,
          },
          {
            name: 'Tea and Sweets Gift Bundle',
            price: 449000,
            was: 549000,
            stock: 34,
            rating: 4.5,
            reviews: 129,
          },
          {
            name: 'Kids Play Bundle',
            price: 899000,
            was: 1090000,
            stock: 13,
            rating: 4.7,
            reviews: 81,
            hidden: true,
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export type BrandSeed = { slug: string; name: string; tagline: string };

export const BRANDS: BrandSeed[] = [
  { slug: 'ziyo-wear', name: 'Ziyo Wear', tagline: 'Everyday clothing made in Uzbekistan.' },
  { slug: 'ziyo-home', name: 'Ziyo Home', tagline: 'Furniture, textiles and kitchenware.' },
  { slug: 'anor-audio', name: 'Anor Audio', tagline: 'Personal audio tuned in Tashkent.' },
  {
    slug: 'silk-road-beauty',
    name: 'Silk Road Beauty',
    tagline: 'Skincare built on botanical actives.',
  },
  {
    slug: 'bukhara-craft',
    name: 'Bukhara Craft',
    tagline: 'Handmade decor, toys and board games.',
  },
  {
    slug: 'tashkent-tech',
    name: 'Tashkent Tech',
    tagline: 'Phones and computers with local service.',
  },
];

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

export type DeliveryZoneSeed = {
  code: string;
  name: string;
  /** Inclusive postal-code range, as whole numbers. */
  zipFrom: number;
  zipTo: number;
  deliveryDaysMin: number;
  deliveryDaysMax: number;
  /** So'm; the seed converts to minor units when it writes the row. */
  feeSoM: number;
  pickupAvailable: boolean;
};

/**
 * The service areas, narrowest first.
 *
 * Order is the rule for overlapping ranges: a Tashkent address is inside both
 * its own city range and the country-wide one that has to exist for the codes
 * nobody enumerated, and the city is the honest answer. So the array is written
 * in priority order and the seed stores that order in `sortOrder`.
 */
export const DELIVERY_ZONES: DeliveryZoneSeed[] = [
  {
    code: 'tashkent-city',
    name: 'Tashkent',
    zipFrom: 100_000,
    zipTo: 100_214,
    deliveryDaysMin: 1,
    deliveryDaysMax: 2,
    feeSoM: 15_000,
    pickupAvailable: true,
  },
  {
    code: 'tashkent-region',
    name: 'Tashkent region',
    zipFrom: 110_000,
    zipTo: 119_999,
    deliveryDaysMin: 2,
    deliveryDaysMax: 3,
    feeSoM: 25_000,
    pickupAvailable: true,
  },
  {
    code: 'samarkand-region',
    name: 'Samarkand region',
    zipFrom: 140_000,
    zipTo: 149_999,
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
    feeSoM: 30_000,
    pickupAvailable: true,
  },
  {
    code: 'namangan-region',
    name: 'Namangan region',
    zipFrom: 160_000,
    zipTo: 169_999,
    deliveryDaysMin: 3,
    deliveryDaysMax: 5,
    feeSoM: 35_000,
    pickupAvailable: false,
  },
  {
    code: 'bukhara-region',
    name: 'Bukhara region',
    zipFrom: 200_000,
    zipTo: 209_999,
    deliveryDaysMin: 3,
    deliveryDaysMax: 5,
    feeSoM: 35_000,
    pickupAvailable: true,
  },
  {
    code: 'rest-of-country',
    name: 'Rest of Uzbekistan',
    zipFrom: 100_000,
    zipTo: 999_999,
    deliveryDaysMin: 4,
    deliveryDaysMax: 7,
    feeSoM: 45_000,
    pickupAvailable: false,
  },
];

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export type PromoCodeSeed = {
  /** Written and stored uppercase; the service normalises what is typed. */
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  /** Whole percent for `PERCENT`, so'm for `FIXED`. */
  value: number;
  /** Ceiling in so'm for a percentage, or `null` for no ceiling. */
  maxDiscountSoM: number | null;
  /** So'm the basket has to reach, as a whole amount. */
  minSubtotalSoM: number;
  /** Days from the seed run until the code stops working; `null` never expires. */
  expiresInDays: number | null;
  isActive: boolean;
};

/**
 * The codes the store hands out.
 *
 * Three of them, chosen to cover the three shapes the checkout has to handle: a
 * percentage with a ceiling, a percentage with no ceiling only reachable on a
 * large basket, and a fixed amount with a minimum spend. `WELCOME10` is the one
 * a shopper meets first — it works on any basket and takes a tenth off, up to
 * 50 000 so'm.
 *
 * One code in the list is switched off, so the "this code is no longer
 * available" path is reachable on a fresh database rather than only in a test.
 * `expiresInDays` is counted at seed time, which keeps the seed deterministic in
 * shape: a code is always dated relative to when the database was built.
 */
export const PROMO_CODES: PromoCodeSeed[] = [
  {
    code: 'WELCOME10',
    discountType: 'PERCENT',
    value: 10,
    maxDiscountSoM: 50_000,
    minSubtotalSoM: 0,
    expiresInDays: null,
    isActive: true,
  },
  {
    code: 'BIGBASKET15',
    discountType: 'PERCENT',
    value: 15,
    maxDiscountSoM: null,
    minSubtotalSoM: 2_000_000,
    expiresInDays: 90,
    isActive: true,
  },
  {
    code: 'SAVE25K',
    discountType: 'FIXED',
    value: 25_000,
    maxDiscountSoM: null,
    minSubtotalSoM: 300_000,
    expiresInDays: 90,
    isActive: true,
  },
  {
    code: 'SUMMER20',
    discountType: 'PERCENT',
    value: 20,
    maxDiscountSoM: 200_000,
    minSubtotalSoM: 0,
    expiresInDays: 30,
    isActive: false,
  },
];

// ---------------------------------------------------------------------------
// Accounts
// ---------------------------------------------------------------------------

export type AddressSeed = {
  label: string;
  fullName: string;
  phone: string;
  country: string;
  city: string;
  street: string;
  postalCode: string | null;
  isDefault: boolean;
};

export type UserSeed = {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  addresses: AddressSeed[];
};

export const USERS: UserSeed[] = [
  {
    email: 'oybek.karimov@ziyo.uz',
    firstName: 'Oybek',
    lastName: 'Karimov',
    phone: '+998 90 123 45 67',
    addresses: [
      {
        label: 'Home',
        fullName: 'Oybek Karimov',
        phone: '+998 90 123 45 67',
        country: 'Uzbekistan',
        city: 'Tashkent',
        street: 'Amir Temur Avenue 107B, Apartment 24',
        postalCode: '100084',
        isDefault: true,
      },
      {
        label: 'Office',
        fullName: 'Oybek Karimov',
        phone: '+998 90 123 45 67',
        country: 'Uzbekistan',
        city: 'Tashkent',
        street: 'Mirabad District, Afrosiyob Street 12',
        postalCode: '100015',
        isDefault: false,
      },
    ],
  },
  {
    email: 'nilufar.rashidova@ziyo.uz',
    firstName: 'Nilufar',
    lastName: 'Rashidova',
    phone: '+998 93 555 21 08',
    addresses: [
      {
        label: 'Home',
        fullName: 'Nilufar Rashidova',
        phone: '+998 93 555 21 08',
        country: 'Uzbekistan',
        city: 'Samarkand',
        street: 'Registan Street 41, Apartment 7',
        postalCode: '140100',
        isDefault: true,
      },
    ],
  },
  {
    email: 'sardor.tursunov@ziyo.uz',
    firstName: 'Sardor',
    lastName: 'Tursunov',
    phone: '+998 97 240 76 33',
    addresses: [
      {
        label: 'Home',
        fullName: 'Sardor Tursunov',
        phone: '+998 97 240 76 33',
        country: 'Uzbekistan',
        city: 'Bukhara',
        street: 'Bahouddin Naqshband Street 8',
        postalCode: '200100',
        isDefault: true,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export type OrderStatusSeed =
  'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export type OrderItemSeed = { productSlug: string; quantity: number };

export type OrderSeed = {
  orderNumber: string;
  userEmail: string;
  status: OrderStatusSeed;
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'CARD' | 'CASH';
  deliveryMethod: 'COURIER' | 'PICKUP';
  shippingTotalSoM: number;
  discountTotalSoM: number;
  notes: string | null;
  createdAt: string;
  shipping: {
    country: string;
    city: string;
    street: string;
    postalCode: string | null;
    phone: string;
  };
  items: OrderItemSeed[];
};

export const ORDERS: OrderSeed[] = [
  {
    orderNumber: 'ZY-2026-1001',
    userEmail: 'oybek.karimov@ziyo.uz',
    status: 'DELIVERED',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
    deliveryMethod: 'COURIER',
    shippingTotalSoM: 25000,
    discountTotalSoM: 0,
    notes: 'Please call on arrival.',
    createdAt: '2026-06-02T09:12:00.000Z',
    shipping: {
      country: 'Uzbekistan',
      city: 'Tashkent',
      street: 'Amir Temur Avenue 107B, Apartment 24',
      postalCode: '100084',
      phone: '+998 90 123 45 67',
    },
    items: [
      { productSlug: 'mens-cotton-oxford-shirt', quantity: 2 },
      { productSlug: 'mens-slim-fit-chinos', quantity: 1 },
      { productSlug: 'mens-leather-belt', quantity: 1 },
    ],
  },
  {
    orderNumber: 'ZY-2026-1002',
    userEmail: 'oybek.karimov@ziyo.uz',
    status: 'SHIPPED',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
    deliveryMethod: 'COURIER',
    shippingTotalSoM: 25000,
    discountTotalSoM: 0,
    notes: null,
    createdAt: '2026-07-21T14:45:00.000Z',
    shipping: {
      country: 'Uzbekistan',
      city: 'Tashkent',
      street: 'Mirabad District, Afrosiyob Street 12',
      postalCode: '100015',
      phone: '+998 90 123 45 67',
    },
    items: [
      { productSlug: 'anor-buds-pro-wireless-earbuds', quantity: 1 },
      { productSlug: 'anor-fast-charger-65w', quantity: 1 },
    ],
  },
  {
    orderNumber: 'ZY-2026-1003',
    userEmail: 'oybek.karimov@ziyo.uz',
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    deliveryMethod: 'PICKUP',
    shippingTotalSoM: 0,
    discountTotalSoM: 0,
    notes: 'Collecting from the Tashkent pickup point.',
    createdAt: '2026-08-30T07:05:00.000Z',
    shipping: {
      country: 'Uzbekistan',
      city: 'Tashkent',
      street: 'Ziyo pickup point, Yunusabad District',
      postalCode: null,
      phone: '+998 90 123 45 67',
    },
    items: [
      { productSlug: 'cast-iron-dutch-oven', quantity: 1 },
      { productSlug: 'handmade-ceramic-bowls-set-of-4', quantity: 1 },
    ],
  },
  {
    orderNumber: 'ZY-2026-1004',
    userEmail: 'nilufar.rashidova@ziyo.uz',
    status: 'PROCESSING',
    paymentStatus: 'PAID',
    paymentMethod: 'CARD',
    deliveryMethod: 'COURIER',
    shippingTotalSoM: 30000,
    discountTotalSoM: 15000,
    notes: null,
    createdAt: '2026-09-05T11:30:00.000Z',
    shipping: {
      country: 'Uzbekistan',
      city: 'Samarkand',
      street: 'Registan Street 41, Apartment 7',
      postalCode: '140100',
      phone: '+998 93 555 21 08',
    },
    items: [
      { productSlug: 'womens-floral-summer-dress', quantity: 1 },
      { productSlug: 'womens-wool-scarf', quantity: 2 },
      { productSlug: 'scented-soy-candle', quantity: 3 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Review copy
// ---------------------------------------------------------------------------

export const REVIEW_TITLES = [
  'Exactly as described',
  'Great value for the price',
  'Better than I expected',
  'Good quality',
  'Would buy again',
  'Solid purchase',
  'Happy with it',
  'Does the job well',
];

export function reviewBody(productName: string, variant: number): string {
  const bodies = [
    `Ordered ${productName} and it arrived in Tashkent three days later, well packed. Quality is what the photos suggested and I have used it daily since.`,
    `${productName} matches the description closely. The finish is clean and nothing felt cheap when I unpacked it.`,
    `I compared a few options before buying ${productName}. This one had the best balance of price and build, and it has held up so far.`,
    `${productName} does exactly what I needed. Delivery was quick and the courier called ahead, which I appreciated.`,
    `Second one I have bought. ${productName} is consistent between batches and the price is fair for the quality.`,
  ];
  return bodies[variant % bodies.length];
}

// ---------------------------------------------------------------------------
// Derived shapes used by the seed and the asset generator
// ---------------------------------------------------------------------------

export type ProductSeed = {
  slug: string;
  name: string;
  nameRu: string;
  nameUz: string;
  sku: string;
  categorySlug: string;
  brandSlug: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  shortDescription: string;
  shortDescriptionRu: string;
  shortDescriptionUz: string;
  description: string;
  descriptionRu: string;
  descriptionUz: string;
  createdAt: Date;
  imageUrls: string[];
  variantPresetKeys: VariantPresetKey[];
  specs: SpecRow[];
};

export type CategorySeed = {
  slug: string;
  name: string;
  nameRu: string;
  nameUz: string;
  description: string;
  descriptionRu: string;
  descriptionUz: string;
  imageUrl: string;
  parentSlug: string | null;
  sortOrder: number;
};

/** Base date for deterministic `createdAt` values. */
const CATALOG_EPOCH = Date.UTC(2026, 0, 5, 8, 0, 0);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The extension the catalog artwork is stored with.
 *
 * The seed writes paths, not files, and the file behind a path is put there by
 * `prisma/fetch-photos.ts`, which downloads a real photograph from Wikimedia
 * Commons. It used to be an SVG drawn by `prisma/generate-assets.ts`; that
 * script still runs and still writes its placeholders, but nothing references
 * them any more, and the extension here is what decides which of the two the
 * storefront reads.
 */
const ARTWORK_EXTENSION = 'jpg';

/** Secondary gallery image. Only featured products carry one. */
export function secondImageUrl(product: Pick<ProductSeed, 'slug' | 'isFeatured'>): string | null {
  return product.isFeatured ? `/assets/products/${product.slug}-alt.${ARTWORK_EXTENSION}` : null;
}

export function productImageUrls(product: Pick<ProductSeed, 'slug' | 'isFeatured'>): string[] {
  const primary = `/assets/products/${product.slug}.${ARTWORK_EXTENSION}`;
  const secondary = secondImageUrl(product);
  return secondary === null ? [primary] : [primary, secondary];
}

export function categoryImageUrl(slug: string): string {
  return `/assets/categories/${slug}.${ARTWORK_EXTENSION}`;
}

export function brandLogoUrl(slug: string): string {
  return `/assets/brands/${slug}.svg`;
}

/** Expands the literals above into the rows the seed writes. */
export function buildCatalog(): { categories: CategorySeed[]; products: ProductSeed[] } {
  const categories: CategorySeed[] = [];
  const products: ProductSeed[] = [];
  const brandNames = new Map(BRANDS.map((brand) => [brand.slug, brand.name]));

  CATEGORIES.forEach((top, topIndex) => {
    categories.push({
      slug: top.slug,
      name: top.name,
      nameRu: t('ru', top.name),
      nameUz: t('uz', top.name),
      description: top.description,
      descriptionRu: t('ru', top.description),
      descriptionUz: t('uz', top.description),
      imageUrl: categoryImageUrl(top.slug),
      parentSlug: null,
      sortOrder: topIndex,
    });

    top.children.forEach((sub, subIndex) => {
      categories.push({
        slug: sub.slug,
        name: sub.name,
        nameRu: t('ru', sub.name),
        nameUz: t('uz', sub.name),
        description: sub.description,
        descriptionRu: t('ru', sub.description),
        descriptionUz: t('uz', sub.description),
        imageUrl: categoryImageUrl(sub.slug),
        parentSlug: top.slug,
        sortOrder: subIndex,
      });

      sub.products.forEach((raw) => {
        const slug = slugify(raw.name);
        const brandSlug = raw.brand ?? sub.brand;
        const brandName = brandSlug ? brandNames.get(brandSlug) : undefined;
        const sku = `${top.code}-${String(products.length + 1).padStart(4, '0')}`;
        const isFeatured = raw.featured === true;
        const isNew = raw.isNew === true;

        // The description is assembled, not looked up: the same blurb and the
        // same detail serve every product in the subcategory, and only the
        // closing sentence is about this product. Building it per locale keeps
        // a Russian description Russian end to end instead of a Russian name
        // inside an English sentence.
        const describe = (locale: SeedLocale): string =>
          composeDescription(locale, {
            name: raw.name,
            brand: brandName ?? null,
            shortDescription: sub.blurb,
            detail: sub.detail,
          });

        const product: ProductSeed = {
          slug,
          name: raw.name,
          nameRu: t('ru', raw.name),
          nameUz: t('uz', raw.name),
          sku,
          categorySlug: sub.slug,
          brandSlug,
          price: toTiyin(raw.price),
          compareAtPrice: raw.was === undefined ? null : toTiyin(raw.was),
          stock: raw.stock,
          rating: raw.rating,
          reviewCount: raw.reviews,
          isActive: raw.hidden !== true,
          isFeatured,
          isNew,
          shortDescription: sub.blurb,
          shortDescriptionRu: shortDescriptionFor('ru', sub.blurb),
          shortDescriptionUz: shortDescriptionFor('uz', sub.blurb),
          description: describe('en'),
          descriptionRu: describe('ru'),
          descriptionUz: describe('uz'),
          createdAt: new Date(CATALOG_EPOCH + products.length * DAY_MS),
          imageUrls: [],
          variantPresetKeys: SUB_VARIANT_PRESETS[sub.slug] ?? [],
          specs: raw.specs ?? SPECS[SUB_SPEC_PRESET[sub.slug]],
        };

        product.imageUrls = productImageUrls(product);

        products.push(product);
      });
    });
  });

  return { categories, products };
}

/**
 * Every English string the seeded catalogue writes, as keys into the translation
 * tables.
 *
 * Collected from the literals rather than from `buildCatalog`'s output, because
 * the seed needs this list *before* it can build anything: `buildCatalog` reads
 * the tables through `t`, so it cannot run until the tables have been checked,
 * and the check needs the list of what to check. Walking the source literals
 * breaks that circle.
 *
 * Spec rows and variant values are included here even though the seed writes
 * them from `buildCatalog`'s output, because they are written through `t` too
 * and a missing one would fail mid-write rather than before it.
 */
export function collectCatalogStrings(): string[] {
  const strings = new Set<string>();

  for (const top of CATEGORIES) {
    strings.add(top.name);
    strings.add(top.description);

    for (const sub of top.children) {
      strings.add(sub.name);
      strings.add(sub.description);
      strings.add(sub.blurb);
      strings.add(sub.detail);

      for (const raw of sub.products) {
        strings.add(raw.name);

        for (const row of raw.specs ?? []) {
          for (const part of row) {
            strings.add(part);
          }
        }
      }
    }
  }

  for (const brand of BRANDS) {
    strings.add(brand.name);
    strings.add(brand.tagline);
  }

  for (const rows of Object.values(SPECS)) {
    for (const row of rows) {
      for (const part of row) {
        strings.add(part);
      }
    }
  }

  for (const preset of Object.values(VARIANTS)) {
    strings.add(preset.name);

    for (const value of preset.values) {
      strings.add(value.value);
    }
  }

  for (const zone of DELIVERY_ZONES) {
    strings.add(zone.name);
  }

  return [...strings];
}
