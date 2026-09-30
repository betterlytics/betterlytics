'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import type { IllustrationProps } from './types';
import styles from './uptime.module.css';

/* Illustration copy is mock product UI, kept literal on purpose. */

/** What the art shows, for readers who can't see it. */
const DESCRIPTION =
  'Four uptime monitors with their recent checks. When one stops responding, the alert goes out to Slack, Discord and email, and the public status page reports the outage.';

/** `uptime` is in hundredths of a percent, so each failed check can take one off exactly. */
const MONITORS = [
  { name: 'Marketing site', host: 'acme.com', ms: '96 ms', uptime: 9997 },
  { name: 'API', host: 'api.acme.com', ms: '142 ms', uptime: 9998 },
  { name: 'Checkout', host: 'checkout.acme.com', ms: '208 ms', uptime: 9995 },
  { name: 'Docs', host: 'docs.acme.com', ms: '88 ms', uptime: 10000 },
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
 * clears, and the loop starts again with the other monitor in OUTAGES, so no
 * strip ever carries two outages at once. Only the two monitors the public
 * status page shows above its fade take turns, so its rows always agree with
 * its hero.
 */
const LOOP = 16;
const SSL_AT = 1;
const FAIL_FROM = 2;
const DOWN_AT = FAIL_FROM + 2;
const UP_AT = 7;
const CLEAR_AT = 14;
const OUTAGES = [2, 1];
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
type NoticeState = 'pending' | 'on' | 'gone';
const NOTICES: { kind: NoticeKind; at: number }[] = [
  { kind: 'ssl', at: SSL_AT },
  { kind: 'down', at: DOWN_AT },
  { kind: 'up', at: UP_AT },
];

/** Notices in the stack at once; a third pushes the oldest out. */
const MAX_SHOWN = 2;

/** Where a notice sits at check `t`: not yet sent, in the stack (0 is the front), or cleared. */
function placeNotice(at: number, t: number): { state: NoticeState; depth: number } {
  const m = mod(t, LOOP);
  const depth = NOTICES.filter((n) => n.at > at && n.at <= Math.min(m, CLEAR_AT)).length;
  if (m >= CLEAR_AT || depth >= MAX_SHOWN) return { state: 'gone', depth };
  if (m < at) return { state: 'pending', depth: 0 };
  return { state: 'on', depth };
}

/**
 * The story's clock, counted in checks. It ticks while `run` holds, the first
 * check coming quickly so the story starts as the card settles. Under reduced
 * motion it stands on the poster frame instead, set once mounted since the
 * server can't know the reader's preference.
 */
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
  /* whether a check has landed yet, which is what slides the strips */
  const ticked = !reduce && t > 0;
  return { t, ticked };
}

/**
 * The latest checks, newest on the right. Cells are keyed by check number and
 * the track is one cell wider than the strip, so each check shifts the cells
 * one step left in the DOM while the track slides back from where it was.
 * Alternating between two identical slides restarts it on every check.
 */
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

/** One monitor's card: its state, the latest response time, the strip of checks and the uptime they add up to. */
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

/** The monitors the public page lists, by row, under the names customers see. */
const PUBLIC = [
  { row: 1, name: 'API' },
  { row: 2, name: 'Checkout' },
  { row: 0, name: 'Website' },
];
const DAYS = 36;

/**
 * The public status page, behind the stack: what customers see while the
 * team gets the alert. It sits back while all is well and comes up to full
 * strength with the outage, as its hero and the failing monitor's row switch
 * to an outage in step with the card.
 */
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
      {/* laid out as the real page (app/status/[slug]): a brand band in the default
          accent, and over it one card whose top is the status-coloured hero */}
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

/**
 * Monitors as a stack of cards with an outage playing through them, the
 * failing one coming forward, and the notices it sends stacking up over the
 * bottom corner, newest in front. All the strips move on one beat while the
 * card is live and on screen.
 */
export function Uptime({ entered, live }: IllustrationProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  /* the story holds while a mouse is on the notices, so the stack they spread
     into can't change under the pointer; it picks up again on leaving */
  const [held, setHeld] = useState(false);
  const { t, ticked } = useChecks(live && onScreen && !held);

  return (
    <div
      ref={ref}
      role='img'
      aria-label={DESCRIPTION}
      className={cn(styles.uptime, 'absolute inset-0 grid items-start max-md:justify-items-center max-md:pt-3.5')}
      data-in={entered || undefined}
      data-live={live || undefined}
    >
      {/* the label speaks for the art: role='img' alone doesn't hide the text inside from every screen reader */}
      <StatusPage t={t} />
      {/* the stack sits left and the notices hang off its lower right, so the two read
          as one diagonal; it starts low enough that the status page's hero clears it */}
      <div className='relative mt-[15%] ml-[11%] w-[54%] max-md:mx-auto max-md:mt-0 max-md:w-[94%]' aria-hidden>
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
  );
}
