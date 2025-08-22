import type { CoreWebVitalName } from '@/entities/webVitals';

// Thresholds values are taken from Web.dev
// Tuple: [goodThreshold, needsImprovementThreshold]
export const CWV_THRESHOLDS: Record<CoreWebVitalName, [number, number]> = {
  CLS: [0.1, 0.25],
  LCP: [2500, 4000],
  INP: [200, 500],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};
