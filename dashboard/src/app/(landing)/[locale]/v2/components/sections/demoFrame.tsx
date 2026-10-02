'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/landing/hooks/useInView';
import { COPY } from '@/landing/content/copy';
import { track } from '@/landing/lib/analytics';
import styles from './demoFrame.module.css';

const copy = COPY.demo;

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
  window.addEventListener('load', schedule, { once: true });
  return () => {
    window.removeEventListener('load', schedule);
    cancel();
  };
}

/** Click-to-activate dashboard embed; the scrim stops the iframe swallowing page scroll. */
export function DemoFrame({ src }: { src: string }) {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const near = useInView(areaRef, 'near');
  const onScreen = useInView(areaRef, 'onScreen');
  const armed = loaded && !active;

  // same-origin, so it shares this page's main thread: load only once near and idle
  useEffect(() => (near ? whenPageSettles(() => setRequested(true)) : undefined), [near]);
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
        <p className='absolute inset-0 grid place-items-center font-mono text-micro tracking-[0.16em] text-muted uppercase'>
          {copy.loading}
        </p>
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
