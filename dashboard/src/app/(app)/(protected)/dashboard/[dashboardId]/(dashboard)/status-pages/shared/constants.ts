import { STATUS_PAGE_DEFAULT_ACCENT_COLOR } from '@/entities/analytics/statusPage/statusPage.entities';

// Deep jewel-tone palette that sits calmly above the green status hero.
export const ACCENT_PRESETS = [
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  '#2d393d',
  '#007029',
  '#6a33a9',
  '#88f1ff',
  '#292065',
];

export type SlugStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
