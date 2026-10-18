import { UNLIMITED_DATA_RETENTION_DAYS } from '@/lib/billing/capabilities';

export type DataRetentionPreset = {
  value: number;
  i18nKey: 'm6' | 'y1' | 'y2' | 'y3' | 'y5' | 'forever';
  fallback: string;
};

export const DATA_RETENTION_PRESETS: DataRetentionPreset[] = [
  { value: 180, i18nKey: 'm6', fallback: '6 months' },
  { value: 365, i18nKey: 'y1', fallback: '1 year' },
  { value: 730, i18nKey: 'y2', fallback: '2 years' },
  { value: 1095, i18nKey: 'y3', fallback: '3 years' },
  { value: 1825, i18nKey: 'y5', fallback: '5 years' },
];

export const UNLIMITED_RETENTION_PRESET: DataRetentionPreset = {
  value: UNLIMITED_DATA_RETENTION_DAYS,
  i18nKey: 'forever',
  fallback: 'Keep forever',
};

// Orders retention by how much data it keeps: -1 ranks above every finite value
export function retentionRank(days: number): number {
  return days === UNLIMITED_DATA_RETENTION_DAYS ? Number.POSITIVE_INFINITY : days;
}
