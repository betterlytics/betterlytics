import { CoreWebVitalName } from '@/entities/webVitals';
import { formatCompactFromMilliseconds } from './dateFormatters';
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';

/**
 * Format a number to a presentable string with K/M suffix
 * @param num The number to format
 * @param decimalPlaces Number of decimal places (default: 1)
 * @returns Formatted number string (e.g., "1.2K", "3.5M")
 */
export function formatNumber(num: number, decimalPlaces = 1): string {
  if (num === undefined || num === null) return '-';

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(decimalPlaces)}M`;
  }

  if (num >= 1000) {
    return `${(num / 1000).toFixed(decimalPlaces)}K`;
  }

  return num.toString();
}

/**
 * Format a number as a percentage with % symbol
 * @param num The number to format as a percentage
 * @param decimalPlaces Number of decimal places (default: 1)
 * @returns Formatted percentage string (e.g., "42.5%")
 */
export function formatPercentage(num: number, decimalPlaces = 1): string {
  return `${num.toFixed(decimalPlaces)}%`;
}

/**
 * Capitalize the first letter of a string
 * @param string The string to capitalize
 * @returns The string with the first letter capitalized
 */
export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function formatCWV(metric: CoreWebVitalName, value: number | null | undefined, clsDecimals = 3): string {
  if (value == null) return '—';
  if (metric === 'CLS') {
    const rounded = Number((value as number).toFixed(clsDecimals));
    return rounded.toString();
  }
  return formatCompactFromMilliseconds(value as number);
}

export function getCwvStatusColor(metric: CoreWebVitalName, value: number | null | undefined): string | undefined {
  if (value == null) return undefined;
  const [goodThreshold, niThreshold] = CWV_THRESHOLDS[metric] ?? [];
  if (goodThreshold === undefined || niThreshold === undefined) return undefined;
  if (value > niThreshold) return 'var(--cwv-threshold-poor)';
  if (value > goodThreshold) return 'var(--cwv-threshold-ni)';
  return 'var(--cwv-threshold-good)';
}
