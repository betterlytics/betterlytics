import { type SliderMark } from '@/components/inputs/LabeledSlider';
import { MONITOR_DEFAULTS, MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';

// Minute steps up to 1h, then hour steps up to the schema maximum, so every
// selectable mark is guaranteed to pass MonitorCheckBaseSchema validation.
export const MONITOR_INTERVAL_MARKS = [
  ...Array.from(
    { length: 60 - MONITOR_LIMITS.INTERVAL_MIN_SECONDS / 60 },
    (_, i) => MONITOR_LIMITS.INTERVAL_MIN_SECONDS + i * 60,
  ),
  ...Array.from({ length: MONITOR_LIMITS.INTERVAL_MAX_SECONDS / 3600 }, (_, i) => (i + 1) * 3600),
];

export const REQUEST_TIMEOUT_MARKS = Array.from({ length: 30 }, (_, i) => (i + 1) * 1000);

const intervalMark = (seconds: number, label: string): SliderMark => ({
  idx: MONITOR_INTERVAL_MARKS.indexOf(seconds),
  label,
});

export const INTERVAL_DISPLAY_MARKS: SliderMark[] = [
  intervalMark(60, '1m'),
  intervalMark(300, '5m'),
  intervalMark(900, '15m'),
  intervalMark(1800, '30m'),
  intervalMark(3600, '1h'),
  intervalMark(21_600, '6h'),
  intervalMark(43_200, '12h'),
  intervalMark(86_400, '24h'),
];

export const TIMEOUT_DISPLAY_MARKS: SliderMark[] = [
  { idx: 0, label: '1s' },
  { idx: 4, label: '5s' },
  { idx: 9, label: '10s' },
  { idx: 14, label: '15s' },
  { idx: 19, label: '20s' },
  { idx: 24, label: '25s' },
  { idx: 29, label: '30s' },
];

export const SENSITIVITY_DISPLAY_MARKS: SliderMark[] = [
  { idx: 1, label: '1' },
  { idx: 5, label: '5' },
  { idx: 10, label: '10' },
];

export const SSL_EXPIRY_MARKS = [1, 3, 7, 14, 30];

export const SSL_EXPIRY_DISPLAY_MARKS: SliderMark[] = [
  { idx: 0, label: '1d' },
  { idx: 1, label: '3d' },
  { idx: 2, label: '7d' },
  { idx: 3, label: '14d' },
  { idx: 4, label: '30d' },
];

export const RECOMMENDED_INTERVAL_SECONDS = MONITOR_DEFAULTS.intervalSeconds;
export const RECOMMENDED_TIMEOUT_MS = MONITOR_DEFAULTS.timeoutMs;
export const RECOMMENDED_FAILURE_THRESHOLD = MONITOR_DEFAULTS.failureThreshold;
export const RECOMMENDED_SSL_EXPIRY_DAYS = MONITOR_DEFAULTS.sslExpiryAlertDays;

export function nearestIndex(values: number[], target: number): number {
  let bestIdx = 0;
  let bestDiff = Number.POSITIVE_INFINITY;
  for (let idx = 0; idx < values.length; idx++) {
    const diff = Math.abs(values[idx] - target);
    if (diff < bestDiff) {
      bestIdx = idx;
      bestDiff = diff;
    }
  }
  return bestIdx;
}
