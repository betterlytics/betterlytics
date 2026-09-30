'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from '@/landing/hooks/useInView';
import { COPY } from '@/landing/content/copy';
import { track } from '@/landing/lib/analytics';
import styles from './demoFrame.module.css';

const copy = COPY.demo;

/** Runs `start` once the page has loaded and the browser is idle; returns a cancel. */
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

/**
 * The embedded dashboard, click to activate.
 *
 * The scrim earns its place twice. It is the only thing on the page that tells
 * the reader the product in front of them is live and theirs to poke at — the
 * window dots above it otherwise read as a screenshot. And it keeps the wheel:
 * an iframe this size swallows scroll, so without it anyone moving down the
 * page gets caught inside the dashboard. The pointer leaving the frame re-arms
 * it, as does the frame leaving the screen (a touch has no pointer to leave), so
 * a second pass down the page scrolls just as cleanly as the first.
 * Keyboard readers meet it the same way: while it is armed the dashboard is out
 * of the tab order, so tabbing down the page steps over it rather than through
 * every control inside it.
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
 *
 * The dashboard is an app of its own served from this origin, so it runs on this
 * page's main thread. It is only created once the landing has loaded and gone idle,
 * and the window is within half a screen, so it never competes with the page's own
 * start-up.
 */
export function DemoFrame({ src }: { src: string }) {
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState(false);
  const areaRef = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const near = useInView(areaRef, 'near');
  const onScreen = useInView(areaRef, 'onScreen');
  // the scrim is up: the page keeps the wheel, and the tab order steps over the dashboard
  const armed = loaded && !active;

  useEffect(() => (near ? whenPageSettles(() => setRequested(true)) : undefined), [near]);
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
      {/* The dashboard lays out at 1/scale of the window and is drawn scaled down, so more of
          it fits without changing the window. Pointer events map through the scale, so it
          stays interactive. */}
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
