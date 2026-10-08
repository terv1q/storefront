/**
 * The trust strip.
 *
 * Four claims and the icons that carry them, sitting between the shelves and the
 * newsletter. It exists because the questions a first-time visitor has before
 * ordering — how long it takes, whether it can be sent back, how to pay, who
 * answers when something goes wrong — are answered here without a page of their
 * own.
 *
 * Each claim is one the store can keep, and each is short because a strip that
 * needs a paragraph is a page. The delivery window and the free-delivery
 * threshold are the same ones the announcement strip and the checkout repeat, so
 * they cannot drift into three different promises.
 *
 * The icons are `aria-hidden`. "Delivery in 2 to 4 days" is already a complete
 * sentence; a screen reader announcing "truck" in front of it adds a word
 * without adding meaning.
 */

import { Headphones, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';

import { strings } from '@/i18n/strings';

type Point = {
  key: string;
  title: string;
  body: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

/**
 * The four claims, read in the current language.
 *
 * A function and not a constant, because `strings` is reassigned in place when
 * the visitor switches language: an array built at import would hold whichever
 * language the page happened to load in and keep saying it after the switch.
 * The icons are the part that does not translate, and they are read here for the
 * same reason — the claim and its glyph belong in one place.
 */
function getPoints(): readonly Point[] {
  return [
    {
      key: 'delivery',
      title: strings.home.deliveryTitle,
      body: strings.home.deliveryBody,
      Icon: Truck,
    },
    {
      key: 'returns',
      title: strings.home.returnsTitle,
      body: strings.home.returnsBody,
      Icon: RotateCcw,
    },
    {
      key: 'payments',
      title: strings.home.paymentsTitle,
      body: strings.home.paymentsBody,
      Icon: ShieldCheck,
    },
    {
      key: 'support',
      title: strings.home.supportTitle,
      body: strings.home.supportBody,
      Icon: Headphones,
    },
  ];
}

export function TrustStrip() {
  return (
    <section
      aria-labelledby="home-trust-heading"
      className="rounded-panel border border-border bg-surface-muted px-6 py-8"
    >
      <h2 id="home-trust-heading" className="sr-only">
        {strings.home.trustHeading}
      </h2>

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {getPoints().map(({ key, title, body, Icon }) => (
          <li key={key} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-content-center rounded-full bg-surface text-brand-700">
              <Icon aria-hidden="true" width={20} height={20} />
            </span>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
              <p className="mt-0.5 text-sm text-ink-600">{body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
