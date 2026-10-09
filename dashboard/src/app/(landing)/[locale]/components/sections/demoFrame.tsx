'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LoadingMark } from '@/landing/components/ui/brandMark';
import { FINE_LINK } from '@/landing/components/ui/text';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { track } from '@/landing/lib/analytics';
import styles from './demoFrame.module.css';

/** Cap on waiting for the page's load event, which a hung request elsewhere can stall. */
const LOAD_WAIT_MS = 3000;
const STALL_MS = 15000;
/** Once on screen, the loader stays at least this long, so a fast load doesn't flash it. */
const MIN_LOADER_MS = 400;

function whenPageSettles(start: () => void) {
  let cancel = () => {};
  const schedule = () => {
    // Safari has no requestIdleCallback
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(start, { timeout: 2000 });
      cancel = () => window.cancelIdleCallback(id);
    } else {
      const id = window.setTimeout(start, 200);
      cancel = () => window.clearTimeout(id);
    }
  };
  if (document.readyState === 'complete') {
    schedule();
    return () => cancel();
  }
  const onLoad = () => {
    window.clearTimeout(fallback);
    window.removeEventListener('load', onLoad);
    schedule();
  };
  const fallback = window.setTimeout(onLoad, LOAD_WAIT_MS);
  window.addEventListener('load', onLoad);
  return () => {
    window.clearTimeout(fallback);
    window.removeEventListener('load', onLoad);
    cancel();
  };
}

/** Click-to-activate: the scrim stops the iframe swallowing page scroll. */
export function DemoFrame({ src }: { src: string }) {
  const t = useTranslations('landing.demo');
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [stalled, setStalled] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const loaderSeenAt = useRef<number | null>(null);
  const revealTimer = useRef<number | undefined>(undefined);
  const near = useInView(areaRef, 'near');
  const onScreen = useInView(areaRef, 'onScreen');
  const armed = loaded && !active;

  const reveal = () => {
    const seenAt = loaderSeenAt.current;
    const wait = seenAt === null ? 0 : MIN_LOADER_MS - (performance.now() - seenAt);
    if (wait > 0) revealTimer.current = window.setTimeout(() => setLoaded(true), wait);
    else setLoaded(true);
  };

  // same-origin, so it shares this page's main thread: load only once near and idle
  useEffect(() => (near ? whenPageSettles(() => setRequested(true)) : undefined), [near]);
  useEffect(() => {
    if (!requested || loaded) return;
    const id = window.setTimeout(() => setStalled(true), STALL_MS);
    return () => window.clearTimeout(id);
  }, [requested, loaded]);
  // re-arm off screen too, since touch has no pointer to leave
  useEffect(() => {
    if (!onScreen) setActive(false);
  }, [onScreen]);
  useEffect(() => {
    if (onScreen && !loaded && loaderSeenAt.current === null) loaderSeenAt.current = performance.now();
  }, [onScreen, loaded]);
  useEffect(() => () => window.clearTimeout(revealTimer.current), []);

  return (
    <div
      ref={areaRef}
      className='absolute inset-x-0 top-11 bottom-0 overflow-hidden bg-canvas [--demo-scale:0.75] max-3xl:[--demo-scale:0.85] max-md:[--demo-scale:1]'
      data-armed={armed || undefined}
      onPointerLeave={() => setActive(false)}
    >
      {!loaded && (
        <div className='absolute inset-0 grid place-items-center'>
          {stalled ? (
            <TrackedLink
              className={cn('text-label text-muted', FINE_LINK)}
              href='/demo'
              target='_blank'
              rel='noopener'
              placement='demo'
              destination='demo'
            >
              {t('stalled')}
              <ArrowUpRight className='ml-1 inline size-3.5 align-[-2px]' aria-hidden />
              <span className='sr-only'> {t('newTab')}</span>
            </TrackedLink>
          ) : (
            <>
              <LoadingMark className='size-12 text-muted' />
              <p className='sr-only'>{t('loading')}</p>
            </>
          )}
        </div>
      )}
      {requested && (
        <iframe
          ref={frame}
          className='absolute top-0 left-0 size-[calc(100%/var(--demo-scale))] origin-top-left scale-(--demo-scale)'
          src={src}
          title={t('frameTitle')}
          allowFullScreen
          sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
          referrerPolicy='no-referrer'
          tabIndex={armed ? -1 : undefined}
          onLoad={reveal}
        />
      )}
      {loaded && (
        <button
          type='button'
          className={styles.scrim}
          aria-label={t('activateAria')}
          disabled={active}
          onClick={() => {
            setActive(true);
            frame.current?.focus();
            track.demoOpened();
          }}
        >
          <span className={styles.line} aria-hidden>
            {t('activateLine')}
          </span>
        </button>
      )}
    </div>
  );
}
