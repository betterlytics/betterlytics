'use client';

import { AtSign, Link2, MessagesSquare, Search, Sparkles, type LucideIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { RollingDigits } from '@/landing/components/ui/rollingDigits';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { along, fitCanvas, track, type Point, type Track } from './flow';
import styles from './sourceRoutes.module.css';

type Channel = 'search' | 'ai' | 'social' | 'email' | 'direct';

/** `wide` sources only fit beside the channels from the sm breakpoint up. */
type Source = { label?: string; wide?: boolean };

const GROUPS: { channel: Channel; icon: LucideIcon; visitors: number; sources: Source[] }[] = [
  {
    channel: 'search',
    icon: Search,
    visitors: 21060,
    sources: [{ label: 'google.com' }, { label: 'duckduckgo.com', wide: true }, { label: 'bing.com' }],
  },
  {
    channel: 'ai',
    icon: Sparkles,
    visitors: 3310,
    sources: [{ label: 'chatgpt.com' }, { label: 'perplexity.ai' }, { label: 'claude.ai' }],
  },
  {
    channel: 'social',
    icon: MessagesSquare,
    visitors: 3540,
    sources: [{ label: 'reddit.com' }, { label: 'news.ycombinator.com', wide: true }, { label: 'x.com' }],
  },
  {
    channel: 'email',
    icon: AtSign,
    visitors: 1270,
    sources: [{ label: 'mail.google.com' }, { label: 'outlook.live.com', wide: true }],
  },
  { channel: 'direct', icon: Link2, visitors: 11480, sources: [{}] },
];

const LIT: Channel = 'ai';

/** How often each channel sends a visit, relative to the others; AI is weighted up so the lit wires stay busy. */
const WEIGHT: Record<Channel, number> = { search: 4, ai: 3.2, social: 2, direct: 2.4, email: 1 };

const INK = '#ebe8e6';
const ON_VOLT = '#f2f5ff';
const VOLT_SOFT = '#8b97ff';
const TAIL = 64;
const SPEED = 280;

type Route = { d: string; channel: Channel; points: Point[] };
type Geometry = { width: number; height: number; routes: Route[]; ends: Point[] };

function useRoutes() {
  const stage = useRef<HTMLDivElement>(null);
  const chips = useRef<(HTMLSpanElement | null)[]>([]);
  const nodes = useRef<Partial<Record<Channel, HTMLDivElement | null>>>({});
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    if (!box) return;
    const at = (x: number, y: number): Point => [Math.round(x - box.left) + 0.5, Math.round(y - box.top) + 0.5];
    const routes: Route[] = [];
    const ends: Point[] = [];
    chips.current.forEach((chip) => {
      const channel = chip?.dataset.channel as Channel | undefined;
      const node = channel && nodes.current[channel];
      if (!chip || !channel || !node || chip.offsetParent === null) return;
      const c = chip.getBoundingClientRect();
      const n = node.getBoundingClientRect();
      const from = at(c.right, c.top + c.height / 2);
      const to = at(n.left, n.top + n.height / 2);
      const dx = (to[0] - from[0]) * 0.55;
      const points: Point[] = [from, [from[0] + dx, from[1]], [to[0] - dx, to[1]], to];
      routes.push({
        d: `M${from[0]},${from[1]} C${points[1][0]},${points[1][1]} ${points[2][0]},${points[2][1]} ${to[0]},${to[1]}`,
        channel,
        points,
      });
      ends.push(from);
      if (!ends.some((end) => end[0] === to[0] && end[1] === to[1])) ends.push(to);
    });
    setGeometry({ width: box.width, height: box.height, routes, ends });
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [measure]);

  return { stage, chips, nodes, geometry };
}

type Pulse = { route: number; start: number; dur: number; landed: boolean };
type Ring = { at: Point; start: number; lit: boolean };
type Pulses = { ctx: CanvasRenderingContext2D; tracks: Track[]; pulses: Pulse[]; rings: Ring[]; next: number };

const easeInOut = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/** A short streak that tapers from a bright head to nothing; past the end of the wire it drains into the node. */
function drawPulse(ctx: CanvasRenderingContext2D, path: Track, travelled: number, lit: boolean) {
  const head = Math.min(travelled, path.length);
  const tail = Math.max(travelled - TAIL, 0);
  if (head <= tail) return;
  ctx.strokeStyle = lit ? ON_VOLT : INK;
  let prev = along(path, tail);
  for (let j = 1; j <= 12; j++) {
    const s = tail + ((head - tail) * j) / 12;
    const next = along(path, s);
    const f = (s - (travelled - TAIL)) / TAIL;
    ctx.globalAlpha = (lit ? 1 : 0.62) * f ** 1.6;
    ctx.lineWidth = 0.5 + 1.4 * f;
    ctx.beginPath();
    ctx.moveTo(prev[0], prev[1]);
    ctx.lineTo(next[0], next[1]);
    ctx.stroke();
    prev = next;
  }
}

function pick(hot: Channel | null) {
  if (hot) return hot;
  const channels = Object.keys(WEIGHT) as Channel[];
  let r = Math.random() * channels.reduce((sum, channel) => sum + WEIGHT[channel], 0);
  return channels.find((channel) => (r -= WEIGHT[channel]) < 0) ?? 'search';
}

/** Each node subscribes to its own count, so a landing re-renders one number instead of the diagram. */
class Counts {
  private values: Record<Channel, number>;
  private listeners = new Set<() => void>();

  constructor(values: Record<Channel, number>) {
    this.values = values;
  }

  get(channel: Channel) {
    return this.values[channel];
  }

  bump(channel: Channel) {
    this.values = { ...this.values, [channel]: this.values[channel] + 1 };
    this.listeners.forEach((listener) => listener());
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
}

function ChannelCount({
  channel,
  counts,
  format,
}: {
  channel: Channel;
  counts: Counts;
  format: Intl.NumberFormat;
}) {
  const value = useSyncExternalStore(
    counts.subscribe,
    () => counts.get(channel),
    () => counts.get(channel),
  );
  return <RollingDigits className={styles.count} value={format.format(value)} />;
}

function usePulses(
  canvas: RefObject<HTMLCanvasElement | null>,
  geometry: Geometry | null,
  running: boolean,
  hot: RefObject<Channel | null>,
  counts: Counts,
) {
  const state = useRef<Pulses | null>(null);

  useEffect(() => {
    if (!canvas.current || !geometry) return;
    const ctx = fitCanvas(canvas.current, geometry.width, geometry.height);
    state.current = ctx
      ? { ctx, tracks: geometry.routes.map((route) => track(route.points)), pulses: [], rings: [], next: 0 }
      : null;
  }, [canvas, geometry]);

  useEffect(() => {
    if (!running || !geometry) return;
    let raf = 0;
    const frame = (ts: number) => {
      const s = state.current;
      if (s) {
        if (!s.next) s.next = ts + 900;
        if (ts >= s.next) {
          const channel = pick(hot.current);
          const routes = geometry.routes.flatMap((route, i) => (route.channel === channel ? [i] : []));
          if (routes.length) {
            const route = routes[Math.floor(Math.random() * routes.length)];
            const length = s.tracks[route].length + TAIL;
            s.pulses.push({
              route,
              start: ts,
              dur: (length / SPEED) * (900 + Math.random() * 300),
              landed: false,
            });
          }
          s.next = ts + 240 + Math.random() * 420;
        }
        s.ctx.clearRect(0, 0, geometry.width, geometry.height);
        s.ctx.lineCap = 'round';
        s.pulses = s.pulses.filter((pulse) => {
          const route = geometry.routes[pulse.route];
          const path = s.tracks[pulse.route];
          const t = Math.min((ts - pulse.start) / pulse.dur, 1);
          const travelled = easeInOut(t) * (path.length + TAIL);
          if (!pulse.landed && travelled >= path.length) {
            pulse.landed = true;
            s.rings.push({ at: route.points[3], start: ts, lit: route.channel === LIT });
            counts.bump(route.channel);
          }
          drawPulse(s.ctx, path, travelled, route.channel === LIT);
          return t < 1;
        });
        s.ctx.lineWidth = 1;
        s.rings = s.rings.filter((ring) => {
          const age = (ts - ring.start) / 650;
          if (age >= 1) return false;
          s.ctx.globalAlpha = 0.5 * (1 - age);
          s.ctx.strokeStyle = ring.lit ? VOLT_SOFT : INK;
          s.ctx.beginPath();
          s.ctx.arc(ring.at[0], ring.at[1], 2.75 + 8 * (1 - (1 - age) ** 3), 0, Math.PI * 2);
          s.ctx.stroke();
          return true;
        });
        s.ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, geometry, hot, counts]);
}

/** Referrers fan into their channels; each visit runs its wire as a pulse and ticks the channel's count when it lands. */
export function SourceRoutes() {
  const t = useTranslations('landing.analytics.sources');
  const locale = useLocale();
  const { stage, chips, nodes, geometry } = useRoutes();
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawn = useInView(stage, 'draw');
  const live = useInView(stage, 'onScreen');
  const reduce = useReducedMotion();
  const [hot, setHot] = useState<Channel | null>(null);
  const hotRef = useRef<Channel | null>(null);
  useEffect(() => {
    hotRef.current = hot;
  }, [hot]);

  const format = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const [counts] = useState(
    () => new Counts(Object.fromEntries(GROUPS.map((g) => [g.channel, g.visitors])) as Record<Channel, number>),
  );

  usePulses(canvas, geometry, drawn && live && !reduce, hotRef, counts);
  let index = 0;

  return (
    <div ref={stage} className={styles.stage} data-drawn={drawn || undefined} data-hot={hot ?? undefined}>
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      {geometry && (
        <svg
          className={styles.wires}
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden
        >
          {geometry.routes.map((route, i) => (
            <path
              key={i}
              className={styles.wire}
              d={route.d}
              pathLength={1}
              data-channel={route.channel}
              data-lit={route.channel === LIT || undefined}
              data-hot={route.channel === hot || undefined}
            />
          ))}
          {geometry.ends.map(([x, y], i) => (
            <circle key={i} className={styles.plug} cx={x} cy={y} r={2.75} />
          ))}
        </svg>
      )}
      <canvas ref={canvas} className={styles.pulses} aria-hidden />
      <div className={styles.grid} aria-hidden data-nosnippet>
        {GROUPS.map(({ channel, icon: Icon, sources }) => (
          <div
            key={channel}
            className={styles.group}
            data-lit={channel === LIT || undefined}
            data-hot={channel === hot || undefined}
            onMouseEnter={() => setHot(channel)}
            onMouseLeave={() => setHot(null)}
          >
            <div className={styles.sources}>
              {sources.map((source) => {
                const i = index++;
                return (
                  <span
                    key={source.label ?? 'none'}
                    ref={(el) => {
                      chips.current[i] = el;
                    }}
                    className={styles.chip}
                    data-channel={channel}
                    data-wide={source.wide || undefined}
                    data-none={!source.label || undefined}
                    style={vars({ '--i': i })}
                  >
                    {source.label ?? t('noReferrer')}
                  </span>
                );
              })}
            </div>
            <div
              ref={(el) => {
                nodes.current[channel] = el;
              }}
              className={styles.node}
            >
              <Icon className={styles.icon} strokeWidth={1.75} />
              <span className={styles.name}>{t(`channels.${channel}`)}</span>
              <ChannelCount channel={channel} counts={counts} format={format} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
