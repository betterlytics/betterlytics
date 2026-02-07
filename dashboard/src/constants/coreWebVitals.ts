import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';

// Thresholds values are taken from Web.dev https://web.dev/articles/defining-core-web-vitals-thresholds
// Tuple: [goodThreshold, fairThreshold, scaleMax]
export const CWV_THRESHOLDS = {
  CLS: [0.1, 0.25, 0.278],
  LCP: [2500, 4000, 4444],
  INP: [200, 500, 556],
  FCP: [1800, 3000, 3333],
  TTFB: [800, 1800, 2000],
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
  LCP: [1200, 1800, 3200, 4200, 4100],
  INP: [80, 350, 450, 520, 530],
  CLS: [0.03, 0.05, 0.15, 0.26, 0.27],
  FCP: [1000, 1400, 2200, 2800, 3200],
  TTFB: [400, 750, 1200, 1900, 1850],
} as const satisfies Record<CoreWebVitalName, readonly number[]>;
