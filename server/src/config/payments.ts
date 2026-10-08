/**
 * How an order may be paid.
 *
 * The codes live here rather than in the order service because two places have
 * to agree on them: the checkout schema, which decides what a payload may say,
 * and the delivery policy, which publishes the list to the client so the
 * payment step can offer it without a second hard-coded copy. The policy used
 * to carry its own list, and the two had already drifted — the policy named four
 * payment codes and the checkout accepted two, so a shopper choosing from the
 * published list could have been refused for choosing correctly.
 *
 * Payment is simulated in this version: the codes decide what the order records
 * and what the storefront promises to collect, and no card data is read, sent,
 * or stored anywhere.
 */

export const PAYMENT_METHODS = ['CARD', 'CASH'] as const;

export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];
