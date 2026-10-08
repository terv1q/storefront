/**
 * The slide-in drawer below the large breakpoint.
 *
 * It carries what the desktop row shows in three places: the search field, the
 * category tree, and the account links. The categories are an accordion, one
 * level deep, with the second level revealed in place — the tree is only two
 * levels today, and a third would need a second accordion rather than a longer
 * list.
 *
 * The drawer is a Radix dialog, so Tab stays inside it, Escape closes it, the
 * page behind it cannot scroll while it is open, and focus returns to the button
 * that opened it. The slide itself is a motion transform, skipped when the
 * visitor asked for reduced motion; the drawer still opens and closes, it just
 * does not travel.
 *
 * Navigating — from a link, a search, or a browser Back — closes the drawer,
 * because the route is watched rather than only the links.
 */

import * as Accordion from '@radix-ui/react-accordion';
import * as Dialog from '@radix-ui/react-dialog';
import { ChevronDown, Mail, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ErrorMessage } from '@/components/common/ErrorMessage';
import { Skeleton } from '@/components/common/Skeleton';
import { Thumbnail } from '@/components/common/Thumbnail';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { MarketSelect } from '@/components/layout/MarketSelect';
import { SearchBar } from '@/components/search/SearchBar';
import { getAccountLinks } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { useCategoryTree } from '@/hooks/useProducts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { cn } from '@/lib/cn';
import { paths } from '@/routes/paths';

const rowClass =
  'flex items-center gap-2 rounded-control px-2 py-2 text-sm text-ink-700 no-underline hover:bg-ink-100 hover:text-ink-900 hover:no-underline';

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  const { categories, isLoading, isError, errorMessage } = useCategoryTree();
  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label={open ? strings.menu.close : strings.menu.open}
        className="rounded-control p-2 text-ink-700 transition-colors hover:bg-ink-100 hover:text-ink-900"
      >
        <MenuGlyph open={open} reduceMotion={reduceMotion} />
      </Dialog.Trigger>

      <Dialog.Portal forceMount>
        <AnimatePresence>
          {open ? (
            <>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 z-drawer bg-ink-900/40 backdrop-blur-sm"
                />
              </Dialog.Overlay>

              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.div
                  initial={reduceMotion ? false : { x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
                  transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
                  className="fixed inset-y-0 left-0 z-drawer flex w-[min(20rem,85vw)] flex-col bg-surface shadow-overlay"
                >
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <Dialog.Title className="text-lg">{strings.menu.title}</Dialog.Title>
                    <Dialog.Close
                      aria-label={strings.menu.close}
                      className="rounded-control p-2 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
                    >
                      <X aria-hidden="true" size={20} />
                    </Dialog.Close>
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                    <SearchBar focusOnMount showScope={false} onNavigate={() => setOpen(false)} />

                    <section className="mt-6">
                      <h2 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                        {strings.menu.categoriesHeading}
                      </h2>

                      {isLoading ? (
                        <div aria-hidden="true" className="mt-3 space-y-2">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Skeleton key={index} className="h-8 rounded-control" />
                          ))}
                        </div>
                      ) : null}

                      {isError ? (
                        <ErrorMessage className="mt-3">{errorMessage}</ErrorMessage>
                      ) : null}

                      {categories && categories.length > 0 ? (
                        <Accordion.Root type="multiple" className="mt-2">
                          {categories.map((category) => (
                            <Accordion.Item key={category.id} value={category.slug}>
                              <Accordion.Header>
                                <Accordion.Trigger className="group flex w-full items-center gap-2 rounded-control px-2 py-2 text-left text-sm font-medium text-ink-800 transition-colors hover:bg-ink-100">
                                  <Thumbnail
                                    src={category.imageUrl}
                                    className="h-6 w-6 rounded-control"
                                    iconSize={12}
                                  />
                                  <span className="flex-1">{category.name}</span>
                                  <ChevronDown
                                    aria-hidden="true"
                                    size={16}
                                    className="text-ink-400 transition-transform duration-200 group-data-[state=open]:rotate-180"
                                  />
                                </Accordion.Trigger>
                              </Accordion.Header>

                              <Accordion.Content className="overflow-hidden">
                                <ul className="mt-1 ml-3 space-y-0.5 border-l border-border pl-3">
                                  <li>
                                    <Link
                                      to={paths.category(category.slug)}
                                      className={cn(rowClass, 'font-medium text-brand-700')}
                                    >
                                      {strings.nav.shopAll(category.name)}
                                    </Link>
                                  </li>
                                  {category.children.map((child) => (
                                    <li key={child.id}>
                                      <Link to={paths.category(child.slug)} className={rowClass}>
                                        {child.name}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              </Accordion.Content>
                            </Accordion.Item>
                          ))}
                        </Accordion.Root>
                      ) : null}
                    </section>

                    <section className="mt-6">
                      <h2 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                        {strings.menu.accountHeading}
                      </h2>

                      <ul className="mt-2">
                        {getAccountLinks().map((link) => (
                          <li key={link.key}>
                            <Link to={link.to} className={rowClass}>
                              {link.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section className="mt-6">
                      <h2 className="text-xs font-semibold tracking-wide text-ink-500 uppercase">
                        {strings.menu.contactHeading}
                      </h2>

                      <a
                        href={`mailto:${siteConfig.supportEmail}`}
                        className={cn(rowClass, 'mt-2')}
                      >
                        <Mail aria-hidden="true" size={16} className="text-ink-500" />
                        {strings.menu.contact}
                      </a>
                    </section>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
                    <MarketSelect />
                    <LanguageSwitcher />
                  </div>
                </motion.div>
              </Dialog.Content>
            </>
          ) : null}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** The two glyphs crossfade in place, so the trigger never changes size. */
function MenuGlyph({ open, reduceMotion }: { open: boolean; reduceMotion: boolean }) {
  return (
    <span className="relative grid h-5 w-5 place-content-center">
      <AnimatePresence initial={false} mode="wait">
        <motion.span
          key={open ? 'close' : 'open'}
          initial={reduceMotion ? false : { opacity: 0, rotate: open ? -90 : 90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, rotate: open ? 90 : -90 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute inset-0 grid place-content-center"
        >
          {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
