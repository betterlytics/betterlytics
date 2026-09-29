'use client';

import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { BR, CA, DE, DK, FR, GB, IN, JP, NL, SE, US } from 'country-flag-icons/react/3x2';
import {
  Clock,
  CreditCard,
  Download,
  FileText,
  Mail,
  Monitor,
  MousePointerClick,
  Play,
  Search,
  Send,
  Smartphone,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { useReducedMotion } from '@/landing/hooks/useReducedMotion';
import type { IllustrationProps } from './types';

/* Illustration copy is mock product UI, kept literal on purpose. */

/** An event, the icon it's listed with, and the one property it's sent with, whose value varies between visitors. */
type Kind = { name: string; icon: LucideIcon; key: string; values: readonly string[] };

/**
 * Events anyone can read at a glance, each with the one property that makes
 * it worth segmenting. The log cycles through each property's values, so the
 * same event arriving twice still reads as two visitors.
 */
const KINDS: readonly Kind[] = [
  { name: 'signup', icon: UserPlus, key: 'plan', values: ['free', 'pro', 'team'] },
  { name: 'purchase', icon: CreditCard, key: 'amount', values: ['$49', '$19', '$99'] },
  { name: 'button_click', icon: MousePointerClick, key: 'label', values: ['Start trial', 'Book a demo', 'Get started'] },
  { name: 'newsletter_signup', icon: Mail, key: 'source', values: ['footer', 'blog', 'popup'] },
  { name: 'file_download', icon: Download, key: 'file', values: ['pricing.pdf', 'report.csv', 'guide.pdf'] },
  { name: 'video_play', icon: Play, key: 'video', values: ['onboarding', 'product tour'] },
  { name: 'search', icon: Search, key: 'query', values: ['webhooks', 'pricing', 'export'] },
  { name: 'invite_sent', icon: Send, key: 'role', values: ['editor', 'admin', 'viewer'] },
  { name: 'trial_started', icon: Clock, key: 'source', values: ['chatgpt', 'google', 'direct'] },
  { name: 'form_submit', icon: FileText, key: 'form', values: ['contact', 'feedback', 'waitlist'] },
];

/** Kinds already this near the top are skipped when picking the next arrival, so the log never stutters. */
const FRESH_ROWS = 5;

/** The history the log opens on: which kind, how many seconds ago. */
const SEED: ReadonlyArray<readonly [kind: number, agoS: number]> = [
  [2, 4],
  [4, 11],
  [1, 17],
  [8, 26],
  [3, 34],
  [0, 43],
  [6, 55],
  [5, 68],
];

const MAX_ROWS = 10;
/** Arrivals kept back while the log is paused; they slide in together on release. */
const HELD_MAX = 3;
/** Gaps between arrivals: slow enough that each insert gets a moment, with the odd pair landing close together. */
const GAP_MS = [3500, 6000] as const;
const PAIR_MS = 1100;
const PAIR_ODDS = 0.15;
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

/*
 * The insert: the list opens a gap one row tall, then the row settles into it
 * from slightly above, a touch larger and lighter, with a shadow, like a card
 * being set down.
 */
const GAP_S = 0.45;
const SETTLE_S = 0.7;
const SETTLE_DELAY_S = 0.18;
const LIFTED = {
  opacity: 0,
  y: -8,
  scale: 1.015,
  backgroundColor: 'rgba(40, 38, 37, 1)',
  boxShadow: '0 14px 30px rgba(0, 0, 0, 0.5)',
};
const SETTLED = {
  opacity: 1,
  y: 0,
  scale: 1,
  backgroundColor: 'rgba(40, 38, 37, 0)',
  boxShadow: '0 0px 0px rgba(0, 0, 0, 0)',
};

type Browser = 'chrome' | 'safari' | 'firefox' | 'edge';
type Visitor = { country: keyof typeof FLAGS; browser: Browser; device: 'desktop' | 'mobile' };

const FLAGS = { US, DE, DK, GB, IN, FR, NL, SE, BR, JP, CA };

/** Who fired each event: mostly desktop Chrome and Safari, some mobile, spread across a handful of countries. */
const VISITORS: readonly Visitor[] = [
  { country: 'US', browser: 'chrome', device: 'desktop' },
  { country: 'DE', browser: 'firefox', device: 'desktop' },
  { country: 'DK', browser: 'safari', device: 'mobile' },
  { country: 'GB', browser: 'chrome', device: 'mobile' },
  { country: 'IN', browser: 'chrome', device: 'desktop' },
  { country: 'FR', browser: 'safari', device: 'desktop' },
  { country: 'US', browser: 'safari', device: 'mobile' },
  { country: 'NL', browser: 'edge', device: 'desktop' },
  { country: 'SE', browser: 'chrome', device: 'desktop' },
  { country: 'BR', browser: 'chrome', device: 'mobile' },
  { country: 'JP', browser: 'safari', device: 'desktop' },
  { country: 'CA', browser: 'firefox', device: 'desktop' },
  { country: 'DK', browser: 'chrome', device: 'desktop' },
];

type Row = {
  id: number;
  at: number;
  kind: Kind;
  value: string;
  visitor: Visitor;
};

/** The `n`th sighting of a kind, with its property value and its visitor picked for that sighting. */
function rowOf(kind: Kind, id: number, at: number, n: number): Row {
  return {
    id,
    at,
    kind,
    value: kind.values[n % kind.values.length],
    visitor: VISITORS[(n * 5 + 2) % VISITORS.length],
  };
}

/** The visitor behind a row: country flag, browser, device. Muted at rest; an arrival shows them in colour first. */
function Who({ visitor }: { visitor: Visitor }) {
  const Flag = FLAGS[visitor.country];
  const Device = visitor.device === 'mobile' ? Smartphone : Monitor;
  return (
    <span className='ev__who' aria-hidden>
      <Flag className='ev__flag' />
      <img
        className='ev__browser'
        src={`/browser-icons/${visitor.browser}.svg`}
        alt=''
        width={14}
        height={14}
      />
      <Device className='ev__device' strokeWidth={1.75} />
    </span>
  );
}

function ago(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 2) return 'now';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m`;
}

/**
 * The live event log: custom events arriving with the property they were
 * sent with and the visitor who sent them. Each arrival opens a gap at the
 * top and settles into it; times age in place. The panel runs off the
 * bottom of the card on purpose, a window onto a longer log.
 */
export function Events({ live }: IllustrationProps) {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Row[]>([]);
  const [now, setNow] = useState(0);
  const [total, setTotal] = useState(18_406);
  const serial = useRef(0);
  const seededAt = useRef(0);

  // Hovering the panel pauses the log so a row can be read, as the real log holds new
  // events back while you're scrolled down. Arrivals keep coming and are held until release.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const held = useRef<Row[]>([]);
  const rowsRef = useRef<Row[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const hold = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    pausedRef.current = true;
    setPaused(true);
  };
  const release = () => {
    if (!pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    const waiting = held.current;
    held.current = [];
    if (waiting.length) setRows((prev) => [...waiting, ...prev].slice(0, MAX_ROWS));
  };

  // Seeded on the client, so the relative times are measured from the reader's clock.
  useEffect(() => {
    const t = Date.now();
    seededAt.current = t;
    setNow(t);
    setRows(SEED.map(([kind, agoS], i) => rowOf(KINDS[kind], -1 - i, t - agoS * 1000, i)));
  }, []);

  useEffect(() => {
    if (!live || reduce) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => timers.push(setTimeout(() => !cancelled && fn(), ms));

    // The history was stamped at load, and the clock only runs while the card is live: the
    // first time it goes live, move the history up to now so it reads "4s", not "40s".
    if (seededAt.current) {
      const shift = Date.now() - seededAt.current;
      seededAt.current = 0;
      setRows((prev) => prev.map((row) => ({ ...row, at: row.at + shift })));
      setNow(Date.now());
    }

    const arrive = () => {
      const n = serial.current++;
      const newest = [...held.current, ...rowsRef.current].slice(0, FRESH_ROWS);
      const recent = new Set(newest.map((row) => row.kind.name));
      const fresh = KINDS.filter((kind) => !recent.has(kind.name));
      const row = rowOf(fresh[n % fresh.length], n, Date.now(), n + SEED.length);
      if (pausedRef.current) held.current = [row, ...held.current].slice(0, HELD_MAX);
      else setRows((prev) => [row, ...prev].slice(0, MAX_ROWS));
      setTotal((t) => t + 1);
    };
    const next = () => {
      arrive();
      if (Math.random() < PAIR_ODDS) later(arrive, PAIR_MS);
      later(next, GAP_MS[0] + Math.random() * (GAP_MS[1] - GAP_MS[0]));
    };
    later(next, 1200);

    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      clearInterval(clock);
    };
  }, [live, reduce]);

  return (
    <div className='ev'>
      <div className='ev__p' onPointerEnter={hold} onPointerLeave={release}>
        <div className='ev__hd'>
          <b>Custom events</b>
          <span className={cn('ev__live', paused && 'is-paused')}>
            <i />
            {paused ? 'Paused' : 'Live'}
          </span>
          <span className='ev__total'>
            <RollingDigits value={total.toLocaleString('en-US')} />
            <small>today</small>
          </span>
        </div>
        <ol className='ev__log'>
          {rows.map((row, i) => {
            const arriving = row.id >= 0 && !reduce;
            const Icon = row.kind.icon;
            return (
              <m.li
                key={row.id}
                className='ev__slot'
                initial={arriving ? { height: 0 } : false}
                animate={{ height: 'auto' }}
                transition={{ duration: GAP_S, ease: EASE }}
              >
                <m.div
                  className={cn('ev__row', row.id >= 0 && 'is-new', i === 0 && 'is-top')}
                  initial={arriving ? LIFTED : false}
                  animate={SETTLED}
                  transition={{ duration: SETTLE_S, ease: EASE, delay: SETTLE_DELAY_S }}
                >
                  <Icon className='ev__icon' strokeWidth={1.75} aria-hidden />
                  <b>{row.kind.name}</b>
                  <span className='ev__prop'>
                    <i>{row.kind.key}:</i>
                    {row.value}
                  </span>
                  <Who visitor={row.visitor} />
                  <time>{now ? ago(now - row.at) : ''}</time>
                </m.div>
              </m.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
