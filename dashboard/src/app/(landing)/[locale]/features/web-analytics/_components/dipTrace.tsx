'use client';

import { Bug, Filter, Flag, PlayCircle, type LucideIcon } from 'lucide-react';
import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import styles from './dipTrace.module.css';

const TODAY = [9, 6, 4, 3, 3, 5, 12, 25, 41, 52, 58, 63, 66, 70, 31, 27, 26, 30, 64, 55, 44, 33, 22, 14];
const BEFORE = [8, 6, 4, 3, 3, 4, 11, 23, 38, 49, 56, 60, 64, 67, 68, 66, 63, 58, 52, 45, 37, 29, 20, 13];
const DIP = { from: 14, to: 18 };
const TICKS = [0, 6, 12, 18, 24];

const EVIDENCE: { key: 'errors' | 'replay'; icon: LucideIcon }[] = [
  { key: 'errors', icon: Bug },
  { key: 'replay', icon: PlayCircle },
];

type Point = [number, number];

/** Monotone cubic (Fritsch–Carlson): unlike Catmull-Rom it doesn't overshoot around the dip. */
function smooth(points: Point[]) {
  const n = points.length;
  const slopes = points.slice(0, -1).map(([x, y], i) => (points[i + 1][1] - y) / (points[i + 1][0] - x));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  slopes.forEach((m, i) => {
    if (m === 0) {
      tangents[i] = tangents[i + 1] = 0;
      return;
    }
    const a = tangents[i] / m;
    const b = tangents[i + 1] / m;
    const s = a * a + b * b;
    if (s > 9) {
      tangents[i] = (3 / Math.sqrt(s)) * a * m;
      tangents[i + 1] = (3 / Math.sqrt(s)) * b * m;
    }
  });
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const dx = (x1 - x0) / 3;
    d += ` C${x0 + dx},${y0 + tangents[i] * dx} ${x1 - dx},${y1 - tangents[i + 1] * dx} ${x1},${y1}`;
  }
  return d;
}

type Geometry = {
  width: number;
  plot: { left: number; right: number; top: number; bottom: number };
  x: number[];
  today: string;
  area: string;
  before: string;
  wires: string[];
  ends: Point[];
};

function useGeometry() {
  const stage = useRef<HTMLDivElement>(null);
  const chart = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const [geometry, setGeometry] = useState<Geometry | null>(null);

  const measure = useCallback(() => {
    const box = stage.current?.getBoundingClientRect();
    const c = chart.current?.getBoundingClientRect();
    if (!box || !c) return;
    const plot = {
      left: c.left - box.left,
      right: c.right - box.left,
      top: c.top - box.top,
      bottom: c.bottom - box.top,
    };
    const max = Math.max(...TODAY, ...BEFORE) * 1.12;
    const x = (hour: number) => plot.left + ((plot.right - plot.left) * hour) / (TODAY.length - 1);
    const y = (value: number) => plot.bottom - ((plot.bottom - plot.top) * value) / max;
    const todayPoints = TODAY.map((v, h): Point => [x(h), y(v)]);
    const today = smooth(todayPoints);
    const area = `${today} L${x(TODAY.length - 1)},${plot.bottom} L${x(0)},${plot.bottom} Z`;
    const before = smooth(BEFORE.map((v, h): Point => [x(h), y(v)]));

    const from: Point = [Math.round((x(DIP.from) + x(DIP.to)) / 2) + 0.5, Math.round(plot.bottom) + 0.5];
    const wires: string[] = [];
    const ends: Point[] = [from];
    cards.current.forEach((card) => {
      if (!card) return;
      const r = card.getBoundingClientRect();
      const to: Point = [Math.round(r.left - box.left + r.width / 2) + 0.5, Math.round(r.top - box.top) + 0.5];
      const dy = (to[1] - from[1]) * 0.6;
      wires.push(`M${from[0]},${from[1]} C${from[0]},${from[1] + dy} ${to[0]},${to[1] - dy} ${to[0]},${to[1]}`);
      ends.push(to);
    });
    setGeometry({ width: box.width, plot, x: TODAY.map((_, h) => x(h)), today, area, before, wires, ends });
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [measure]);

  return { stage, chart, cards, geometry };
}

export function DipTrace() {
  const t = useTranslations('landing.analytics.trace');
  const id = useId();
  const { stage, chart, cards, geometry: g } = useGeometry();
  const drawn = useInView(stage, 'draw');
  const hatch = `${id}-hatch`;
  const fill = `${id}-fill`;

  return (
    <div
      ref={stage}
      className={styles.stage}
      style={vars({ '--dip': `${(((DIP.from + DIP.to) / 2) * 100) / (TODAY.length - 1)}%` })}
      data-drawn={drawn || undefined}
    >
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      <div className={styles.head} aria-hidden data-nosnippet>
        <span className={styles.filter}>
          <Filter className='size-3.5' strokeWidth={1.75} />
          {t.rich('filter', { value: (chunks) => <b>{chunks}</b> })}
        </span>
        <span className={styles.metric}>{t('metric')}</span>
        <span className={styles.legend}>
          <span data-series='today'>{t('today')}</span>
          <span data-series='before'>{t('before')}</span>
        </span>
      </div>

      <div ref={chart} className={styles.chart} aria-hidden />

      {g && (
        <svg className={styles.svg} width={g.width} height='100%' aria-hidden>
          <defs>
            <pattern id={hatch} width={10} height={10} patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
              <line x1={0} y1={0} x2={0} y2={10} className={styles.hatchLine} />
            </pattern>
            <linearGradient
              id={fill}
              x1={0}
              y1={g.plot.top}
              x2={0}
              y2={g.plot.bottom}
              gradientUnits='userSpaceOnUse'
            >
              <stop offset={0} className={styles.fillTop} />
              <stop offset={1} className={styles.fillTop} stopOpacity={0} />
            </linearGradient>
            <linearGradient
              id={`${fill}-dip`}
              x1={0}
              y1={g.plot.top}
              x2={0}
              y2={g.plot.bottom}
              gradientUnits='userSpaceOnUse'
            >
              <stop offset={0} className={styles.dipStop} stopOpacity={0.12} />
              <stop offset={1} className={styles.dipStop} stopOpacity={0.4} />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((f) => {
            const y = Math.round(g.plot.top + (g.plot.bottom - g.plot.top) * f) + 0.5;
            return <line key={f} className={styles.grid} x1={g.plot.left} x2={g.plot.right} y1={y} y2={y} />;
          })}
          <line
            className={styles.axis}
            x1={g.plot.left}
            x2={g.plot.right}
            y1={Math.round(g.plot.bottom) + 0.5}
            y2={Math.round(g.plot.bottom) + 0.5}
          />

          <g className={styles.window}>
            <rect
              x={g.x[DIP.from]}
              y={g.plot.top}
              width={g.x[DIP.to] - g.x[DIP.from]}
              height={g.plot.bottom - g.plot.top}
              fill={`url(#${fill}-dip)`}
            />
            <rect
              x={g.x[DIP.from]}
              y={g.plot.top}
              width={g.x[DIP.to] - g.x[DIP.from]}
              height={g.plot.bottom - g.plot.top}
              fill={`url(#${hatch})`}
            />
          </g>

          <path className={styles.area} d={g.area} fill={`url(#${fill})`} />
          <path className={styles.before} d={g.before} />
          <path className={styles.today} d={g.today} pathLength={1} />

          <line
            className={styles.marker}
            x1={Math.round(g.x[DIP.from]) + 0.5}
            x2={Math.round(g.x[DIP.from]) + 0.5}
            y1={g.plot.top - 6}
            y2={g.plot.bottom}
          />

          {g.wires.map((d, i) => (
            <path key={i} className={styles.wire} d={d} pathLength={1} />
          ))}
          {g.ends.map(([x, y], i) => (
            <circle key={i} className={styles.plug} cx={x} cy={y} r={2.75} />
          ))}
        </svg>
      )}

      {g && (
        <div className={styles.overlay} aria-hidden data-nosnippet>
          <span
            className={styles.annotation}
            style={vars({ '--x': `${Math.round(g.x[DIP.from])}px`, '--y': `${Math.round(g.plot.top)}px` })}
          >
            <Flag className='size-3' strokeWidth={2} />
            {t('annotation')}
          </span>
          {TICKS.map((hour) => (
            <span
              key={hour}
              className={styles.tick}
              data-edge={hour === 0 ? 'start' : hour === 24 ? 'end' : undefined}
              style={vars({
                '--x': `${Math.round(g.x[Math.min(hour, TODAY.length - 1)])}px`,
                '--y': `${Math.round(g.plot.bottom)}px`,
              })}
            >
              {`${String(hour).padStart(2, '0')}:00`}
            </span>
          ))}
        </div>
      )}

      <div className={styles.evidence} aria-hidden data-nosnippet>
        {EVIDENCE.map(({ key, icon: Icon }, i) => (
          <div
            key={key}
            ref={(el) => {
              cards.current[i] = el;
            }}
            className={styles.card}
            data-kind={key}
            style={vars({ '--i': i })}
          >
            <span className={styles.cardIcon}>
              <Icon className='size-4' strokeWidth={1.75} />
            </span>
            <span className={styles.cardText}>
              <span className={styles.product}>{t(`evidence.${key}.product`)}</span>
              <span className={styles.finding}>{t(`evidence.${key}.finding`)}</span>
              <span className={styles.meta}>{t(`evidence.${key}.meta`)}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
