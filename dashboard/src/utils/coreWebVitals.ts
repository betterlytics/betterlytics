import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { formatCompactFromMilliseconds } from './dateFormatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import type { Segment } from '@/components/gauge';

export const CWV_LEVELS = ['good', 'fair', 'poor'] as const;
export type CwvLevel = (typeof CWV_LEVELS)[number];

/**
 * Format a Core Web Vital metric value for display.
 */
export function formatCWV(metric: CoreWebVitalName, value: number | null | undefined, clsDecimals = 3): string {
  if (value === null || value === undefined) return '—';
  if (metric === 'CLS') {
    return Number(value.toFixed(clsDecimals)).toString();
  }
  return formatCompactFromMilliseconds(value);
}

/**
 * Get the CWV level (good/fair/poor) for a metric value.
 */
export function getCwvLevel(metric: CoreWebVitalName, value: number | null | undefined): CwvLevel | undefined {
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
export function getCwvLabelColor(metric: CoreWebVitalName, value: number | null | undefined): string | undefined {
  const level = getCwvLevel(metric, value);
  return level ? `var(--cwv-threshold-${level}-label)` : undefined;
}

/**
 * Converts a CWV metric value to Gauge component props.
 * Calculates segment percentages and progress based on thresholds.
 * @param metric The CWV metric name
 * @param value The metric value (null for no data)
 * @returns Object with segments array and progress percentage
 */
export function getCwvGaugeProps(
  metric: CoreWebVitalName,
  value: number | null,
): { segments: Segment[]; progress: number } {
  const [good, fair] = CWV_THRESHOLDS[metric];
  const scaleMax = fair * 1.5;

  const goodPercent = (good / scaleMax) * 100;
  const fairPercent = ((fair - good) / scaleMax) * 100;
  const poorPercent = 100 - goodPercent - fairPercent;
  const progress = value === null ? 0 : Math.min((value / scaleMax) * 100, 100);

  return {
    segments: [
      { percent: goodPercent, color: 'var(--cwv-threshold-good)' },
      { percent: fairPercent, color: 'var(--cwv-threshold-fair)' },
      { percent: poorPercent, color: 'var(--cwv-threshold-poor)' },
    ],
    progress,
  };
}
