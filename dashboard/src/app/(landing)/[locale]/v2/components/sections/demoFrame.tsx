'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { LoadingMark } from '@/landing/components/ui/brandMark';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { useInView } from '@/landing/hooks/useInView';
import { COPY } from '@/landing/content/copy';
import { track } from '@/landing/lib/analytics';
import styles from './demoFrame.module.css';

const copy = COPY.demo;
/** Cap on waiting for the page's load event, which a hung request elsewhere can stall. */
const LOAD_WAIT_MS = 3000;
/** After this, the loader gives way to a link to the full demo. */
const STALL_MS = 15000;

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

/** Click-to-activate dashboard embed; the scrim stops the iframe swallowing page scroll. */
export function DemoFrame({ src }: { src: string }) {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const [stalled, setStalled] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const near = useInView(areaRef, 'near');
  const onScreen = useInView(areaRef, 'onScreen');
  const armed = loaded && !active;

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
              className='text-label text-muted underline decoration-rule-30 underline-offset-[3px] transition-colors duration-180 ease-out-expo hover:text-fg hover:decoration-current'
              href='/demo'
              target='_blank'
              rel='noopener'
              placement='demo'
              destination='demo'
            >
              {copy.stalled}
              <ArrowUpRight className='ml-1 inline size-3.5 align-[-2px]' aria-hidden />
              <span className='sr-only'> {copy.newTab}</span>
            </TrackedLink>
          ) : (
            <>
              <LoadingMark className='size-12 text-muted' />
              <p className='sr-only'>{copy.loading}</p>
            </>
          )}
        </div>
      )}
      {/* laid out at 1/scale, then scaled down, so more of the dashboard fits */}
      {requested && (
        <iframe
          ref={frame}
          className='absolute top-0 left-0 size-[calc(100%/var(--demo-scale))] origin-top-left scale-(--demo-scale)'
          src={src}
          title={copy.frameTitle}
          allowFullScreen
          sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
          referrerPolicy='no-referrer'
          tabIndex={armed ? -1 : undefined}
          onLoad={() => setLoaded(true)}
        />
      )}
      {loaded && (
        <button
          type='button'
          className={styles.scrim}
          aria-label={copy.activateAria}
          disabled={active}
          onClick={() => {
            setActive(true);
            frame.current?.focus();
            track.demoOpened();
          }}
        >
          <span className={styles.line} aria-hidden>
            {copy.activateLine}
          </span>
        </button>
      )}
    </div>
  );
}
