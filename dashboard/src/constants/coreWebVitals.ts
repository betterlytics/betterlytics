import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';

// Thresholds values are taken from Web.dev https://web.dev/articles/defining-core-web-vitals-thresholds
// Tuple: [goodThreshold, fairThreshold, scaleMax]
export const CWV_THRESHOLDS = {
  CLS: [0.1, 0.25, 0.272],
  LCP: [2500, 4000, 4348],
  INP: [200, 500, 543],
  FCP: [1800, 3000, 3261],
  TTFB: [800, 1800, 1957],
} as const satisfies Record<CoreWebVitalName, readonly [number, number, number]>;

export const PERFORMANCE_SCORE_THRESHOLDS = {
  greatMin: 90,
  okayMin: 50,
} as const;

/** Gauge segment percentages derived from thresholds */
export const CWV_GAUGE_SEGMENTS = Object.entries(CWV_THRESHOLDS).reduce(
  (acc, [metric, [good, fair, scaleMax]]) => {
    acc[metric as CoreWebVitalName] = [
      { percent: (good / scaleMax) * 100, color: 'var(--cwv-threshold-good)' },
      { percent: ((fair - good) / scaleMax) * 100, color: 'var(--cwv-threshold-fair)' },
      { percent: ((scaleMax - fair) / scaleMax) * 100, color: 'var(--cwv-threshold-poor)' },
    ];
    return acc;
  },
  {} as Record<CoreWebVitalName, { percent: number; color: string }[]>,
);

// 5 variations cycling through good → fair → poor ranges
// Thresholds: LCP [2500,4000], INP [200,500], CLS [0.1,0.25], FCP [1800,3000], TTFB [800,1800]
export const MOCK_CORE_WEB_VITAL_METRICS_DATA = [
  // Variation 1: All good (green)
  [
    { key: 'LCP', value: 1200 },
    { key: 'INP', value: 80 },
    { key: 'CLS', value: 0.03 },
    { key: 'FCP', value: 1000 },
    { key: 'TTFB', value: 400 },
  ],
  // Variation 2: Mostly good, one fair
  [
    { key: 'LCP', value: 1800 },
    { key: 'INP', value: 350 },
    { key: 'CLS', value: 0.05 },
    { key: 'FCP', value: 1400 },
    { key: 'TTFB', value: 750 },
  ],
  // Variation 3: Mixed fair
  [
    { key: 'LCP', value: 3200 },
    { key: 'INP', value: 450 },
    { key: 'CLS', value: 0.15 },
    { key: 'FCP', value: 2200 },
    { key: 'TTFB', value: 1200 },
  ],
  // Variation 4: Some poor (red)
  [
    { key: 'LCP', value: 4500 },
    { key: 'INP', value: 550 },
    { key: 'CLS', value: 0.08 },
    { key: 'FCP', value: 2800 },
    { key: 'TTFB', value: 2000 },
  ],
  // Variation 5: More poor (red)
  [
    { key: 'LCP', value: 2800 },
    { key: 'INP', value: 600 },
    { key: 'CLS', value: 0.3 },
    { key: 'FCP', value: 3500 },
    { key: 'TTFB', value: 600 },
  ],
] as const satisfies readonly { key: CoreWebVitalName; value: number }[][];
