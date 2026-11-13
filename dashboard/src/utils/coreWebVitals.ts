import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import {
  CWV_THRESHOLDS,
  CWV_GAUGE_SEGMENTS,
  PERFORMANCE_SCORE_THRESHOLDS,
  PERFORMANCE_SCORE_WEIGHTS,
} from '@/constants/coreWebVitals';
import type { Segment } from '@/components/gauge';

export const CORE_WEB_VITAL_LEVELS = ['good', 'fair', 'poor'] as const;
export type CoreWebVitalLevel = (typeof CORE_WEB_VITAL_LEVELS)[number];

export const PERCENTILE_KEYS = ['p50', 'p75', 'p90', 'p99'] as const;
export type PercentileKey = (typeof PERCENTILE_KEYS)[number];

/**
 * Get Intl.NumberFormat-compatible value, format options, and suffix for a CWV metric.
 * Uses suffix prop instead of Intl unit formatting to avoid NumberFlow color animation bug.
 */
export function getCoreWebVitalIntlFormat(metric: CoreWebVitalName, value: number) {
  if (metric === 'CLS') {
    return { value, format: { minimumFractionDigits: 2, maximumFractionDigits: 2 } };
  }
  const seconds = value / 1000;
  if (seconds < 1) {
    return {
      value,
      format: { maximumFractionDigits: 0 },
      suffix: 'ms',
    };
  }
  return {
    value: seconds,
    format: { maximumFractionDigits: 2 },
    suffix: 's',
  };
}

/**
 * Format a Core Web Vital metric value for display.
 * Uses Intl.NumberFormat with unit styling for locale-aware output.
 */
export function formatCWV(
  metric: CoreWebVitalName,
  value: number | null | undefined,
  locale?: SupportedLanguages,
): string {
  if (value === null || value === undefined) return '—';
  if (metric === 'CLS') {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
  const seconds = value / 1000;
  if (seconds < 1) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'millisecond',
      unitDisplay: 'narrow',
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'second',
    unitDisplay: 'narrow',
    maximumFractionDigits: 2,
  }).format(seconds);
}

/**
 * Get the CWV level (good/fair/poor) for a metric value.
 */
export function getCoreWebVitalLevel(
  metric: CoreWebVitalName,
  value: number | null | undefined,
): CoreWebVitalLevel | undefined {
  if (value === null || value === undefined) return undefined;
  const [goodThreshold, fairThreshold] = CWV_THRESHOLDS[metric] ?? [];
  if (goodThreshold === undefined || fairThreshold === undefined) return undefined;
  if (value > fairThreshold) return 'poor';
  if (value > goodThreshold) return 'fair';
  return 'good';
}

/**
 * Get the label color CSS variable for a CWV metric value (darker variant for text).
 */
export function getCoreWebVitalLabelColor(
  metric: CoreWebVitalName,
  value: number | null | undefined,
): string | undefined {
  const level = getCoreWebVitalLevel(metric, value);
  return level ? `var(--cwv-threshold-${level}-label)` : undefined;
}

function scoreForMetric(value: number, good: number, meh: number): number {
  if (Number.isNaN(value)) return 0;
  if (value <= good) {
    const frac = Math.max(0, Math.min(1, value / good));
    return 90 + (1 - frac) * 10;
  }
  if (value <= meh) {
    const frac = (value - good) / (meh - good);
    return 90 - frac * 40;
  }
  const over = Math.max(0, value - meh);
  const frac = Math.min(1, over / meh);
  return Math.max(0, 50 - frac * 50);
}

/** The 0–100 performance score, weighted over whichever metrics have a value. */
export function getPerformanceScore(values: Partial<Record<CoreWebVitalName, number | null>>): number {
  let weighted = 0;
  let weightSum = 0;
  (['LCP', 'CLS', 'FCP', 'TTFB', 'INP'] as CoreWebVitalName[]).forEach((metric) => {
    const value = values[metric] ?? null;
    if (value == null) return;

    const [good, meh] = CWV_THRESHOLDS[metric];
    const s = scoreForMetric(value, good, meh);
    const w = PERFORMANCE_SCORE_WEIGHTS[metric];
    weighted += s * w;
    weightSum += w;
  });
  return weightSum > 0 ? weighted / weightSum : 0;
}

export type PerformanceGrade = 'great' | 'okay' | 'poor';

export function getPerformanceGrade(score: number): PerformanceGrade {
  if (score >= PERFORMANCE_SCORE_THRESHOLDS.greatMin) return 'great';
  if (score >= PERFORMANCE_SCORE_THRESHOLDS.okayMin) return 'okay';
  return 'poor';
}

/** Converts a CWV metric value to Gauge component props (segments are pre-computed). */
export function getCoreWebVitalGaugeProps(
  metric: CoreWebVitalName,
  value: number | null,
): { segments: Segment[]; progress: number } {
  const [, , scaleMax] = CWV_THRESHOLDS[metric];
  const progress = value === null ? 0 : Math.min((value / scaleMax) * 100, 100);

  return {
    segments: CWV_GAUGE_SEGMENTS[metric] as Segment[],
    progress,
  };
}
