/**
 * The checkout.
 *
 * Four steps — who the order is for, where it goes, how it is paid, and the
 * review it is placed from — with the basket's own summary beside them. Only
 * the step being left is validated, and it is validated before it is left, so a
 * shopper is never advanced past a mistake and is never told about a field they
 * have not reached.
 *
 * Three things shape the rest of the page:
 *
 * * **The basket is checked, not trusted.** The cart is a copy of prices and
 *   stock taken when its lines were added, and a product can sell out while a
 *   form is being filled in. The catalog is re-read here, what changed is
 *   reported against the line it belongs to, and the order cannot be placed
 *   while something in the basket is unbuyable. When the server refuses a line
 *   that was buyable a moment ago, the refusal is put on that line too.
 * * **Nothing about money is sent.** The payload names products and quantities;
 *   the prices, the stock, and every total are read and computed by the server
 *   inside the transaction that writes the order.
 * * **The button is pressed once.** Placing an order spends stock and money, so
 *   the control is disabled while the request is in flight, and the page routes
 *   to the confirmation as soon as the response arrives rather than offering a
 *   second chance to submit the same order.
 *
 * The country box starts on the store's own market, because a store that
 * delivers in Uzbekistan is answering its own question; it is prefilled and not
 * locked, since an order sent abroad is a thing that happens.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/common/Button';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { CartIssues } from '@/components/cart/CartIssues';
import { EmptyCart } from '@/components/cart/EmptyCart';
import { PromoCodeForm } from '@/components/cart/PromoCodeForm';
import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
import { ContactForm } from '@/components/checkout/ContactForm';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { ShippingForm } from '@/components/checkout/ShippingForm';
import { siteConfig } from '@/config/site';
import type { CartIssue } from '@/features/cart/cart.revalidate';
import { withCurrentPrices } from '@/features/cart/cart.revalidate';
import { useCartRevalidation } from '@/features/cart/cart.queries';
import { useCartStore } from '@/features/cart/cart.store';
import { cartItemKey } from '@/features/cart/cart.types';
import { readCheckoutErrors, readCheckoutFailure } from '@/features/checkout/checkout.api';
import { usePlaceOrder } from '@/features/checkout/checkout.queries';
import {
  CHECKOUT_STEPS,
  STEP_SCHEMAS,
  checkoutFormSchema,
  lineIndexOfField,
  toCheckoutInput,
} from '@/features/checkout/checkout.rules';
import type {
  CheckoutFieldErrors,
  CheckoutFormValues,
  CheckoutStepKey,
  CheckoutTextField,
} from '@/features/checkout/checkout.rules';
import {
  checkoutShipping,
  checkoutTotal,
  itemsForCheckout,
} from '@/features/checkout/checkout.totals';
import { isCompletePostalCode, useDeliveryEstimate } from '@/features/products/delivery.queries';
import { useAuth } from '@/hooks/useAuth';
import { useCartTotals } from '@/hooks/useCart';
import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';
import type { DeliveryMethod, PaymentMethod } from '@/types/order';
import type { User as Account } from '@/types/user';

/** Where each step's fields are checked, for a failure found on the way out. */
const STEP_OF_FIELD: Record<string, CheckoutStepKey> = {
  customerName: 'contact',
  customerEmail: 'contact',
  customerPhone: 'contact',
  country: 'shipping',
  city: 'shipping',
  street: 'shipping',
  postalCode: 'shipping',
  deliveryMethod: 'shipping',
  notes: 'shipping',
  paymentMethod: 'payment',
};

/** A blank form, with what the account already knows filled in. */
function initialValues(account: Account | null, country: string): CheckoutFormValues {
  return {
    customerName: account === null ? '' : `${account.firstName} ${account.lastName}`.trim(),
    customerEmail: account?.email ?? '',
    customerPhone: account?.phone ?? '',
    country,
    city: '',
    street: '',
    postalCode: '',
    notes: '',
    // Courier is what most orders are, and cash is what the server defaults to.
    deliveryMethod: 'COURIER',
    paymentMethod: 'CASH',
  };
}

/** The first message for each field a schema refused, in the schema's order. */
function fieldErrorsOf(error: {
  issues: readonly { path: PropertyKey[]; message: string }[];
}): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field === 'string' && errors[field as keyof CheckoutFormValues] === undefined) {
      errors[field as keyof CheckoutFormValues] = issue.message;
    }
  }

  return errors;
}

export function CheckoutPage() {
  useSeo({ title: strings.pages.checkout.title, noIndex: true });

  const navigate = useNavigate();
  const { user } = useAuth();

  const items = useCartStore((state) => state.items);
  const promo = useCartStore((state) => state.promo);
  const setPromo = useCartStore((state) => state.setPromo);
  const clearPromo = useCartStore((state) => state.clearPromo);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const replace = useCartStore((state) => state.replace);

  const [step, setStep] = useState(0);
  const [values, setValues] = useState(() =>
    initialValues(user, strings.checkout.shipping.defaultCountry),
  );
  const [errors, setErrors] = useState<CheckoutFieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [promoRefused, setPromoRefused] = useState(false);
  /** Set as soon as the server has the order, so the emptied cart is not shown. */
  const [placedId, setPlacedId] = useState<string | null>(null);

  const placeOrder = usePlaceOrder();
  const revalidation = useCartRevalidation(items);

  /**
   * The address the account knows is offered until the shopper types something.
   * The sign-in guard has already confirmed the session, so the account is
   * almost always here at the first render; the effect is for the render where
   * it is not.
   */
  const typed = useRef(false);

  useEffect(() => {
    if (typed.current || user === null) {
      return;
    }

    setValues((previous) => ({ ...previous, ...initialValues(user, previous.country) }));
  }, [user]);

  // Only a complete code is asked about: a half-typed one has no answer, and a
  // "we do not deliver there" verdict for four digits is about nothing.
  const postalCode = isCompletePostalCode(values.postalCode) ? values.postalCode.trim() : '';
  const delivery = useDeliveryEstimate(postalCode);
  const freeDeliveryFrom = delivery.data?.policy.freeDeliveryFrom ?? siteConfig.freeDeliveryFrom;

  const { totals } = useCartTotals(freeDeliveryFrom);
  const shipping = checkoutShipping(values.deliveryMethod, totals.subtotal, freeDeliveryFrom);
  const summaryTotals = {
    ...totals,
    shipping,
    total: checkoutTotal(totals.subtotal, totals.promoDiscount, shipping),
  };

  const stepKey = CHECKOUT_STEPS[step] ?? 'contact';

  const changeField = (field: CheckoutTextField, value: string) => {
    typed.current = true;

    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) =>
      previous[field] === undefined ? previous : { ...previous, [field]: undefined },
    );
  };

  const changeMethod = (method: DeliveryMethod | PaymentMethod) => {
    setValues((previous) =>
      method === 'COURIER' || method === 'PICKUP'
        ? { ...previous, deliveryMethod: method }
        : { ...previous, paymentMethod: method },
    );
  };

  /**
   * What is in the basket that cannot be bought as it stands. A price that has
   * moved is not one of them: it is reported, and the order is placed at the
   * server's price either way.
   */
  const blocking = revalidation.issues.filter(
    (issue) =>
      issue.kind === 'inactive' ||
      issue.kind === 'out_of_stock' ||
      issue.kind === 'insufficient_stock',
  );

  const applyQuantityFix = (issue: CartIssue) => {
    setQuantity(issue.line, issue.availableStock ?? 1);
  };

  const applyPriceFix = () => {
    replace(withCurrentPrices(items, revalidation.products));
  };

  const advance = () => {
    const parsed = STEP_SCHEMAS[stepKey].safeParse(values);

    if (!parsed.success) {
      setErrors(fieldErrorsOf(parsed.error));
      return;
    }

    setErrors({});
    setStep((previous) => Math.min(previous + 1, CHECKOUT_STEPS.length - 1));
  };

  const goBack = () => {
    setErrors({});
    setStep((previous) => Math.max(previous - 1, 0));
  };

  const editStep = (index: number) => {
    setErrors({});
    setStep(index);
  };

  const describeFailure = (kind: string): string => {
    switch (kind) {
      case 'unauthenticated':
        return strings.checkout.failures.unauthenticated;
      case 'rate_limited':
        return strings.checkout.failures.rateLimited;
      case 'validation':
        return strings.checkout.failures.validation;
      case 'conflict':
        return strings.checkout.failures.conflict;
      default:
        return strings.checkout.failures.unknown;
    }
  };

  const place = async () => {
    const parsed = checkoutFormSchema.safeParse(values);

    if (!parsed.success) {
      const found = fieldErrorsOf(parsed.error);
      setErrors(found);

      // The form is checked as a whole here and step by step on the way in, so
      // a field that was emptied by going back is found on the step that owns
      // it rather than under a review page that has no fields to point at.
      const first = Object.keys(found)[0];
      const owner = first === undefined ? undefined : STEP_OF_FIELD[first];
      const index = owner === undefined ? -1 : CHECKOUT_STEPS.indexOf(owner);

      if (index >= 0) {
        setStep(index);
      }

      return;
    }

    setFailure(null);
    setLineErrors({});
    setPromoRefused(false);

    try {
      const order = await placeOrder.mutateAsync(
        toCheckoutInput(parsed.data, itemsForCheckout(items), promo?.code ?? null),
      );

      // The basket has been emptied by the mutation; the id is set first so the
      // empty-cart page is never drawn on the way to the confirmation.
      setPlacedId(order.id);
      navigate(paths.orderConfirmation(order.id), { replace: true });
    } catch (error) {
      const fields = readCheckoutErrors(error);
      const refusals: Record<string, string> = {};
      let promoFailed = false;

      for (const field of Object.keys(fields)) {
        const index = lineIndexOfField(field);

        if (index !== null) {
          const line = items[index];

          if (line !== undefined) {
            refusals[cartItemKey(line)] = strings.checkout.lineRefused(line.name);
          }

          continue;
        }

        if (field === 'promoCode') {
          promoFailed = true;
        }
      }

      setLineErrors(refusals);
      setPromoRefused(promoFailed);
      setFailure(describeFailure(readCheckoutFailure(error)));

      // The server has just told this page that its copy of the basket is old.
      // Asking the catalog is what turns "something was refused" into which
      // product and what is left of it.
      if (Object.keys(refusals).length > 0) {
        revalidation.refresh();
      }
    }
  };

  if (items.length === 0 && placedId === null) {
    return (
      <div className="mx-auto w-full max-w-page px-page-x py-page-y">
        <h1 className="mb-6 text-2xl font-semibold text-ink-900">{strings.checkout.title}</h1>
        <EmptyCart />
      </div>
    );
  }

  const steps = CHECKOUT_STEPS.map((key) => ({ key, label: strings.checkout.steps[key] }));
  const completed = steps.slice(0, step).map((item, index) => ({ label: item.label, index }));

  const pending = placeOrder.isPending;

  return (
    <div className="mx-auto w-full max-w-page px-page-x py-page-y">
      <h1 className="text-2xl font-semibold text-ink-900">{strings.checkout.title}</h1>

      <CheckoutSteps
        steps={steps}
        current={step}
        onEdit={editStep}
        className="mt-5 rounded-card border border-border bg-surface p-4"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-4">
          {/* A basket that cannot be bought is announced before the form is
              filled in, not after it is submitted. */}
          {blocking.length > 0 ? (
            <ErrorMessage>{strings.checkout.blockedCheckout}</ErrorMessage>
          ) : null}

          <CartIssues
            issues={revalidation.issues}
            onUpdatePrices={applyPriceFix}
            onReduceQuantity={applyQuantityFix}
            onRemove={(issue) => remove(issue.line)}
          />

          {revalidation.isError ? (
            <ErrorMessage>{strings.cart.revalidateFailed}</ErrorMessage>
          ) : null}

          <form
            className="flex flex-col gap-6"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();

              if (step < CHECKOUT_STEPS.length - 1) {
                advance();
                return;
              }

              if (!pending && blocking.length === 0) {
                void place();
              }
            }}
          >
            <div className="rounded-panel border border-border bg-surface p-5 sm:p-6">
              {stepKey === 'contact' ? (
                <ContactForm
                  values={values}
                  errors={errors}
                  onChange={changeField}
                  prefilled={user !== null && !typed.current}
                  disabled={pending}
                />
              ) : null}

              {stepKey === 'shipping' ? (
                <ShippingForm
                  values={values}
                  errors={errors}
                  onChange={changeField}
                  onMethodChange={changeMethod}
                  estimate={delivery.data ?? null}
                  isEstimating={delivery.isFetching}
                  disabled={pending}
                />
              ) : null}

              {stepKey === 'payment' ? (
                <PaymentForm
                  value={values.paymentMethod}
                  published={delivery.data?.policy.paymentMethods ?? []}
                  onChange={changeMethod}
                  disabled={pending}
                />
              ) : null}

              {stepKey === 'review' ? (
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold text-ink-900">
                    {strings.checkout.review.heading}
                  </h2>
                  <p className="text-sm text-ink-600">{strings.checkout.review.body}</p>

                  <dl className="flex flex-col gap-3 text-sm">
                    <ReviewRow
                      label={strings.checkout.review.contactLabel}
                      value={values.customerName}
                    />
                    <ReviewRow
                      label={strings.checkout.review.emailLabel}
                      value={values.customerEmail}
                    />
                    <ReviewRow
                      label={strings.checkout.review.phoneLabel}
                      value={values.customerPhone}
                    />
                    <ReviewRow
                      label={strings.checkout.review.addressLabel}
                      value={[values.street, values.city, values.postalCode, values.country]
                        .filter((part) => part.trim() !== '')
                        .join(', ')}
                    />
                    <ReviewRow
                      label={strings.checkout.review.deliveryLabel}
                      value={strings.checkout.shipping.methods[values.deliveryMethod].name}
                    />
                    <ReviewRow
                      label={strings.checkout.review.paymentLabel}
                      value={strings.checkout.payment.methods[values.paymentMethod].name}
                    />
                    {values.notes.trim() === '' ? null : (
                      <ReviewRow label={strings.checkout.review.notesLabel} value={values.notes} />
                    )}
                  </dl>
                </div>
              ) : null}
            </div>

            {/* The refusal belongs above the button that produced it. */}
            {failure === null ? null : <ErrorMessage>{failure}</ErrorMessage>}

            {Object.keys(errors).length > 0 ? (
              <ErrorMessage>{strings.checkout.fixErrors}</ErrorMessage>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={goBack} disabled={step === 0 || pending}>
                {strings.checkout.back}
              </Button>

              <Button
                type="submit"
                isLoading={pending}
                disabled={pending || (stepKey === 'review' && blocking.length > 0)}
                className="min-w-40 py-2.5"
              >
                {stepKey === 'review'
                  ? pending
                    ? strings.checkout.placingOrder
                    : strings.checkout.placeOrder
                  : strings.checkout.continue}
              </Button>
            </div>
          </form>
        </div>

        <OrderSummary
          items={items}
          totals={summaryTotals}
          promo={promo}
          appliedDiscount={totals.promoDiscount}
          freeDeliveryFrom={freeDeliveryFrom}
          completedSteps={completed}
          onEditStep={editStep}
          lineErrors={lineErrors}
        >
          {promoRefused ? (
            <ErrorMessage className="mb-3">{strings.checkout.promoRefused}</ErrorMessage>
          ) : null}

          <PromoCodeForm
            subtotal={totals.subtotal}
            promo={promo}
            appliedDiscount={totals.promoDiscount}
            onApply={setPromo}
            onRemove={clearPromo}
          />
        </OrderSummary>
      </div>
    </div>
  );
}

/** One line of the review: a label and the answer that was given. */
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <dt className="text-ink-600">{label}</dt>
      <dd className="text-ink-900 sm:text-right">{value}</dd>
    </div>
  );
}
