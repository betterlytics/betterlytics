'use client';

import { Eye, MousePointerClick, type LucideIcon } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { along, clamp01, fitCanvas, track, type Point, type Track } from './flow';
import styles from './funnelRibbon.module.css';

type StepKey = 'pricing' | 'trial' | 'signup' | 'signed';

const STEPS: { key: StepKey; icon: LucideIcon; visitors: number }[] = [
  { key: 'pricing', icon: Eye, visitors: 4820 },
  { key: 'trial', icon: MousePointerClick, visitors: 2140 },
  { key: 'signup', icon: Eye, visitors: 1760 },
  { key: 'signed', icon: MousePointerClick, visitors: 690 },
];

const ENTERED = STEPS[0].visitors;
const DROPS = STEPS.slice(1).map((step, i) => 1 - step.visitors / STEPS[i].visitors);
const WORST = DROPS.indexOf(Math.max(...DROPS));

const INK = '#ebe8e6';
const LOSS = '#f08a98';

const curve = (p: Point[]) => `C${p[1][0]},${p[1][1]} ${p[2][0]},${p[2][1]} ${p[3][0]},${p[3][1]}`;

function layout(width: number) {
  const phone = width < 600;
  const padX = phone ? 16 : 44;
  const labelH = phone ? 66 : 84;
  const maxT = phone ? 104 : 168;
  const y0 = labelH + (phone ? 12 : 18);
  const gap = (width - padX * 2) / 4.05;
  const entry = gap * 0.55;
  const xs = STEPS.map((_, k) => padX + entry + k * gap);
  const thick = STEPS.map((step) => (step.visitors / ENTERED) * maxT);
  const fall = phone ? 84 : 118;
  const bottom = y0 + maxT + fall;
  const height = bottom + (phone ? 34 : 40);
  const end = width - padX;

  const peels = DROPS.map((_, k) => {
    const drop = thick[k] - thick[k + 1];
    const x = xs[k];
    const yc = y0 + thick[k + 1] + drop / 2;
    const reach = gap * 0.6;
    const yEnd = bottom - drop / 2;
    const shape: Point[] = [
      [x, yc],
      [x + reach * 0.5, yc],
      [x + reach * 0.8, yc + (yEnd - yc) * 0.32],
      [x + reach, yEnd],
    ];
    return { x, drop, yc, reach, yEnd, shape, d: `M${x},${yc} ${curve(shape)}` };
  });

  const segments = [
    { x: 0, width: xs[0], height: thick[0] },
    ...xs.slice(0, -1).map((x, k) => ({ x, width: xs[k + 1] - x, height: thick[k + 1] })),
  ];

  return { phone, width, padX, y0, maxT, xs, thick, bottom, height, end, gap, peels, segments };
}

type Layout = ReturnType<typeof layout>;

/** `lane` is the grain's depth in the stream; the deepest lanes are the ones that leave first. */
type Grain = {
  lane: number;
  exit: number;
  s: number;
  speed: number;
  size: number;
  alpha: number;
  sway: number;
  freq: number;
  phase: number;
};

type Stream = { ctx: CanvasRenderingContext2D; grains: Grain[]; tracks: Track[]; cycle: number };

function createStream(canvas: HTMLCanvasElement, g: Layout): Stream | null {
  const ctx = fitCanvas(canvas, g.width, g.height);
  if (!ctx) return null;
  const tracks = g.peels.map((peel) => track(peel.shape));
  /* every grain loops on one shared cycle, so each lane enters at the same rate and the density matches the counts */
  const cycle = Math.max(g.width, ...g.peels.map((peel, k) => peel.x + tracks[k].length));
  const count = Math.round(Math.min(Math.max((cycle * g.maxT) / 170, 240), 1500));
  const speed = g.phone ? 38 : 56;
  const grains = Array.from({ length: count }, (): Grain => {
    const lane = 1 + Math.random() * (g.maxT - 2);
    return {
      lane,
      exit: g.thick.slice(1).findIndex((t) => lane >= t),
      s: Math.random() * cycle,
      speed: speed * (0.75 + Math.random() * 0.5),
      size: 0.8 + Math.random() ** 2 * 1.2,
      alpha: 0.14 + Math.random() ** 1.8 * 0.72,
      sway: Math.random() * 1.2,
      freq: 0.5 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
    };
  });
  return { ctx, grains, tracks, cycle };
}

function paint({ ctx, grains, tracks }: Stream, g: Layout, time: number) {
  ctx.clearRect(0, 0, g.width, g.height);
  let ink = '';
  for (const grain of grains) {
    let x: number;
    let y = g.y0 + grain.lane;
    let alpha = grain.alpha;
    let color = INK;
    const peel = grain.exit === -1 ? null : g.peels[grain.exit];
    if (!peel || grain.s <= peel.x) {
      x = grain.s;
      if (!peel) {
        if (x >= g.xs[3]) continue;
        alpha *= clamp01((g.xs[3] - x) / 30);
      }
    } else {
      const d = grain.s - peel.x;
      const path = tracks[grain.exit];
      if (d > path.length) continue;
      const [px, py] = along(path, d);
      x = px;
      y = py + (y - peel.yc);
      alpha *= 1 - clamp01((d / path.length - 0.2) / 0.8) ** 1.4;
      if (grain.exit === WORST) color = LOSS;
    }
    alpha *= clamp01(x / (g.xs[0] * 0.9));
    if (alpha <= 0.01) continue;
    y += Math.sin(time * grain.freq + grain.phase) * grain.sway;
    if (color !== ink) {
      ctx.fillStyle = color;
      ink = color;
    }
    ctx.globalAlpha = alpha;
    ctx.fillRect(x - grain.size / 2, y - grain.size / 2, grain.size, grain.size);
  }
  ctx.globalAlpha = 1;
}

function useStream(canvas: RefObject<HTMLCanvasElement | null>, g: Layout | null, running: boolean) {
  const stream = useRef<Stream | null>(null);

  useEffect(() => {
    if (!canvas.current || !g) return;
    stream.current = createStream(canvas.current, g);
    if (stream.current) paint(stream.current, g, 0);
  }, [canvas, g]);

  useEffect(() => {
    if (!running || !g) return;
    let raf = 0;
    let last = 0;
    const frame = (ts: number) => {
      const current = stream.current;
      if (current) {
        const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0;
        for (const grain of current.grains) grain.s = (grain.s + grain.speed * dt) % current.cycle;
        paint(current, g, ts / 1000);
      }
      last = ts;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, g]);
}

export function FunnelRibbon() {
  const t = useTranslations('landing.analytics.funnel');
  const locale = useLocale();
  const id = useId();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(0);
  const drawn = useInView(stage, 'draw');
  const live = useInView(stage, 'onScreen');
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const g = useMemo(() => (width > 0 ? layout(width) : null), [width]);
  useStream(canvas, g, drawn && live && !reduce);

  const number = new Intl.NumberFormat(locale);
  const whole = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });
  const hatch = `${id}-hatch`;
  const fade = `${id}-fade`;

  return (
    <div
      ref={stage}
      className={styles.stage}
      style={g ? vars({ '--height': `${g.height}px` }) : undefined}
      data-drawn={drawn || undefined}
    >
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      {g && (
        <>
          <svg className={styles.ribbon} width={width} height={g.height} aria-hidden>
            <defs>
              <pattern
                id={hatch}
                width={10}
                height={10}
                patternUnits='userSpaceOnUse'
                patternTransform='rotate(45)'
              >
                <line x1={0} y1={0} x2={0} y2={10} className={styles.hatchLine} />
              </pattern>
              <linearGradient id={fade} x1={0} y1={0} x2={g.xs[0]} y2={0} gradientUnits='userSpaceOnUse'>
                <stop offset={0} stopColor='white' stopOpacity={0} />
                <stop offset={1} stopColor='white' stopOpacity={1} />
              </linearGradient>
              <mask id={`${fade}-mask`}>
                <rect x={0} y={0} width={g.xs[0]} height={g.height} fill={`url(#${fade})`} />
                <rect x={g.xs[0]} y={0} width={width} height={g.height} fill='white' />
              </mask>
              {g.peels.map((peel, k) => (
                <linearGradient
                  key={k}
                  id={`${id}-peel-${k}`}
                  x1={0}
                  y1={peel.yc}
                  x2={0}
                  y2={peel.yEnd - peel.drop * 0.3}
                  gradientUnits='userSpaceOnUse'
                >
                  <stop offset={0} className={k === WORST ? styles.worstStop : styles.peelStop} />
                  <stop
                    offset={0.5}
                    className={k === WORST ? styles.worstStop : styles.peelStop}
                    stopOpacity={0.55}
                  />
                  <stop offset={1} className={k === WORST ? styles.worstStop : styles.peelStop} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {g.peels.map((peel, k) => (
              <path
                key={k}
                className={styles.peel}
                d={peel.d}
                stroke={`url(#${id}-peel-${k})`}
                strokeWidth={peel.drop}
                data-worst={k === WORST || undefined}
              />
            ))}

            {[styles.band, styles.bandHatch].map((layer) => (
              <g key={layer} mask={`url(#${fade}-mask)`} className={layer}>
                {g.segments.map((segment, k) => (
                  <rect
                    key={k}
                    x={segment.x}
                    y={g.y0}
                    width={segment.width}
                    height={segment.height}
                    fill={layer === styles.bandHatch ? `url(#${hatch})` : undefined}
                  />
                ))}
              </g>
            ))}
            <g mask={`url(#${fade}-mask)`} className={styles.band}>
              <line className={styles.edge} x1={0} x2={g.xs[3]} y1={g.y0 + 0.5} y2={g.y0 + 0.5} />
            </g>
            <rect
              className={styles.converted}
              x={g.xs[3]}
              y={g.y0}
              width={g.end - g.xs[3]}
              height={g.thick[3]}
              rx={Math.min(3, g.thick[3] / 2)}
            />
            <rect
              x={g.xs[3]}
              y={g.y0}
              width={g.end - g.xs[3]}
              height={g.thick[3]}
              fill={`url(#${hatch})`}
              className={styles.convertedHatch}
            />
          </svg>

          <canvas ref={canvas} className={styles.grain} aria-hidden />

          <svg className={styles.gates} width={width} height={g.height} aria-hidden>
            {g.xs.map((x, k) => (
              <rect
                key={k}
                className={styles.gate}
                x={x - 1.5}
                y={g.y0 - 6}
                width={3}
                height={g.thick[k] + 12}
                rx={1.5}
                data-last={k === STEPS.length - 1 || undefined}
              />
            ))}
          </svg>

          <ol className={styles.steps} aria-hidden data-nosnippet>
            {STEPS.map(({ key, icon: Icon, visitors }, k) => (
              <li
                key={key}
                className={styles.step}
                style={vars({ '--x': `${g.xs[k]}px`, '--w': `${g.gap - 12}px`, '--i': k })}
              >
                <span className={styles.stepName}>
                  <Icon className={styles.stepIcon} strokeWidth={1.75} />
                  {t(`steps.${key}`)}
                </span>
                <span className={styles.stepCount}>{number.format(visitors)}</span>
              </li>
            ))}
          </ol>

          <div className={styles.drops} aria-hidden data-nosnippet>
            {g.peels.map((peel, k) => (
              <span
                key={k}
                className={styles.drop}
                data-worst={k === WORST || undefined}
                style={vars({ '--x': `${peel.x + peel.reach}px`, '--y': `${g.bottom}px`, '--i': k })}
              >
                <b>−{whole.format(DROPS[k])}</b>
              </span>
            ))}
            <span
              className={styles.rate}
              style={vars({ '--x': `${g.end}px`, '--y': `${g.y0 + g.thick[3] + 12}px` })}
            >
              <b>{percent.format(STEPS[3].visitors / ENTERED)}</b> {t('converted')}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
