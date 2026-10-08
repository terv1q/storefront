/**
 * The promo strip above the header.
 *
 * The messages come from the `i18n` tables, through `getAnnouncementMessages`,
 * and rotate on a timer. Rotation stops
 * while the pointer is over the strip or while anything in it has focus, so a
 * message cannot change under someone who is reading it or about to click it,
 * and it does not run at all when the visitor asked for reduced motion — the
 * strip then shows its first message with the arrows left for manual moves.
 *
 * The dismissal is stored with the announcement's version. Raising
 * `siteConfig.announcement.version` is what brings the strip back for everyone
 * who dismissed an earlier set of messages; nothing else has to be cleared.
 *
 * The message itself is a fixed-height line, so swapping one for another moves
 * nothing on the page. The rotating text is not a live region: announcing a
 * promo every few seconds would interrupt a screen reader mid-sentence, so the
 * arrows carry the state instead, each opening with the message it shows.
 */

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import { getAnnouncementMessages, siteConfig } from '@/config/site';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { strings } from '@/i18n/strings';
import { STORAGE_KEYS, readString, writeString } from '@/utils/storage';

import { MarketSelect } from './MarketSelect';

const { version, rotationMs } = siteConfig.announcement;

/** The focus ring the brand background needs, in place of the global outline. */
const controlClass =
  'rounded-control p-1 transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-100';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(() => {
    const stored = readString(STORAGE_KEYS.announcementDismissed);

    return stored === String(version);
  });
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const messages = getAnnouncementMessages();

  const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (dismissed || reduceMotion || paused || messages.length < 2) {
      return;
    }

    timer.current = window.setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, rotationMs);

    return () => {
      window.clearInterval(timer.current);
    };
  }, [dismissed, reduceMotion, paused]);

  if (dismissed) {
    return null;
  }

  const step = (delta: number) => {
    setIndex((current) => (current + delta + messages.length) % messages.length);
  };

  const dismiss = () => {
    writeString(STORAGE_KEYS.announcementDismissed, String(version));
    setDismissed(true);
  };

  return (
    <div
      className="bg-brand-700 text-brand-50"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="mx-auto flex max-w-page items-center gap-2 px-page-x py-1.5">
        {/* The height is fixed here, not by the text, so a long and a short
            message occupy the same line and the page below never moves. */}
        <div className="relative h-5 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence initial={false} mode="wait">
            <motion.p
              key={messageKey(messages[index], index)}
              initial={reduceMotion ? undefined : { opacity: 0, y: '60%' }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: '-60%' }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              title={messages[index]}
              className="absolute inset-0 truncate text-center text-sm leading-5"
            >
              {messages[index]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {messages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={strings.announcement.previous}
                className={controlClass}
              >
                <ChevronLeft aria-hidden="true" size={16} />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={strings.announcement.next}
                className={controlClass}
              >
                <ChevronRight aria-hidden="true" size={16} />
              </button>
            </>
          ) : null}

          <MarketSelect variant="brand" />

          <button
            type="button"
            onClick={dismiss}
            aria-label={strings.announcement.dismiss}
            className={controlClass}
          >
            <X aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Two messages may repeat, so the index is what identifies the one on screen;
 * the text alone would not re-trigger the swap between duplicates.
 */
function messageKey(message: string | undefined, index: number): string {
  return `${index}:${message ?? ''}`;
}
