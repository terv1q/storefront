import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

import { HERO_SPOTLIGHT_LIMIT } from '@/config/home';
import { useFeaturedProducts } from '@/hooks/useProducts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';
import { formatPrice } from '@/utils/formatPrice';

const revealTransition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

/**
 * The hero.
 *
 * The headline and the spotlight product share one column: the product is pulled
 * up over the last lines of the headline so the two read as one composition.
 *
 * Everything here is in normal flow. An earlier version pinned the headline, the
 * product, and the information row to fixed offsets inside a box of a fixed
 * height, which held together only at the sizes it was drawn at: the headline is
 * a sentence rather than a word, so at a narrow width — or in a language that
 * spells it longer — it wrapped to another line, ran past the bottom of the box,
 * and printed itself over the row underneath. Nothing overlapped in the source;
 * the overlap was what absolute offsets do when their content outgrows them.
 *
 * The pull-up is a negative margin in `%`, so it scales with the column and can
 * never exceed it, and it only starts at `sm`: on a phone the two are stacked
 * with a normal gap, which is the one layout where the wrap is unpredictable.
 */
export function Hero() {
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { products } = useFeaturedProducts(HERO_SPOTLIGHT_LIMIT);

  const product = (products ?? []).find((item) => item.image);
  const copy = strings.home.hero;

  if (!product) {
    return (
      <section aria-labelledby="home-hero-heading" className="bg-surface">
        <div className="mx-auto max-w-page px-page-x py-16 sm:py-24">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={revealTransition}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="text-xs font-semibold tracking-[0.2em] text-ink-500 uppercase">
              {copy.eyebrow}
            </p>

            <h1
              id="home-hero-heading"
              className="mt-5 text-display-lg font-semibold tracking-tight text-balance text-ink-900 sm:text-display-xl"
            >
              {strings.home.pageTitle}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-600">
              {copy.body}
            </p>

            <div className="mt-8">
              <Link
                to={paths.search}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              >
                {copy.primary}
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="home-hero-heading" className="bg-surface">
      <div className="mx-auto max-w-page px-page-x pt-6 pb-10 sm:pt-8 sm:pb-14">
        {/* Top navigation line */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={revealTransition}
          className="flex items-center justify-between gap-4"
        >
          <p className="text-xs font-medium tracking-[0.18em] text-ink-500 uppercase">
            {copy.eyebrow}
          </p>

          <Link
            to={paths.product(product.slug)}
            className="group hidden items-center gap-1.5 text-xs font-semibold text-ink-700 transition-colors hover:text-ink-900 sm:flex"
          >
            {strings.home.heroSpotlight}
            <ArrowUpRight
              aria-hidden="true"
              size={14}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </Link>
        </motion.div>

        {/* Giant typography */}
        <motion.h1
          id="home-hero-heading"
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: reduceMotion ? 0 : 0.08 }}
          className="pointer-events-none mx-auto mt-8 max-w-[1100px] text-center text-[clamp(2.5rem,8.5vw,8rem)] leading-[0.9] font-semibold tracking-[-0.045em] text-balance text-ink-900 select-none sm:mt-6 lg:mt-4"
        >
          {strings.home.pageTitle}
        </motion.h1>

        {/* Spotlight product, pulled up over the foot of the headline */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.85,
            delay: reduceMotion ? 0 : 0.15,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative mx-auto mt-4 flex h-[260px] w-full max-w-[900px] items-center justify-center sm:-mt-[4%] sm:h-[400px] lg:h-[480px]"
        >
          <Link
            to={paths.product(product.slug)}
            aria-label={product.name}
            className="group flex h-full w-full items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-brand-600"
          >
            <img
              src={product.image?.url ?? ''}
              alt=""
              width={1200}
              height={900}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain px-6 transition-transform duration-700 ease-out group-hover:scale-[1.035] sm:px-14 lg:px-20"
            />
          </Link>
        </motion.div>

        {/* Information row, in flow under the product so it can never be covered by it */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...revealTransition, delay: reduceMotion ? 0 : 0.3 }}
          className="mx-auto mt-8 max-w-[1100px] sm:mt-10"
        >
          <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
            <div className="max-w-sm">
              <p className="text-xs tracking-[0.16em] text-ink-500 uppercase">
                {strings.home.heroSpotlight}
              </p>

              <Link
                to={paths.product(product.slug)}
                className="mt-1 block text-base font-semibold text-ink-900 transition-colors hover:text-brand-700 sm:text-lg"
              >
                {product.name}
              </Link>
            </div>

            <div className="text-left sm:text-center">
              <p className="text-xs text-ink-500">{copy.eyebrow}</p>

              <p className="mt-1 text-base font-semibold text-ink-900">
                {formatPrice(product.price, { currency: product.currency })}
              </p>
            </div>

            <div className="flex sm:justify-end">
              <Link
                to={paths.search}
                className="group inline-flex items-center gap-2 text-sm font-semibold text-ink-900 transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              >
                {copy.primary}

                <span className="flex size-8 items-center justify-center rounded-full border border-border-strong transition-all duration-300 group-hover:border-brand-600 group-hover:bg-brand-600 group-hover:text-white">
                  <ArrowUpRight
                    aria-hidden="true"
                    size={15}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
