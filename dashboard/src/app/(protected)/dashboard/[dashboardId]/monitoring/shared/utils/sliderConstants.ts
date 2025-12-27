import { type SliderMark } from '@/components/inputs/LabeledSlider';

// 30s through 59s (1-second ticks), then 1m through 59m (1-minute ticks), then 1h through 24h (1-hour ticks)
export const MONITOR_INTERVAL_MARKS = [
  // 1-second ticks: 30s to 59s (30 values, indices 0-29)
  ...Array.from({ length: 30 }, (_, i) => 30 + i),
  // 1-minute ticks: 1m to 59m (59 values, indices 30-88)
  ...Array.from({ length: 59 }, (_, i) => (i + 1) * 60),
  // 1-hour ticks: 1h to 24h (24 values, indices 89-112)
  ...Array.from({ length: 24 }, (_, i) => (i + 1) * 3600),
];

// 1s through 30s in 1s increments
export const REQUEST_TIMEOUT_MARKS = Array.from({ length: 30 }, (_, i) => (i + 1) * 1000);

export const INTERVAL_DISPLAY_MARKS: SliderMark[] = [
  { idx: 0, label: '30s' },
  { idx: 30, label: '1m' },
  { idx: 44, label: '15m' },
  { idx: 59, label: '30m' },
  { idx: 89, label: '1h' },
  { idx: 94, label: '6h' },
  { idx: 100, label: '12h' },
  { idx: 112, label: '24h' },
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

export const SSL_EXPIRY_DISPLAY_MARKS: SliderMark[] = [
  { idx: 1, label: '1d' },
  { idx: 30, label: '30d' },
  { idx: 60, label: '60d' },
  { idx: 90, label: '90d' },
];

export const RECOMMENDED_INTERVAL_SECONDS = 60;
export const RECOMMENDED_TIMEOUT_MS = 3000;
export const RECOMMENDED_FAILURE_THRESHOLD = 3;
export const RECOMMENDED_SSL_EXPIRY_DAYS = 14;

/** Find the nearest index in a marks array for a given target value */
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
