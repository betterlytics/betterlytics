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

export const CWV_DESCRIPTIONS: Record<CoreWebVitalName, string> = {
  CLS: 'Measures visual stability. CLS captures how much content unexpectedly shifts while the page loads.',
  LCP: 'Measures loading performance. LCP is the moment the largest text or image becomes visible.',
  INP: 'Measures responsiveness. INP is the time from a user action until the next visual update.',
  FCP: 'Shows when the first piece of content appears on the screen during page load.',
  TTFB: 'Measures server response speed — the time from request until the first byte is received.',
};
