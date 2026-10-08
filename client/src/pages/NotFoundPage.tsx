import { Link } from 'react-router-dom';

import { strings } from '@/i18n/strings';
import { useSeo } from '@/lib/seo';
import { paths } from '@/routes/paths';

export function NotFoundPage() {
  useSeo({ title: strings.errors.notFoundTitle, noIndex: true });

  return (
    <div className="mx-auto max-w-narrow px-page-x py-16 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-display-sm">{strings.errors.notFound}</h1>
      <p className="mt-3 text-ink-600">{strings.errors.notFoundHint}</p>
      <Link
        to={paths.home}
        className="mt-6 inline-block rounded-control bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 hover:no-underline"
      >
        {strings.actions.backHome}
      </Link>
    </div>
  );
}
