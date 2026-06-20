import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';

/** Preset accent swatches offered in the picker; the first is the product default. */
export const ACCENT_PRESETS = [
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  '#3b82f6',
  '#22c55e',
  '#8b5cf6',
  '#f59e0b',
  '#0ea5e9',
];

/** Lifecycle of the public-URL slug availability check */
export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
