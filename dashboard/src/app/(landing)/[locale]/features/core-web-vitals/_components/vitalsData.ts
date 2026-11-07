import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import type { FlagCode } from '@/landing/components/illustrations/flags';
import { getPerformanceScore, type PercentileKey } from '@/utils/coreWebVitals';

/* A made-up shop's numbers, deliberately untranslated. Each row holds its 75th percentiles; the others are spread from them. */

export type Vitals = Record<CoreWebVitalName, number | null>;

export type Dimension = 'pages' | 'devices' | 'countries' | 'browsers' | 'os';

export type RowIcon =
  | { kind: 'device'; device: 'desktop' | 'mobile' | 'tablet' }
  | { kind: 'flag'; code: FlagCode }
  | { kind: 'image'; src: string }
  | { kind: 'mask'; src: string };

/** `share` is the row's share of page loads; CLS is null where only non-Chromium browsers report. */
export type BreakdownRow = { key: string; share: number; p75: Vitals; icon?: RowIcon };

const v = (LCP: number, INP: number, CLS: number | null, FCP: number, TTFB: number): Vitals => ({
  LCP,
  INP,
  CLS,
  FCP,
  TTFB,
});

export const OVERALL: Vitals = v(2900, 230, 0.08, 1700, 640);

export const BREAKDOWN: Record<Dimension, BreakdownRow[]> = {
  pages: [
    { key: '/shop/espresso-beans', share: 0.22, p75: v(4400, 280, 0.16, 2300, 760) },
    { key: '/checkout', share: 0.12, p75: v(3300, 520, 0.05, 2000, 980) },
    { key: '/blog/brewing-guide', share: 0.17, p75: v(2900, 130, 0.24, 1750, 600) },
    { key: '/', share: 0.3, p75: v(2350, 160, 0.04, 1450, 520) },
    { key: '/subscriptions', share: 0.11, p75: v(2150, 190, 0.03, 1300, 480) },
    { key: '/about', share: 0.08, p75: v(1650, 90, 0.01, 1100, 440) },
  ],
  devices: [
    { key: 'mobile', share: 0.62, p75: v(3500, 290, 0.11, 2100, 760), icon: { kind: 'device', device: 'mobile' } },
    { key: 'tablet', share: 0.05, p75: v(2600, 210, 0.07, 1700, 640), icon: { kind: 'device', device: 'tablet' } },
    {
      key: 'desktop',
      share: 0.33,
      p75: v(1700, 110, 0.03, 1100, 450),
      icon: { kind: 'device', device: 'desktop' },
    },
  ],
  countries: [
    { key: 'IN', share: 0.1, p75: v(4700, 340, 0.09, 2950, 1650), icon: { kind: 'flag', code: 'IN' } },
    { key: 'BR', share: 0.09, p75: v(3900, 300, 0.08, 2400, 1250), icon: { kind: 'flag', code: 'BR' } },
    { key: 'JP', share: 0.08, p75: v(2850, 170, 0.05, 1650, 980), icon: { kind: 'flag', code: 'JP' } },
    { key: 'US', share: 0.36, p75: v(2600, 210, 0.07, 1550, 560), icon: { kind: 'flag', code: 'US' } },
    { key: 'GB', share: 0.16, p75: v(2400, 180, 0.06, 1450, 470), icon: { kind: 'flag', code: 'GB' } },
    { key: 'DE', share: 0.21, p75: v(2300, 170, 0.05, 1400, 410), icon: { kind: 'flag', code: 'DE' } },
  ],
  browsers: [
    {
      key: 'Samsung Internet',
      share: 0.04,
      p75: v(3900, 340, 0.12, 2400, 780),
      icon: { kind: 'image', src: '/browser-icons/samsunginternet.svg' },
    },
    {
      key: 'Chrome',
      share: 0.55,
      p75: v(2950, 240, 0.08, 1700, 620),
      icon: { kind: 'image', src: '/browser-icons/chrome.svg' },
    },
    {
      key: 'Safari',
      share: 0.27,
      p75: v(2750, 200, null, 1600, 600),
      icon: { kind: 'image', src: '/browser-icons/safari.svg' },
    },
    {
      key: 'Firefox',
      share: 0.06,
      p75: v(2500, 190, null, 1500, 560),
      icon: { kind: 'image', src: '/browser-icons/firefox.svg' },
    },
    {
      key: 'Edge',
      share: 0.08,
      p75: v(2200, 160, 0.05, 1350, 520),
      icon: { kind: 'image', src: '/browser-icons/edge.svg' },
    },
  ],
  os: [
    {
      key: 'Android',
      share: 0.38,
      p75: v(3600, 300, 0.12, 2150, 780),
      icon: { kind: 'image', src: '/os-icons/android.svg' },
    },
    {
      key: 'iOS',
      share: 0.27,
      p75: v(2900, 210, null, 1750, 640),
      icon: { kind: 'mask', src: '/os-icons/apple-dark.svg' },
    },
    {
      key: 'Windows',
      share: 0.2,
      p75: v(2100, 130, 0.04, 1300, 470),
      icon: { kind: 'mask', src: '/os-icons/windows.svg' },
    },
    {
      key: 'Linux',
      share: 0.02,
      p75: v(2000, 120, 0.02, 1250, 450),
      icon: { kind: 'image', src: '/os-icons/linux.svg' },
    },
    {
      key: 'macOS',
      share: 0.13,
      p75: v(1800, 110, 0.03, 1150, 430),
      icon: { kind: 'mask', src: '/os-icons/apple-dark.svg' },
    },
  ],
};

/** How far each percentile sits from the 75th; slow tails are long, so P99 is a multiple of it. */
const SPREAD: Record<CoreWebVitalName, Record<PercentileKey, number>> = {
  LCP: { p50: 0.72, p75: 1, p90: 1.42, p99: 2.1 },
  FCP: { p50: 0.74, p75: 1, p90: 1.38, p99: 2 },
  TTFB: { p50: 0.7, p75: 1, p90: 1.5, p99: 2.4 },
  INP: { p50: 0.6, p75: 1, p90: 1.75, p99: 3.1 },
  CLS: { p50: 0.5, p75: 1, p90: 1.9, p99: 3.4 },
};

function scale(metric: CoreWebVitalName, value: number | null, by: number | null) {
  if (value === null || by === null) return null;
  const scaled = value * by;
  return metric === 'CLS' ? Math.round(scaled * 100) / 100 : Math.round(scaled / 10) * 10;
}

const each = (fn: (metric: CoreWebVitalName) => number | null): Vitals => ({
  LCP: fn('LCP'),
  INP: fn('INP'),
  CLS: fn('CLS'),
  FCP: fn('FCP'),
  TTFB: fn('TTFB'),
});

export const atPercentile = (p75: Vitals, percentile: PercentileKey) =>
  each((metric) => scale(metric, p75[metric], SPREAD[metric][percentile]));

/** A row under a filter on another dimension: moved by as much as the filtered slice differs from the whole. */
export const within = (p75: Vitals, slice: Vitals) =>
  each((metric) => {
    const part = slice[metric];
    const whole = OVERALL[metric];
    return scale(metric, p75[metric], part === null || whole === null ? null : part / whole);
  });

export function scoreRow(row: BreakdownRow, percentile: PercentileKey) {
  const score = getPerformanceScore(atPercentile(row.p75, percentile));
  return { score, opportunity: row.share * (100 - score) };
}
