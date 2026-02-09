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

// Per-metric mock values cycling through good → fair → poor ranges
export const MOCK_CORE_WEB_VITAL_VALUES = {
  LCP: [800, 1200, 1800, 2200, 3200, 3500, 3800, 4200],
  INP: [60, 80, 150, 350, 400, 450, 480, 520],
  CLS: [0.02, 0.03, 0.05, 0.08, 0.15, 0.18, 0.22, 0.26],
  FCP: [800, 1000, 1400, 1600, 2200, 2500, 2800, 3200],
  TTFB: [200, 400, 600, 750, 1200, 1400, 1600, 1900],
} as const satisfies Record<CoreWebVitalName, readonly number[]>;
