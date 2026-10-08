import { SiMastercard, SiVisa } from 'react-icons/si';

import { getQuickLinks } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import { strings } from '@/i18n/strings';
import { paths } from '@/routes/paths';

export type FooterLink = {
  key: string;
  label: string;
  to?: string;
  href?: string;
};

export type FooterGroup = {
  key: string;
  heading: string;
  links: readonly FooterLink[];
};

function getShopLinks(): readonly FooterLink[] {
  return [
    ...getQuickLinks().map((link) => ({
      key: link.key,
      label: link.label,
      to: link.to,
    })),
    {
      key: 'all-products',
      label: strings.nav.browse,
      to: paths.search,
    },
  ];
}

function getSupportLinks(): readonly FooterLink[] {
  return [
    {
      key: 'track-order',
      label: strings.account.orders,
      to: paths.orders,
    },
    {
      key: 'contact',
      label: strings.menu.contact,
      href: `mailto:${siteConfig.supportEmail}`,
    },
    { key: 'help', label: strings.footer.links.help },
    { key: 'shipping', label: strings.footer.links.shipping },
    { key: 'returns', label: strings.footer.links.returns },
  ];
}

function getAccountLinksForFooter(): readonly FooterLink[] {
  return [
    { key: 'account', label: strings.nav.account, to: paths.account },
    { key: 'orders', label: strings.nav.orders, to: paths.orders },
    { key: 'wishlist', label: strings.nav.wishlist, to: paths.wishlist },
    { key: 'sign-in', label: strings.nav.signIn, to: paths.login },
    { key: 'register', label: strings.nav.register, to: paths.register },
  ];
}

function getAboutLinks(): readonly FooterLink[] {
  return [
    { key: 'about-us', label: strings.footer.links.aboutUs },
    { key: 'stores', label: strings.footer.links.stores },
    { key: 'careers', label: strings.footer.links.careers },
    { key: 'blog', label: strings.footer.links.journal },
  ];
}

export function getFooterGroups(): readonly FooterGroup[] {
  return [
    {
      key: 'shop',
      heading: strings.footer.shopHeading,
      links: getShopLinks(),
    },
    {
      key: 'support',
      heading: strings.footer.supportHeading,
      links: getSupportLinks(),
    },
    {
      key: 'account',
      heading: strings.footer.accountHeading,
      links: getAccountLinksForFooter(),
    },
    {
      key: 'about',
      heading: strings.footer.aboutHeading,
      links: getAboutLinks(),
    },
  ];
}

export function getLegalLinks(): readonly FooterLink[] {
  return [
    { key: 'privacy', label: strings.footer.links.privacy },
    { key: 'terms', label: strings.footer.links.terms },
    { key: 'refunds', label: strings.footer.links.refunds },
    { key: 'cookies', label: strings.footer.links.cookies },
    { key: 'accessibility', label: strings.footer.links.accessibility },
  ];
}

export type PaymentIconProps = {
  size?: number;
  'aria-hidden'?: boolean | 'true' | 'false';
  focusable?: boolean | 'true' | 'false';
};

export type PaymentMethod =
  | {
      name: string;
      type: 'icon';
      Icon: typeof SiVisa | typeof SiMastercard;
      alt: string;
    }
  | {
      name: string;
      type: 'image';
      logo: string;
      alt: string;
    };

export const paymentMethods: readonly PaymentMethod[] = [
  {
    name: 'Visa',
    type: 'icon',
    Icon: SiVisa,
    alt: 'Visa',
  },
  {
    name: 'Mastercard',
    type: 'icon',
    Icon: SiMastercard,
    alt: 'Mastercard',
  },
];
