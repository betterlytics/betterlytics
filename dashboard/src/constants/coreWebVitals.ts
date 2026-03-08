import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';

// Thresholds values are taken from Web.dev https://web.dev/articles/defining-core-web-vitals-thresholds
// Tuple: [goodThreshold, fairThreshold, scaleMax]
export const CWV_THRESHOLDS = {
  CLS: [0.1, 0.25, 0.272],
  LCP: [2500, 4000, 4348],
  INP: [200, 500, 544],
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

// Per-metric mock values shuffled across good / fair / poor ranges
export const MOCK_CORE_WEB_VITAL_VALUES = {
  LCP: [1430, 3555, 811, 2223, 1800, 4200, 1203, 3810, 350],
  INP: [150, 480, 61, 125, 87, 522, 170, 399, 15],
  CLS: [0.05, 0.22, 0.02, 0.18, 0.08, 0.26, 0.03, 0.09, 0.15],
  FCP: [982, 2805, 610, 1650, 1427, 3200, 815, 2555, 258],
  TTFB: [512, 1690, 210, 752, 608, 1901, 390, 1189, 80],
} as const satisfies Record<CoreWebVitalName, readonly number[]>;
