'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { CursorGlyph } from '@/landing/components/ui/cursorGlyph';
import { LiftSwap } from '@/landing/components/ui/liftSwap';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import type { IllustrationProps } from './types';
import styles from './replay.module.css';

/* Mock product copy, kept literal on purpose. */

/** Every keyframe loop in replay.module.css runs on this. */
const LOOP_MS = 11000;
/** Played across one loop, hence the 2× label. */
const SESSION_S = 22;

/** `at` is both the loop phase and the marker's track position; keyframes in replay.module.css follow it. */
const BEATS = [
  { at: 0, kind: 'Page view', detail: '/pricing' },
  { at: 0.36, kind: 'Click', detail: 'Choose Pro' },
  { at: 0.43, kind: 'TypeError', detail: "reading 'plan'", bad: true, flare: true },
  { at: 0.59, kind: 'Rage click', detail: '4× on Choose Pro', bad: true },
  { at: 0.86, kind: 'Page exit', detail: '/pricing' },
] as const;
/** Reduced-motion still; its frame is set in replay.module.css. */
const STILL_BEAT = 3;

function beatAt(phase: number) {
  let i = 0;
  while (i + 1 < BEATS.length && phase >= BEATS[i + 1].at) i++;
  return i;
}

function clock(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function PricingPage() {
  return (
    <div className={styles.page}>
      <div className={styles.siteNav}>
        <b>
          <i />
          acme
        </b>
        <span>Product</span>
        <span>Pricing</span>
        <span>Docs</span>
        <em>Sign in</em>
      </div>
      <p className={styles.title}>Simple, honest pricing</p>
      <p className={styles.tagline}>Start free. Upgrade when you grow.</p>
      <div className={styles.plans}>
        <div className={styles.plan}>
          <b>Starter</b>
          <strong>$0</strong>
          <i />
          <i />
          <span className={styles.button}>Get started</span>
        </div>
        <div className={cn(styles.plan, styles.popular)}>
          <b>
            Pro <u>Popular</u>
          </b>
          <strong>
            $19<small>/mo</small>
          </strong>
          <i />
          <i />
          <span className={styles.cta}>
            <span className={cn(styles.button, styles.pro)}>
              <span>Choose Pro</span>
              <s />
            </span>
          </span>
        </div>
        <div className={styles.plan}>
          <b>Team</b>
          <strong>
            $49<small>/mo</small>
          </strong>
          <i />
          <i />
          <span className={styles.button}>Contact sales</span>
        </div>
      </div>
    </div>
  );
}

/** The bar reads the scrub animation's own clock each frame, so it never drifts from the CSS loop. */
export function Replay({ entered, live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const fillRef = useRef<HTMLElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);
  // state, so the server markup and first client render agree
  const [still, setStill] = useState(false);

  useEffect(() => setStill(reduce === true), [reduce]);

  useEffect(() => {
    if (!live) setPaused(false);
  }, [live]);

  useEffect(() => {
    if (!live || reduce || paused) return;
    const fill = fillRef.current;
    const time = timeRef.current;
    if (!fill || !time) return;
    let raf = 0;
    let narrated = -1;
    const tick = () => {
      const ms = Number(fill.getAnimations()[0]?.currentTime ?? 0);
      const phase = (ms % LOOP_MS) / LOOP_MS;
      const text = clock(phase * SESSION_S);
      if (time.textContent !== text) time.textContent = text;
      const next = beatAt(phase);
      if (next !== narrated) {
        narrated = next;
        setBeat(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, reduce, paused]);

  const shown = still ? STILL_BEAT : beat;
  const event = BEATS[shown];

  return (
    <div
      className={styles.player}
      data-in={entered || undefined}
      data-live={live || undefined}
      data-paused={paused || undefined}
      style={vars({ '--loop': `${LOOP_MS}ms` })}
    >
      {/* not role='img', so the pause button stays reachable */}
      <p className='sr-only'>{COPY.illustrations.replay}</p>
      <div className={styles.header} aria-hidden>
        <b>Session replay</b>
        <span>acme.com/pricing</span>
      </div>
      <div className={styles.viewport} aria-hidden>
        <PricingPage />
        <span className={styles.ripple} />
        <span className={cn(styles.ripple, styles.rage)} />
        <span className={styles.cursor}>
          <CursorGlyph />
          <span className={styles.tag}>
            <span>Click captured</span>
            <span>4× rage clicks</span>
          </span>
        </span>
      </div>
      <div className={styles.bar}>
        <p className={styles.event} aria-hidden>
          <LiftSwap as='span' className='block' id={String(shown)}>
            <i data-bad={'bad' in event || undefined} />
            <b>{event.kind}</b>
            {event.detail}
          </LiftSwap>
        </p>
        <span className={styles.track} aria-hidden>
          {BEATS.slice(1).map((b) => (
            <i
              key={b.kind}
              className={styles.tick}
              data-bad={'bad' in b || undefined}
              data-flare={'flare' in b || undefined}
              style={vars({ '--at': b.at })}
            />
          ))}
          <i ref={fillRef} className={styles.fill} />
        </span>
        {/* viewBoxes are cropped to the glyphs so the icons meet the track's ends */}
        <div className={styles.controls}>
          <button
            type='button'
            className={styles.toggle}
            onClick={() => setPaused((p) => !p)}
            disabled={still}
            aria-label={paused ? 'Play replay' : 'Pause replay'}
          >
            <svg viewBox='2 1.5 8 9' aria-hidden>
              {paused ? (
                <path d='M3 2.2v7.6a.7.7 0 0 0 1.07.6l5.5-3.8a.7.7 0 0 0 0-1.2L4.07 1.6A.7.7 0 0 0 3 2.2Z' />
              ) : (
                <>
                  <rect x='2' y='1.5' width='3' height='9' rx='0.8' />
                  <rect x='7' y='1.5' width='3' height='9' rx='0.8' />
                </>
              )}
            </svg>
          </button>
          <span ref={timeRef} className={styles.clock} aria-hidden>
            {clock(still ? BEATS[STILL_BEAT].at * SESSION_S : 0)}
          </span>
          <span className={styles.divider} aria-hidden>
            /
          </span>
          <span className={styles.clock} aria-hidden>
            {clock(SESSION_S)}
          </span>
          <b className={styles.speed} aria-hidden>
            2×
          </b>
          <svg className={styles.expand} viewBox='0.85 0.85 10.3 10.3' aria-hidden>
            <path d='M7 1.5h3.5V5M5 10.5H1.5V7M10.5 1.5 7 5M1.5 10.5 5 7' />
          </svg>
        </div>
      </div>
    </div>
  );
}
