'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import { CursorGlyph } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/cursorGlyph';
import type { IllustrationProps } from './types';

/* Illustration copy is mock product UI, kept literal on purpose. */

const SPARKS = {
  hot: [12, 12, 12, 12, 12, 12, 12, 12, 19, 33, 51, -69, -85, -100],
  stripe: [-75, 50, -88, -62, -100, -75, -62, -88, -75, -100, -62, -88, -75, -62],
  resolved: [-100, -82, -64, 50, 36, 27, 18, 14, 12, 12, 12, 12, 12, 12],
};

/** Negative heights mark the highlighted bars. */
function Sparkline({ bars }: { bars: number[] }) {
  return (
    <span className='erx__sp'>
      {bars.map((h, i) => (
        <s key={i} className={cn(h < 0 && 'hi')} style={{ height: `${Math.abs(h)}%` }} />
      ))}
    </span>
  );
}

const BREADCRUMBS = [
  { at: '12:04:02', kind: 'pageview', what: '/pricing' },
  { at: '12:04:11', kind: 'click', what: '#plan-toggle' },
  { at: '12:04:18', kind: 'click', what: '#plan-pro' },
  { at: '12:04:19', kind: 'error', what: 'TypeError thrown', error: true },
];

type Phase = 'idle' | 'open' | 'crumbs';

/**
 * The product being used: a cursor opens the error, reads the trace, then
 * switches to breadcrumbs. Plays only while the card is active, and shows the
 * final state at rest under reduced motion.
 */
export function Errors({ live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const figRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [cursor, setCursor] = useState<{ on: boolean; tap: number; x: number; y: number }>({
    on: false,
    tap: 0,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!live || reduce) {
      setPhase('idle');
      setCursor((c) => ({ ...c, on: false }));
      return;
    }
    let run = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) => new Promise<void>((resolve) => timers.push(setTimeout(resolve, ms)));
    const at = (el: Element | null, dx: number, dy: number) => {
      const fig = figRef.current;
      if (!el || !fig) return;
      const a = el.getBoundingClientRect();
      const b = fig.getBoundingClientRect();
      setCursor((c) => ({ ...c, x: a.left - b.left + dx, y: a.top - b.top + dy }));
    };
    const tap = async () => {
      setCursor((c) => ({ ...c, tap: c.tap + 1 }));
      await wait(200);
    };
    const play = async () => {
      while (run) {
        setPhase('idle');
        setCursor((c) => ({ ...c, on: false }));
        await wait(650);
        if (!run) return;
        at(rowRef.current, 300, 54);
        setCursor((c) => ({ ...c, on: true }));
        await wait(400);
        at(rowRef.current, 230, 16);
        await wait(740);
        await tap();
        setPhase('open');
        await wait(1600);
        if (!run) return;
        at(tabRef.current, 36, 12);
        await wait(740);
        await tap();
        setPhase('crumbs');
        await wait(2700);
        if (!run) return;
        setCursor((c) => ({ ...c, on: false }));
        await wait(650);
      }
    };
    play();
    return () => {
      run = false;
      timers.forEach(clearTimeout);
    };
  }, [live, reduce]);

  const open = phase !== 'idle';
  const crumbs = phase === 'crumbs';

  return (
    <div className='erx' ref={figRef}>
      <div className='erx__p'>
        <div className='erx__hd'>
          <b>Errors</b>
          <u className='sel'>Unresolved</u>
          <u>7 days</u>
          <em>37 groups · 1,412 events</em>
        </div>
        <div className={cn('erx__row', open && 'hot')} ref={rowRef}>
          <i />
          <div>
            <div className='erx__l1'>
              <b>TypeError</b>
              <span>Cannot read properties of null (reading &apos;plan&apos;)</span>
            </div>
            <div className='erx__l2'>pricing.tsx:142 · Chrome 89% · 12s ago</div>
          </div>
          <Sparkline bars={SPARKS.hot} />
          <span className='erx__n'>1,206</span>
        </div>
        <div className={cn('erx__d', open && 'open')}>
          <div className='erx__tabs'>
            <u className={cn(!crumbs && 'on')}>Stack trace</u>
            <u className={cn(crumbs && 'on')} ref={tabRef}>
              Breadcrumbs
            </u>
          </div>
          <div className={cn('erx__pane', !crumbs && 'on')}>
            at <i>selectPlan</i> · pricing.tsx:142:19
            <br />
            at <i>onClick</i> · PlanCard.tsx:61:7
            <br />
            at <i>HTMLButtonElement.callCallback</i> · react-dom.js:4164
          </div>
          <div className={cn('erx__pane', crumbs && 'on')}>
            <div className='erx__bc'>
              {BREADCRUMBS.map((c) => (
                <div key={c.at} className={cn('erx__bl', c.error && 'er')}>
                  <s>{c.at}</s>
                  <u>{c.kind}</u>
                  <i>{c.what}</i>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className='erx__row'>
          <i />
          <div>
            <div className='erx__l1'>
              <b>ReferenceError</b>
              <span>stripe is not defined</span>
            </div>
            <div className='erx__l2'>checkout.js:87 · Safari 61% · 3h ago</div>
          </div>
          <Sparkline bars={SPARKS.stripe} />
          <span className='erx__n'>84</span>
        </div>
        <div className='erx__row'>
          <i className='ok' />
          <div>
            <div className='erx__l1'>
              <b className='ok'>TypeError</b>
              <span>Failed to fetch</span>
            </div>
            <div className='erx__l2'>contact.js:31 · resolved in v2.14.0</div>
          </div>
          <Sparkline bars={SPARKS.resolved} />
          <span className='erx__n dim'>0</span>
        </div>
      </div>
      <span className={cn('erx__cur', cursor.on && 'on')} style={{ left: cursor.x, top: cursor.y }} aria-hidden>
        <CursorGlyph />
        {/* keyed so each tap restarts the ripple animation */}
        <u key={cursor.tap} className={cn(cursor.tap > 0 && 'tap')} />
      </span>
    </div>
  );
}
