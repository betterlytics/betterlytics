'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

/**
 * The embedded dashboard, click to activate.
 *
 * The scrim earns its place twice. It is the only thing on the page that tells
 * the reader the product in front of them is live and theirs to poke at — the
 * window dots above it otherwise read as a screenshot. And it keeps the wheel:
 * an iframe this size swallows scroll, so without it anyone moving down the
 * page gets caught inside the dashboard. The pointer leaving the frame re-arms
 * it, so a second pass down the page scrolls just as cleanly as the first.
 */
export function DemoFrame({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  return (
    <div className={cn('demo__frame', active && 'is-active')} onPointerLeave={() => setActive(false)}>
      {!loaded && <div className='demo__load'>{COPY.demo.loading}</div>}
      <iframe
        ref={frame}
        src={src}
        title={COPY.demo.frameTitle}
        loading='lazy'
        allowFullScreen
        sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
        referrerPolicy='no-referrer'
        onLoad={() => setLoaded(true)}
      />
      {loaded && !active && (
        <button
          type='button'
          className='demo__scrim'
          aria-label={COPY.demo.activateAria}
          onClick={() => {
            setActive(true);
            frame.current?.focus();
          }}
        >
          <span className='demo__tap' aria-hidden>
            <i />
            <i />
          </span>
          <b aria-hidden>{COPY.demo.activateLabel}</b>
          <span aria-hidden>{COPY.demo.activateBody}</span>
        </button>
      )}
    </div>
  );
}
