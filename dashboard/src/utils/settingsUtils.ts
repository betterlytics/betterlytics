export type DataRetentionPreset = {
  value: number;
  i18nKey: 'd30' | 'm3' | 'm6' | 'y1' | 'y2' | 'y3';
  fallback: string;
};

export const DATA_RETENTION_PRESETS: DataRetentionPreset[] = [
  { value: 90, i18nKey: 'm3', fallback: '3 months' },
  { value: 180, i18nKey: 'm6', fallback: '6 months' },
  { value: 365, i18nKey: 'y1', fallback: '1 year' },
  { value: 730, i18nKey: 'y2', fallback: '2 years' },
  { value: 1095, i18nKey: 'y3', fallback: '3 years' },
];

export const ALERT_THRESHOLD_PRESETS = [
  { value: 100, label: '100 visitors' },
  { value: 500, label: '500 visitors' },
  { value: 1000, label: '1,000 visitors' },
  { value: 5000, label: '5,000 visitors' },
  { value: 10000, label: '10,000 visitors' },
];
