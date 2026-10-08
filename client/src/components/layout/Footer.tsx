import { Link } from 'react-router-dom';

import { NewsletterForm } from '@/components/layout/NewsletterForm';
import { SocialLinks } from '@/components/layout/SocialLinks';
import { getFooterGroups, getLegalLinks, paymentMethods } from '@/config/footer';
import type { FooterLink } from '@/config/footer';
import { getContactCopy, siteConfig } from '@/config/site';
import { strings } from '@/i18n/strings';

const linkClass =
  'text-sm text-ink-600 transition-colors hover:text-ink-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';

const headingClass = 'text-sm font-semibold text-ink-900';

function FooterLinkItem({ link }: { link: FooterLink }) {
  if (link.to) {
    return (
      <Link to={link.to} className={linkClass}>
        {link.label}
      </Link>
    );
  }

  if (link.href) {
    return (
      <a href={link.href} className={linkClass}>
        {link.label}
      </a>
    );
  }

  return (
    <span className="text-sm text-ink-500">
      {link.label}
      <span className="ml-1 text-xs text-ink-500">({strings.footer.comingSoon})</span>
    </span>
  );
}

export function Footer() {
  const footerGroups = getFooterGroups();
  const legalLinks = getLegalLinks();
  const contact = getContactCopy();

  return (
    <footer className="mt-auto border-t border-border bg-surface-muted">
      <div className="mx-auto grid max-w-page gap-12 px-page-x py-14 sm:py-16 lg:grid-cols-12">
        <section className="lg:col-span-5" aria-labelledby="footer-brand">
          <h2 id="footer-brand" className="text-xl font-bold text-ink-900">
            {siteConfig.name}
          </h2>

          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-600">
            {strings.footer.tagline}
          </p>

          <a
            href={`mailto:${siteConfig.supportEmail}`}
            className={`mt-4 inline-block ${linkClass}`}
          >
            {siteConfig.supportEmail}
          </a>

          <div className="mt-8">
            <h2 className={headingClass}>{strings.footer.newsletterHeading}</h2>

            <div className="mt-3">
              <NewsletterForm />
            </div>
          </div>

          <div className="mt-8">
            <h2 className={headingClass}>{strings.footer.socialHeading}</h2>

            <div className="mt-3">
              <SocialLinks />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 lg:col-span-7">
          {footerGroups.map((group) => (
            <nav key={group.key} aria-label={group.heading}>
              <h2 className={headingClass}>{group.heading}</h2>

              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={link.key}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-page gap-10 px-page-x py-10 sm:grid-cols-2">
          <section aria-labelledby="footer-contact">
            <h2 id="footer-contact" className={headingClass}>
              {strings.footer.contactHeading}
            </h2>

            <dl className="mt-4 space-y-2 text-sm text-ink-600">
              <div>
                <dt className="sr-only">{strings.footer.addressLabel}</dt>
                <dd className="leading-relaxed">{contact.address}</dd>
              </div>

              <div>
                <dt className="sr-only">{strings.footer.phoneLabel}</dt>
                <dd>
                  <a href={siteConfig.contact.phoneHref} className={linkClass}>
                    {siteConfig.contact.phone}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="sr-only">{strings.footer.telegramLabel}</dt>
                <dd>
                  <a
                    href={siteConfig.contact.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {siteConfig.contact.telegramHandle}
                  </a>
                </dd>
              </div>

              <div>
                <dt className="sr-only">{strings.footer.hoursLabel}</dt>
                <dd className="leading-relaxed">{contact.hours}</dd>
              </div>
            </dl>
          </section>

          <section aria-labelledby="footer-payments">
            <h2 id="footer-payments" className={headingClass}>
              {strings.footer.paymentsHeading}
            </h2>

            <ul className="mt-4 flex flex-wrap items-center gap-5">
              {paymentMethods.map((method) => (
                <li key={method.name} className="flex h-12 items-center">
                  {method.type === 'icon' ? (
                    <method.Icon
                      size={42}
                      aria-hidden="true"
                      focusable="false"
                      className="opacity-60 transition-all duration-300 hover:scale-105 hover:opacity-100"
                    />
                  ) : (
                    <img
                      src={method.logo}
                      alt={method.alt}
                      loading="lazy"
                      className="h-12 w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:scale-105 hover:opacity-100 hover:grayscale-0"
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="border-t border-border bg-surface-muted">
        <div className="mx-auto flex max-w-page flex-col gap-4 px-page-x py-6 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={strings.footer.legalHeading}>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {legalLinks.map((link) => (
                <li key={link.key}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-sm text-ink-500">{strings.footer.rights(new Date().getFullYear())}</p>
        </div>
      </div>
    </footer>
  );
}
