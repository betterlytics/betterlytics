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
