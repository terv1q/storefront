/**
 * The specifications, as a table.
 *
 * The rows arrive in groups — material, care, dimensions — and the group is a
 * heading over its rows rather than a column, because a specification is read as
 * a list under a subject: what it is made of, then how to wash it. A column of
 * repeated group names would be the same word six times beside six different ones.
 *
 * Each group is its own `<table>`, which is what makes the heading a caption of
 * the rows it covers. One table with section rows in it would read out as a
 * single long relation, and a screen reader announcing "row 7 of 24" tells a
 * shopper nothing about which subject row 7 belongs to.
 *
 * The rows alternate shading. That is the one thing that makes a two-column table
 * of long values scannable down a column rather than across two, and it is done
 * with the index rather than with a CSS rule, because each group's striping has
 * to start on its own first row.
 *
 * The order is the catalog's: the seed writes the rows in the order they should
 * be read, and re-sorting them here would be this component disagreeing with the
 * data about which specification matters first.
 */

import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import type { ProductSpec } from '@/types/product';

type Props = {
  specs: readonly ProductSpec[];
  className?: string;
};

/** The rows, in catalog order, under the groups they belong to. */
function groupOf(specs: readonly ProductSpec[]): { group: string; rows: ProductSpec[] }[] {
  const groups: { group: string; rows: ProductSpec[] }[] = [];

  for (const spec of specs) {
    let entry = groups.find((candidate) => candidate.group === spec.group);

    if (entry === undefined) {
      entry = { group: spec.group, rows: [] };
      groups.push(entry);
    }

    entry.rows.push(spec);
  }

  return groups;
}

export function ProductSpecs({ specs, className }: Props) {
  if (specs.length === 0) {
    return (
      <p className={cn('text-sm text-ink-500', className)}>{strings.productPage.tabs.specsEmpty}</p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {groupOf(specs).map(({ group, rows }) => (
        <table key={group} className="w-full border-collapse text-sm">
          <caption className="mb-2 text-left text-sm font-semibold text-ink-900">{group}</caption>

          <thead className="sr-only">
            <tr>
              <th scope="col">{strings.productPage.specs.labelColumn}</th>
              <th scope="col">{strings.productPage.specs.valueColumn}</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.id}
                className={cn(
                  'align-top',
                  // Alternating shading, restarted by each group's own first row.
                  index % 2 === 0 ? 'bg-surface-muted' : 'bg-surface',
                )}
              >
                <th
                  scope="row"
                  className="w-2/5 rounded-l-control px-3 py-2 text-left font-medium text-ink-600"
                >
                  {row.label}
                </th>
                <td className="rounded-r-control px-3 py-2 text-ink-900">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  );
}
