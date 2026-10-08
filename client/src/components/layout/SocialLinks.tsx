import { SiFacebook, SiInstagram, SiTelegram, SiYoutube } from 'react-icons/si';
import type { IconType } from 'react-icons';

import { siteConfig } from '@/config/site';
import { strings } from '@/i18n/strings';

type Network = {
  key: string;
  label: string;
  href: string;
  Icon: IconType;
};

const networks: readonly Network[] = [
  {
    key: 'instagram',
    label: 'Instagram',
    href: siteConfig.social.instagram,
    Icon: SiInstagram,
  },
  {
    key: 'facebook',
    label: 'Facebook',
    href: siteConfig.social.facebook,
    Icon: SiFacebook,
  },
  {
    key: 'telegram',
    label: 'Telegram',
    href: siteConfig.social.telegram,
    Icon: SiTelegram,
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: siteConfig.social.youtube,
    Icon: SiYoutube,
  },
];

export function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-2">
      {networks.map(({ key, label, href, Icon }) => (
        <li key={key}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={strings.footer.opensInNewTab(label)}
            className="flex h-11 w-11 items-center justify-center rounded-control border border-border text-ink-600 transition-colors hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            <Icon size={20} aria-hidden="true" focusable="false" />
          </a>
        </li>
      ))}
    </ul>
  );
}
