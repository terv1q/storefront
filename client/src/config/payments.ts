/**
 * How an order can be paid for in parts.
 *
 * The store does not run its own instalment scheme: a split payment is a bank's
 * product, and which terms a shopper is offered depends on the bank, the card,
 * and a credit check none of which this storefront can see. What it can state is
 * the schedule it advertises — three, six, or twelve months at a published rate
 * — and that is exactly what the product page shows, beside a note saying the
 * plan is confirmed at checkout.
 *
 * Keeping the rates here rather than inventing them per product is what makes
 * that note true. Two products do not have different instalment terms, and a
 * percentage written inside a component is a number nobody can find when the
 * bank changes it.
 *
 * A rate is a markup on the amount, not interest: the schedule is quoted to
 * shoppers as "12 months, so much a month", and a monthly figure that has to be
 * derived from an APR would be a figure this store cannot compute correctly.
 */

export type InstallmentPlan = {
  /** How many monthly payments the amount is divided into. */
  months: number;
  /** Percent added to the amount over the whole term. */
  markupPercent: number;
  /** Minor units below which this plan is not offered at all. */
  minimumMinor: number;
};

/**
 * The advertised schedule, shortest first. The shortest term carries no markup,
 * which is what a shopper expects of a three-month split, and the longer ones
 * carry the bank's cost.
 */
export const INSTALLMENT_PLANS: readonly InstallmentPlan[] = [
  { months: 3, markupPercent: 0, minimumMinor: 100_000 * 100 },
  { months: 6, markupPercent: 5, minimumMinor: 300_000 * 100 },
  { months: 12, markupPercent: 12, minimumMinor: 1_000_000 * 100 },
];

export type InstallmentQuote = {
  months: number;
  /** Minor units: what the whole term costs, markup included. */
  totalMinor: number;
  /** Minor units, rounded up, because a payment cannot be a fraction of a tiyin. */
  monthlyMinor: number;
};

/**
 * The plan as it would be quoted for one amount, or `null` when the amount is
 * below the plan's floor.
 *
 * Rounding is upward and applied once, to the monthly payment: rounding each
 * instalment the other way would leave the last one smaller than the rest, and
 * the tag would be advertising the cheapest month rather than the plan.
 */
export function installmentQuote(
  amountMinor: number,
  plan: InstallmentPlan,
): InstallmentQuote | null {
  if (!Number.isFinite(amountMinor) || amountMinor < plan.minimumMinor) {
    return null;
  }

  const totalMinor = Math.round(amountMinor * (1 + plan.markupPercent / 100));

  return {
    months: plan.months,
    totalMinor,
    monthlyMinor: Math.ceil(totalMinor / plan.months),
  };
}

/**
 * Every plan an amount qualifies for, in the advertised order.
 *
 * A product priced below the twelve-month floor is offered three months and
 * nothing else, which is the honest answer: the longer term is not available for
 * it, and a disabled tag would be advertising something the shopper cannot have.
 */
export function installmentQuotes(amountMinor: number): InstallmentQuote[] {
  return INSTALLMENT_PLANS.map((plan) => installmentQuote(amountMinor, plan)).filter(
    (quote): quote is InstallmentQuote => quote !== null,
  );
}
