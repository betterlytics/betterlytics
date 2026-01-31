import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';

// Thresholds values are taken from Web.dev
// Tuple: [goodThreshold, fairThreshold]
export const CWV_THRESHOLDS: Record<CoreWebVitalName, [number, number]> = {
  CLS: [0.1, 0.25],
  LCP: [2500, 4000],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};

export const PERFORMANCE_SCORE_THRESHOLDS = {
  greatMin: 90,
  okayMin: 50,
};
