/**
 * The plural forms a language needs, kept out of the tables that use them.
 *
 * English has two forms and a count of 1 picks the first, so its tables decide
 * the form with a comparison and no helper. Russian has three, and which one
 * applies depends on the last two digits rather than on the size of the number:
 * 1 товар, 2 товара, 5 товаров, and then 11 товаров again even though it ends in
 * a one. Writing that test inside every counted sentence would be the same six
 * lines five times over, and the one that was written slightly differently would
 * be the one that reads wrong.
 *
 * The helper returns the whole phrase rather than a form of the noun, because the
 * verb agrees with it too: «Остался 1» against «Осталось 5».
 */
export function ruPlural(count: number, one: string, few: string, many: string): string {
  const lastTwo = count % 100;
  const last = count % 10;

  if (last === 1 && lastTwo !== 11) {
    return one;
  }

  if (last >= 2 && last <= 4 && (lastTwo < 10 || lastTwo >= 20)) {
    return few;
  }

  return many;
}
