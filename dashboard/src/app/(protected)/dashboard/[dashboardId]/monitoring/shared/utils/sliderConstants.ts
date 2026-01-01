import { type SliderMark } from '@/components/inputs/LabeledSlider';

export const MONITOR_INTERVAL_MARKS = [
  ...Array.from({ length: 59 }, (_, i) => (i + 1) * 60),
  ...Array.from({ length: 24 }, (_, i) => (i + 1) * 3600),
];

export const REQUEST_TIMEOUT_MARKS = Array.from({ length: 30 }, (_, i) => (i + 1) * 1000);

export const INTERVAL_DISPLAY_MARKS: SliderMark[] = [
  { idx: 0, label: '1m' },
  { idx: 14, label: '15m' },
  { idx: 29, label: '30m' },
  { idx: 59, label: '1h' },
  { idx: 64, label: '6h' },
  { idx: 70, label: '12h' },
  { idx: 82, label: '24h' },
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

export const RECOMMENDED_INTERVAL_SECONDS = 60;
export const RECOMMENDED_TIMEOUT_MS = 3000;
export const RECOMMENDED_FAILURE_THRESHOLD = 3;
export const RECOMMENDED_SSL_EXPIRY_DAYS = 14;

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
