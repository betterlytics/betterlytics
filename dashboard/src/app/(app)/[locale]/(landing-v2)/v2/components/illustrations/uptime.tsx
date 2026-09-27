'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RollingDigits } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/rollingDigits';
import { useReducedMotion } from '@/app/(app)/[locale]/(landing-v2)/v2/hooks/useReducedMotion';
import { vars } from '@/app/(app)/[locale]/(landing-v2)/v2/lib/cssVars';
import type { IllustrationProps } from './types';

/* Illustration copy is mock product UI, kept literal on purpose. */

/** `uptime` is in hundredths of a percent, so each failed check can take one off exactly. */
const MONITORS = [
  { name: 'Marketing site', host: 'example.com', ms: '96 ms', uptime: 9997 },
  { name: 'API', host: 'api.example.com', ms: '142 ms', uptime: 9998 },
  { name: 'Checkout', host: 'checkout.example.com', ms: '208 ms', uptime: 9995 },
  { name: 'Docs', host: 'docs.example.com', ms: '88 ms', uptime: 10000 },
];
const DOCS = 3;

/** Checks each strip shows. The track holds one more, off to the left, for the slide. */
const CELLS = 30;
const BEAT_MS = 1500;
const FIRST_BEAT_MS = 700;

/*
 * One loop of the story, counted in checks. The SSL notice for Docs comes in
 * first. Then a monitor fails, and the down alert goes out on the third
 * failed check in a row (the product's default threshold). The recovery
 * notice follows the first check that passes. The stack holds for a while,
 * clears, and the loop starts again with the next monitor in OUTAGES, so no
 * strip ever carries two outages at once.
 */
const LOOP = 16;
const SSL_AT = 1;
const FAIL_FROM = 2;
const DOWN_AT = FAIL_FROM + 2;
const UP_AT = 7;
const CLEAR_AT = 14;
const OUTAGES = [2, 1, 0];
/** The frame shown under reduced motion: the down alert in front of the SSL notice. */
const POSTER = DOWN_AT + 1;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const outageAt = (t: number) => OUTAGES[mod(Math.floor(t / LOOP), OUTAGES.length)];
const fails = (row: number, t: number) => {
  const m = mod(t, LOOP);
  return outageAt(t) === row && m >= FAIL_FROM && m < UP_AT;
};

/**
 * Uptime as the strip shows it: one hundredth of a percent off for each failed
 * check still in view. It drops as a red bar comes in on the right and climbs
 * back as that bar slides out on the left, so the number reads the bars.
 */
function uptimeAt(row: number, t: number) {
  let failed = 0;
  for (let k = t - CELLS + 1; k <= t; k++) if (fails(row, k)) failed++;
  return MONITORS[row].uptime - failed;
}
const formatUptime = (value: number) => (value === 10000 ? '100%' : `${(value / 100).toFixed(2)}%`);

type NoticeKind = 'ssl' | 'down' | 'up';
const NOTICES: { kind: NoticeKind; at: number }[] = [
  { kind: 'ssl', at: SSL_AT },
  { kind: 'down', at: DOWN_AT },
  { kind: 'up', at: UP_AT },
];

/** Notices in the stack at once; a third pushes the oldest out. */
const MAX_SHOWN = 2;

/** Where a notice sits at check `t`: not yet sent, in the stack (0 is the front), or cleared. */
function placeNotice(at: number, t: number) {
  const m = mod(t, LOOP);
  const depth = NOTICES.filter((n) => n.at > at && n.at <= Math.min(m, CLEAR_AT)).length;
  if (m >= CLEAR_AT || depth >= MAX_SHOWN) return { state: 'gone', depth };
  if (m < at) return { state: 'pending', depth: 0 };
  return { state: 'on', depth };
}

/** Counts checks while `run` holds; the first comes quickly so the story starts as the card settles. */
function useChecks(run: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!run) return;
    let id: ReturnType<typeof setTimeout>;
    const beat = (ms: number) => {
      id = setTimeout(() => {
        setT((n) => n + 1);
        beat(BEAT_MS);
      }, ms);
    };
    beat(FIRST_BEAT_MS);
    return () => clearTimeout(id);
  }, [run]);
  return t;
}

/**
 * The latest checks, newest on the right. Cells are keyed by check number and
 * the track is one cell wider than the strip, so each check shifts the cells
 * one step left in the DOM while the track slides back from where it was.
 * Alternating the animation name restarts the slide on every check.
 */
function Strip({ row, t, ticked, delay }: { row: number; t: number; ticked: boolean; delay: string }) {
  const first = t - CELLS;
  return (
    <span className='mo__s' style={vars({ '--d': delay, '--n': CELLS })}>
      <span className='mo__tr' style={ticked ? { animationName: t % 2 ? 'lp2-mo-tick-a' : 'lp2-mo-tick-b' } : undefined}>
        {Array.from({ length: CELLS + 1 }, (_, i) => (
          <i key={first + i} className={cn(fails(row, first + i) && 'dn')} style={vars({ '--i': i })} />
        ))}
      </span>
    </span>
  );
}

const ICONS: Record<NoticeKind, ReactNode> = {
  ssl: (
    <svg viewBox='0 0 20 20' fill='none' aria-hidden>
      <path
        d='M10 2.6 4.3 4.9v4.4c0 3.5 2.4 6.5 5.7 7.9 3.3-1.4 5.7-4.4 5.7-7.9V4.9L10 2.6Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path d='M10 6.9v3.4' stroke='currentColor' strokeWidth='1.6' strokeLinecap='round' />
      <circle cx='10' cy='12.9' r='0.95' fill='currentColor' />
    </svg>
  ),
  down: (
    <svg viewBox='0 0 20 20' fill='none' aria-hidden>
      <path
        d='M10 2.6a5 5 0 0 0-5 5v3L3.6 13h12.8L15 10.6v-3a5 5 0 0 0-5-5Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinejoin='round'
      />
      <path d='M8 15.4a2 2 0 0 0 4 0' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    </svg>
  ),
  up: (
    <svg viewBox='0 0 20 20' fill='none' aria-hidden>
      <path d='m5.5 10.4 3 3 6-6.6' stroke='currentColor' strokeWidth='1.7' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  ),
};

const CHANNELS = [
  { name: 'Slack', src: '/images/integrations/slack.svg' },
  { name: 'Discord', src: '/images/integrations/discord.svg' },
];

function Notice({ kind, t }: { kind: NoticeKind; t: number }) {
  const at = NOTICES.find((n) => n.kind === kind)!.at;
  const { state, depth } = placeNotice(at, t);
  const m = MONITORS[outageAt(t)];
  const copy = {
    ssl: ['Docs certificate expires soon', `${MONITORS[DOCS].host} · SSL valid for 9 more days`],
    down: [`${m.name} is down`, `${m.host} is not responding`],
    up: [`${m.name} is back up`, 'Down for 2m 30s · incident resolved'],
  }[kind];
  return (
    <div
      className={cn('mo__al', `mo__al--${kind}`, state, depth > 0 && 'back')}
      style={vars({ '--depth': depth })}
      aria-hidden={state !== 'on' || depth > 0}
    >
      <span className='mo__ic'>{ICONS[kind]}</span>
      <span className='mo__tx'>
        <b>{copy[0]}</b>
        <span>{copy[1]}</span>
      </span>
      <time>now</time>
      <span className='mo__to'>
        Sent to
        {CHANNELS.map((c, i) => (
          <u key={c.name} style={vars({ '--i': i })}>
            <Image src={c.src} alt={c.name} width={12} height={12} />
          </u>
        ))}
        <u style={vars({ '--i': CHANNELS.length })}>
          <svg viewBox='0 0 16 16' fill='none' aria-label='Email'>
            <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.3' />
            <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.3' strokeLinejoin='round' />
          </svg>
        </u>
      </span>
    </div>
  );
}

/**
 * A monitors list with an outage playing through it and the notices it sends
 * stacking up over the panel's corner, newest in front. All the strips move
 * on one beat while the card is live.
 */
export function Uptime({ live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const played = useChecks(live && !reduce);
  const t = reduce ? POSTER : played;
  const ticked = !reduce && played > 0;
  const anyDown = MONITORS.some((_, row) => fails(row, t));

  return (
    <div className='mo'>
      <div className='mo__p'>
        {/* all being well needs no words; only an outage adds to the count */}
        <div className='mo__hd'>
          <b>Monitors</b>
          <em>
            4 monitors
            {anyDown && <span> · 1 down</span>}
          </em>
        </div>
        {MONITORS.map((mon, row) => {
          const down = fails(row, t);
          const uptime = uptimeAt(row, t);
          return (
            <div key={mon.name} className={cn('mo__row', down && 'dn')}>
              <i className='mo__dot' />
              <span className='mo__nm'>
                <b>
                  {mon.name}
                  {row === DOCS && (
                    <s>
                      <svg viewBox='0 0 16 16' aria-hidden>
                        <path d='M8 1.6 3 3.5v3.7c0 3 2.1 5.6 5 6.9 2.9-1.3 5-3.9 5-6.9V3.5L8 1.6Z' fill='currentColor' />
                      </svg>
                      SSL 9 days
                    </s>
                  )}
                </b>
                <span>{mon.host}</span>
              </span>
              <span className={cn('mo__ms', down && 'dn')}>{down ? 'timeout' : mon.ms}</span>
              <Strip row={row} t={t} ticked={ticked} delay={`${0.1 + row * 0.06}s`} />
              <em>
                <RollingDigits value={formatUptime(uptime)} direction={uptime < uptimeAt(row, t - 1) ? -1 : 1} />
              </em>
            </div>
          );
        })}
      </div>

      <div className='mo__st'>
        {NOTICES.map((n) => (
          <Notice key={n.kind} kind={n.kind} t={t} />
        ))}
      </div>
    </div>
  );
}
