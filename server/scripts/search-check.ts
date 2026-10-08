/**
 * A reading of what search returns, term by term.
 *
 * The synonym list in `services/searchSynonyms.ts` is written by hand against
 * this catalogue's own vocabulary, and a hand-written list is the kind of thing
 * that is right on the day it is written and quietly wrong later — when a shelf
 * is added, or when a word that used to find one product starts finding thirty.
 * This prints the first few results for a set of terms so that can be seen rather
 * than guessed at.
 *
 * It talks to a running API rather than to the database, because what is being
 * checked is what a shopper gets. Start the server, then:
 *
 *     pnpm --filter server search:check
 *     pnpm --filter server search:check телефон ноутбук сумка
 *
 * The default list is the one that was wrong before the widening was added: a
 * missing result, a mis-ranked one, and the words that used to return noise.
 *
 * Not part of the application: nothing imports it, and it is never run by a
 * build or a test.
 */

const DEFAULT_TERMS = [
  'телефон',
  'telefon',
  'смартфон',
  'iphone',
  'iphon',
  'ноутбук',
  'noutbuk 14',
  'laptop',
  'наушники',
  'earbuds',
  'сумка',
  'sumka',
  'рюкзак',
  'кроссовки',
  'kurtka',
  'пальто',
  'крем',
  'духи',
  'atir',
  'кофе',
  'часы',
  'soat',
  'ear',
  'charg',
  'зарядка',
  'кастрюля',
  'игрушка',
  'конструктор',
  'shrit',
  'rubashka',
  'рубашки',
];

const base = process.env.API_URL ?? 'http://localhost:4000/api';
const lang = process.env.LANG_QUERY ?? 'ru';
const limit = Number(process.env.LIMIT ?? 5);
const terms = process.argv.slice(2);

for (const term of terms.length > 0 ? terms : DEFAULT_TERMS) {
  const response = await fetch(
    `${base}/search?q=${encodeURIComponent(term)}&limit=${limit}&lang=${lang}`,
  );

  if (!response.ok) {
    console.log(`${term} -> HTTP ${response.status}`);
    continue;
  }

  const body = (await response.json()) as {
    data: { total: number; items: { name: string }[] };
  };

  const names = body.data.items.map((item) => item.name).join(' | ');

  console.log(`${term} -> ${body.data.total}: ${names}`);
}
