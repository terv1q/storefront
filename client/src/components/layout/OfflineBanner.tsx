/**
 * The strip that says the connection has gone.
 *
 * It appears while the browser reports no connection and takes itself away when
 * the connection comes back, which is what makes it worth a component: the
 * failure it describes is the one a shopper can do something about, and a page
 * full of error panels does not say whether the store is broken or the wifi is.
 *
 * Two readings of the same fact. The strip itself is a `role="status"` region
 * that appears and disappears, so a screen reader is told the connection went;
 * coming back is said once as a notification, because a strip that vanishes says
 * nothing at all. The notification is sent only on the offline-to-online
 * transition, so the first render of an online page is silent.
 *
 * Nothing is retried from here. The queries that failed have their own retry
 * buttons and their own error states, and a page that refetched everything the
 * moment a link came back would be guessing about which of those the shopper had
 * already dealt with.
 */

import { WifiOff } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { strings } from '@/i18n/strings';
import { notify } from '@/store/toast.store';

export function OfflineBanner() {
  const online = useOnlineStatus();

  /** What the status was on the last render, so the transition can be seen. */
  const wasOnline = useRef(online);

  useEffect(() => {
    if (!wasOnline.current && online) {
      notify(strings.offline.backOnline, { tone: 'success' });
    }

    wasOnline.current = online;
  }, [online]);

  if (online) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-50 px-page-x py-2 text-sm text-warning-700"
    >
      <WifiOff aria-hidden="true" size={16} />
      <span className="font-medium">{strings.offline.title}</span>
      <span className="text-ink-700">{strings.offline.body}</span>
    </div>
  );
}
