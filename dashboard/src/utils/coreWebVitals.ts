import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import type { SupportedLanguages } from '@/constants/i18n';
import { CWV_THRESHOLDS, CWV_GAUGE_SEGMENTS } from '@/constants/coreWebVitals';
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
 */
export function formatCWV(
  metric: CoreWebVitalName,
  value: number | null | undefined,
  locale?: SupportedLanguages,
): string {
  if (value === null || value === undefined) return '—';
  const { value: v, format, suffix } = getCoreWebVitalIntlFormat(metric, value);
  const formatted = new Intl.NumberFormat(locale, format).format(v);
  return suffix ? `${formatted}${suffix}` : formatted;
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
