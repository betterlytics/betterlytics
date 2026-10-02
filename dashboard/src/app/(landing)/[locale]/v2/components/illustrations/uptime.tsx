'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { COPY } from '@/landing/content/copy';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import type { IllustrationProps } from './types';
import styles from './uptime.module.css';

/* Mock product copy, kept literal on purpose. */

/** `uptime` is in hundredths of a percent, so each failed check takes off exactly one. */
const MONITORS = [
  { name: 'Marketing site', host: 'acme.com', ms: '96 ms', uptime: 9997 },
  { name: 'API', host: 'api.acme.com', ms: '142 ms', uptime: 9998 },
  { name: 'Checkout', host: 'checkout.acme.com', ms: '208 ms', uptime: 9995 },
  { name: 'Docs', host: 'docs.acme.com', ms: '88 ms', uptime: 10000 },
];
const DOCS = 3;

const CELLS = 30;
const BEAT_MS = 1500;
const FIRST_BEAT_MS = 700;

/* Story loop, in checks. */
const LOOP = 16;
const SSL_AT = 1;
const FAIL_FROM = 2;
const DOWN_AT = FAIL_FROM + 2; // the third failed check in a row, the product's default threshold
const UP_AT = 7;
const CLEAR_AT = 14;
// alternates so no strip shows two outages; must be rows the status page shows above its fade
const OUTAGES = [2, 1];
/** Reduced-motion frame: the down alert over the SSL notice. */
const POSTER = DOWN_AT + 1;

const mod = (n: number, m: number) => ((n % m) + m) % m;
const outageAt = (t: number) => OUTAGES[mod(Math.floor(t / LOOP), OUTAGES.length)];
const fails = (row: number, t: number) => {
  const m = mod(t, LOOP);
  return outageAt(t) === row && m >= FAIL_FROM && m < UP_AT;
};

/** Counts only failed checks still in the strip, so the number tracks the bars. */
function uptimeAt(row: number, t: number) {
  let failed = 0;
  for (let k = t - CELLS + 1; k <= t; k++) if (fails(row, k)) failed++;
  return MONITORS[row].uptime - failed;
}
const formatUptime = (value: number) => (value === 10000 ? '100%' : `${(value / 100).toFixed(2)}%`);

type NoticeKind = 'ssl' | 'down' | 'up';
type NoticeState = 'pending' | 'on' | 'gone';
const NOTICES: { kind: NoticeKind; at: number }[] = [
  { kind: 'ssl', at: SSL_AT },
  { kind: 'down', at: DOWN_AT },
  { kind: 'up', at: UP_AT },
];

const MAX_SHOWN = 2;

/** Depth 0 is the front of the stack. */
function placeNotice(at: number, t: number): { state: NoticeState; depth: number } {
  const m = mod(t, LOOP);
  const depth = NOTICES.filter((n) => n.at > at && n.at <= Math.min(m, CLEAR_AT)).length;
  if (m >= CLEAR_AT || depth >= MAX_SHOWN) return { state: 'gone', depth };
  if (m < at) return { state: 'pending', depth: 0 };
  return { state: 'on', depth };
}

/** Under reduced motion it holds POSTER, set after mount since the server can't know the preference. */
function useChecks(run: boolean) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (reduce) setT(POSTER);
  }, [reduce]);
  useEffect(() => {
    if (!run || reduce) return;
    let id: ReturnType<typeof setTimeout>;
    const beat = (ms: number) => {
      id = setTimeout(() => {
        setT((n) => n + 1);
        beat(BEAT_MS);
      }, ms);
    };
    beat(FIRST_BEAT_MS);
    return () => clearTimeout(id);
  }, [run, reduce]);
  const ticked = !reduce && t > 0;
  return { t, ticked };
}

/** Cells are keyed by check number; alternating `data-tick` restarts the CSS slide on every check. */
function Strip({ row, t, ticked }: { row: number; t: number; ticked: boolean }) {
  const first = t - CELLS;
  return (
    <span className={styles.strip} style={vars({ '--n': CELLS })}>
      <span className={styles.track} data-tick={ticked ? (t % 2 ? 'a' : 'b') : undefined}>
        {Array.from({ length: CELLS + 1 }, (_, i) => (
          <i key={first + i} data-down={fails(row, first + i) || undefined} style={vars({ '--i': i })} />
        ))}
      </span>
    </span>
  );
}

function Monitor({ row, t, ticked }: { row: number; t: number; ticked: boolean }) {
  const { name, host, ms } = MONITORS[row];
  const down = fails(row, t);
  const uptime = uptimeAt(row, t);
  return (
    <div className={styles.monitor} data-down={down || undefined} style={vars({ '--d': `${0.06 + row * 0.08}s` })}>
      <i className={styles.dot} />
      <span className={styles.name}>
        <b>
          {name}
          {row === DOCS && (
            <span className={styles.flag}>
              <svg viewBox='0 0 16 16'>
                <path d='M8 1.6 3 3.5v3.7c0 3 2.1 5.6 5 6.9 2.9-1.3 5-3.9 5-6.9V3.5L8 1.6Z' fill='currentColor' />
              </svg>
              SSL 9 days
            </span>
          )}
        </b>
        <span className={styles.host}>{host}</span>
      </span>
      <span className={styles.latency}>{down ? 'timeout' : ms}</span>
      <Strip row={row} t={t} ticked={ticked} />
      <span className={styles.percent}>
        <RollingDigits value={formatUptime(uptime)} direction={uptime < uptimeAt(row, t - 1) ? -1 : 1} />
      </span>
    </div>
  );
}

const ICONS: Record<NoticeKind, ReactNode> = {
  ssl: (
    <svg viewBox='0 0 20 20' fill='none'>
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
    <svg viewBox='0 0 20 20' fill='none'>
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
    <svg viewBox='0 0 20 20' fill='none'>
      <path
        d='m5.5 10.4 3 3 6-6.6'
        pathLength={1}
        stroke='currentColor'
        strokeWidth='1.7'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  ),
};

const CHANNELS = [
  { name: 'Slack', src: '/images/integrations/slack.svg' },
  { name: 'Discord', src: '/images/integrations/discord.svg' },
];

function Notice({ kind, at, t }: { kind: NoticeKind; at: number; t: number }) {
  const { state, depth } = placeNotice(at, t);
  const monitor = MONITORS[outageAt(t)];
  const [title, detail] = {
    ssl: ['Docs certificate expires soon', `${MONITORS[DOCS].host} · SSL valid for 9 more days`],
    down: [`${monitor.name} is down`, `${monitor.host} is not responding`],
    up: [`${monitor.name} is back up`, 'Down for 2m 30s · incident resolved'],
  }[kind];
  return (
    <div
      className={styles.notice}
      data-kind={kind}
      data-state={state}
      data-back={depth > 0 || undefined}
      style={vars({ '--depth': depth })}
    >
      <span className={styles.noticeIcon}>{ICONS[kind]}</span>
      <span className={styles.noticeText}>
        <b>{title}</b>
        <span>{detail}</span>
      </span>
      <time>now</time>
      <span className={styles.channels}>
        Sent to
        {CHANNELS.map((channel, i) => (
          <span key={channel.name} className={styles.channel} style={vars({ '--i': i })}>
            <Image src={channel.src} alt='' width={12} height={12} />
          </span>
        ))}
        <span className={styles.channel} style={vars({ '--i': CHANNELS.length })}>
          <svg viewBox='0 0 16 16' fill='none'>
            <rect x='2' y='3.5' width='12' height='9' rx='1.6' stroke='currentColor' strokeWidth='1.3' />
            <path d='m2.6 4.4 5.4 4.1 5.4-4.1' stroke='currentColor' strokeWidth='1.3' strokeLinejoin='round' />
          </svg>
        </span>
      </span>
    </div>
  );
}

/** `row` indexes MONITORS; `name` is the public one. */
const PUBLIC = [
  { row: 1, name: 'API' },
  { row: 2, name: 'Checkout' },
  { row: 0, name: 'Website' },
];
const DAYS = 36;

function StatusPage({ t }: { t: number }) {
  const out = PUBLIC.find((p) => fails(p.row, t));
  return (
    <div className={styles.status} data-down={out ? true : undefined} aria-hidden>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span>status.acme.com</span>
      </div>
      {/* mirrors the real status page (app/status/[slug]) */}
      <div className={styles.viewport}>
        <b className={styles.brand}>
          <i />
          Acme
        </b>
        <div className={styles.statusCard}>
          <div className={styles.hero}>
            <span className={styles.heroIcon}>
              {out ? (
                <svg viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M10.3 3.9 2.4 17.6A2 2 0 0 0 4.1 20.6h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z'
                    stroke='currentColor'
                    strokeWidth='3'
                    strokeLinejoin='round'
                  />
                  <path d='M12 9.5v4M12 16.8h.01' stroke='currentColor' strokeWidth='3' strokeLinecap='round' />
                </svg>
              ) : (
                <svg viewBox='0 0 24 24' fill='none'>
                  <path
                    d='m5 12.5 4.5 4.5L19 7.5'
                    stroke='currentColor'
                    strokeWidth='3.4'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              )}
            </span>
            <strong>{out ? 'Some systems are down' : 'All systems operational'}</strong>
          </div>
          {PUBLIC.map((p) => (
            <div key={p.name} className={styles.statusRow} data-down={p === out || undefined}>
              <i />
              <b>{p.name}</b>
              <span className={styles.badge}>{p === out ? 'Down' : 'Operational'}</span>
              <span className={styles.history}>
                {Array.from({ length: DAYS }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Uptime({ entered, live }: IllustrationProps) {
  // held while a mouse is on the notices, so the spread stack can't change under the pointer
  const [held, setHeld] = useState(false);
  const { t, ticked } = useChecks(live && !held);

  return (
    <div
      role='img'
      aria-label={COPY.illustrations.uptime}
      className={cn(styles.uptime, 'absolute inset-0')}
      data-in={entered || undefined}
      data-live={live || undefined}
    >
      <StatusPage t={t} />
      <div className={styles.stage}>
        <div className='relative row-start-2 ml-[11%] w-[54%] max-md:mx-auto max-md:w-[94%]' aria-hidden>
          <div className='grid gap-2'>
            {MONITORS.map((monitor, row) => (
              <Monitor key={monitor.name} row={row} t={t} ticked={ticked} />
            ))}
          </div>
          <div
            className={styles.notices}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setHeld(true)}
            onPointerLeave={() => setHeld(false)}
          >
            {NOTICES.map(({ kind, at }) => (
              <Notice key={kind} kind={kind} at={at} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
