'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';
import type { IllustrationProps } from './types';

/* Illustration copy is mock product UI, kept literal on purpose. */

const EVENTS: ReadonlyArray<[name: string, arg: string, step: number]> = [
  ['page_view', '/blog/measuring-churn', 0],
  ['cta_click', '#start-trial', 1],
  ['page_view', '/pricing', 2],
  ['plan_select', 'pro_monthly', 2],
  ['page_view', '/blog/cookieless', 0],
  ['trial_start', 'pro_monthly', 3],
  ['cta_click', '#start-trial', 1],
  ['page_view', '/blog/ga4-vs', 0],
  ['page_view', '/pricing', 2],
  ['trial_start', 'team_annual', 3],
];

const STEPS = [
  { label: 'Read blog post', count: '5,388', width: '100%', delay: '0.55s' },
  { label: 'Click CTA', count: '3,341', width: '62%', delay: '0.69s' },
  { label: 'View pricing', count: '2,586', width: '48%', delay: '0.83s' },
  { label: 'Start trial', count: '1,940', width: '36%', delay: '0.97s' },
];

const MAX_ROWS = 9;

type Row = { id: number; time: string; name: string; arg: string };

function clock() {
  const d = new Date(Date.now() - Math.random() * 400);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Events feeding a funnel: the raw primitive on the left, what you learn from
 * it on the right. Each arriving event lights the step it belongs to, so the
 * relationship is shown rather than asserted.
 */
export function Events({ live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Row[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const counter = useRef(0);

  useEffect(() => {
    if (!live || reduce) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const tick = () => {
      if (cancelled) return;
      const n = counter.current++;
      const [name, arg, step] = EVENTS[n % EVENTS.length];
      setRows((prev) => [{ id: n, time: clock(), name, arg }, ...prev].slice(0, MAX_ROWS));
      setLit(step);
      timers.push(setTimeout(() => setLit((cur) => (cur === step ? null : cur)), 900));
      timers.push(setTimeout(tick, 1100 + Math.random() * 900));
    };
    tick();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [live, reduce]);

  return (
    <div className='ev'>
      <div className='ev__p' style={vars({ '--d': '.05s' })}>
        <div className='ev__hd'>
          <i />
          <b>Events</b>
          <span>live</span>
        </div>
        <div className='ev__log'>
          {rows.map((row, i) => (
            <div key={row.id} className={cn('ev__row', i === 0 && 'new')}>
              <s>{row.time}</s>
              <b>{row.name}</b>
              <em>{row.arg}</em>
            </div>
          ))}
        </div>
      </div>
      <div className='ev__p' style={vars({ '--d': '.24s' })}>
        <div className='ev__hd'>
          <b>Trial signup funnel</b>
          <span>30 days</span>
        </div>
        {STEPS.map((step, i) => (
          <div key={step.label} className={cn('ev__s', lit === i && 'lit')}>
            <div className='ev__t'>
              <s>{i + 1}</s>
              <b>{step.label}</b>
              <em>{step.count}</em>
            </div>
            <div className='ev__bar'>
              <span style={vars({ '--d': step.delay }, { width: step.width })} />
            </div>
          </div>
        ))}
        <div className='ev__ft'>
          <b>Conversion</b>
          <em>36.0%</em>
          <span>AI assistants · 2.4× site average</span>
        </div>
      </div>
    </div>
  );
}
