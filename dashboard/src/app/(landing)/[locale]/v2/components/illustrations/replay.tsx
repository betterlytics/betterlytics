'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { IllustrationProps } from './types';
import { CursorGlyph } from '@/landing/components/ui/cursorGlyph';
import { LiftSwap } from '@/landing/components/ui/liftSwap';
import { useReducedMotion } from '@/landing/hooks/useReducedMotion';
import { vars } from '@/landing/lib/cssVars';

/* Illustration copy is mock product UI, kept literal on purpose. */

/** One pass of the recording. Every keyframe in the stylesheet runs on this loop. */
const LOOP_MS = 11000;
/** The recorded session's length, played across one loop (so 2×). */
const SESSION_S = 22;

/**
 * What the player narrates, keyed to where in the loop it happens. `at` is
 * also where the event's marker sits on the scrub track, so the play head
 * reaches each marker as its line swaps in. The error is the same one the
 * errors card lists next, so the two cards tell one story. It gets a second
 * to itself before the rage clicks, and its marker flares as the head passes:
 * the visitor never sees it, so the player is where it shows.
 */
const BEATS = [
  { at: 0, kind: 'Page view', detail: '/pricing' },
  { at: 0.36, kind: 'Click', detail: 'Choose Pro' },
  { at: 0.43, kind: 'TypeError', detail: "reading 'plan'", bad: true, flare: true },
  { at: 0.59, kind: 'Rage click', detail: '4× on Choose Pro', bad: true },
  { at: 0.86, kind: 'Page exit', detail: '/pricing' },
] as const;
/** The frame shown when motion is reduced: the rage click, mid-session. */
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

/**
 * A session being replayed: a visitor's pricing page, where Choose Pro spins,
 * fails, and gets rage-clicked before they leave. The page is in the site's
 * own warm monochrome so everything the player draws on top (the visitor's
 * cursor and its tag, the click ripples) reads as the player's.
 *
 * The page motion is CSS on one shared loop, paused unless the card is live.
 * The player bar follows that loop by reading the scrub animation's own clock
 * each frame, so the time and the narrated event never drift from the page.
 *
 * The pause button is real: it holds that same loop where it is, page, cursor,
 * scrub and all, and plays it on from there. Leaving the card resets it, so the
 * replay is playing again when the card comes back.
 */
export function Replay({ live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const fillRef = useRef<HTMLElement>(null);
  const timeRef = useRef<HTMLTimeElement>(null);
  const [beat, setBeat] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!live) setPaused(false);
  }, [live]);

  useEffect(() => {
    if (!live || reduce || paused) return;
    const fill = fillRef.current;
    const time = timeRef.current;
    if (!fill || !time) return;
    let raf = 0;
    const tick = () => {
      const ms = Number(fill.getAnimations()[0]?.currentTime ?? 0);
      const phase = (ms % LOOP_MS) / LOOP_MS;
      const text = clock(phase * SESSION_S);
      if (time.textContent !== text) time.textContent = text;
      setBeat(beatAt(phase));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live, reduce, paused]);

  const shown = reduce ? STILL_BEAT : beat;
  const event = BEATS[shown];

  return (
    <div className={cn('sr', paused && 'is-paused')} style={vars({ '--loop': `${LOOP_MS}ms` })}>
      {/* the player's own header, as the other cards have, not a browser's chrome */}
      <div className='sr__hd'>
        <b>Session replay</b>
        <span>acme.com/pricing</span>
      </div>
      <div className='sr__vp' aria-hidden>
        <div className='sr__page'>
          <div className='sr__nav'>
            <b>
              <i />
              acme
            </b>
            <span>Product</span>
            <span>Pricing</span>
            <span>Docs</span>
            <em>Sign in</em>
          </div>
          <h4>Simple, honest pricing</h4>
          <p>Start free. Upgrade when you grow.</p>
          <div className='sr__plans'>
            <div className='sr__plan'>
              <b>Starter</b>
              <strong>$0</strong>
              <i />
              <i />
              <span className='sr__btn'>Get started</span>
            </div>
            <div className='sr__plan sr__plan--pop'>
              <b>
                Pro <u>Popular</u>
              </b>
              <strong>
                $19<small>/mo</small>
              </strong>
              <i />
              <i />
              <span className='sr__cta'>
                <span className='sr__btn sr__btn--pro'>
                  <span>Choose Pro</span>
                  <s />
                </span>
              </span>
            </div>
            <div className='sr__plan'>
              <b>Team</b>
              <strong>
                $49<small>/mo</small>
              </strong>
              <i />
              <i />
              <span className='sr__btn'>Contact sales</span>
            </div>
          </div>
        </div>
        <span className='sr__rip' />
        <span className='sr__rip sr__rip--rage' />
        {/* the visitor's cursor; its tag only shows at the clicks, first captured, then raged */}
        <span className='sr__cur'>
          <CursorGlyph solid />
          <span className='sr__who'>
            <span>Click captured</span>
            <span>4× rage clicks</span>
          </span>
        </span>
      </div>
      {/* the play footer: the event being played, the scrub track with its markers, then the controls row */}
      <div className='sr__bar'>
        <LiftSwap as='p' className='sr__ev' id={String(shown)}>
          <i className={cn('bad' in event && 'is-bad')} />
          <b>{event.kind}</b>
          {event.detail}
        </LiftSwap>
        <span className='sr__tr' aria-hidden>
          {/* a flaring marker runs the loop offset by its own time, so its flare starts as the head arrives */}
          {BEATS.slice(1).map((b) => (
            <em
              key={b.kind}
              className={cn('bad' in b && 'is-bad', 'flare' in b && 'is-flare')}
              style={{ left: `${b.at * 100}%`, animationDelay: 'flare' in b ? `${b.at * LOOP_MS}ms` : undefined }}
            />
          ))}
          <i ref={fillRef} />
        </span>
        {/* the recording's controls; the viewBoxes are cropped to the glyphs so the icons meet
            the track's ends instead of sitting inset from them */}
        <div className='sr__row sr__ctl'>
          {/* the one working control; the others are the player's, drawn */}
          <button
            type='button'
            className='sr__pp'
            onClick={() => setPaused((p) => !p)}
            disabled={reduce}
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
          <time ref={timeRef}>{clock(reduce ? BEATS[STILL_BEAT].at * SESSION_S : 0)}</time>
          <span>/</span>
          <time>{clock(SESSION_S)}</time>
          <b className='sr__speed'>2×</b>
          <svg className='sr__max' viewBox='0.85 0.85 10.3 10.3' aria-hidden>
            <path d='M7 1.5h3.5V5M5 10.5H1.5V7M10.5 1.5 7 5M1.5 10.5 5 7' />
          </svg>
        </div>
      </div>
    </div>
  );
}
