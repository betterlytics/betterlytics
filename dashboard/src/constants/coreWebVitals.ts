import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';

// Thresholds values are taken from Web.dev
// Tuple: [goodThreshold, fairThreshold]
export const CWV_THRESHOLDS = {
  CLS: [0.1, 0.25],
  LCP: [2500, 4000],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
} as const satisfies Record<CoreWebVitalName, readonly [number, number]>;

export const PERFORMANCE_SCORE_THRESHOLDS = {
  greatMin: 90,
  okayMin: 50,
} as const;

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
