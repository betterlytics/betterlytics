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
 *
 * It carries one line and nothing else. Anything placed at its centre — a
 * glyph, a pill — reads as the target, and the target is the whole frame; the
 * line says so, and the frame's own edge answers the pointer to show it.
 *
 * Activating marks it rather than unmounting it. Unmounting dropped the veil in
 * a single frame while the edge was still easing, and two exits on two clocks
 * read as the frame coming apart in stages. Marked, the veil and the edge share
 * one transition and leave together — which is itself the click landing, so
 * nothing else has to signal it.
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
      {loaded && (
        <button
          type='button'
          className={cn('demo__scrim', active && 'is-gone')}
          aria-label={COPY.demo.activateAria}
          disabled={active}
          onClick={() => {
            setActive(true);
            frame.current?.focus();
          }}
        >
          <span className='demo__say' aria-hidden>
            {COPY.demo.activateLine}
          </span>
        </button>
      )}
    </div>
  );
}
