export type DataRetentionPreset = {
  value: number;
  i18nKey: 'd1' | 'm6' | 'y1' | 'y2' | 'y3' | 'y5';
  fallback: string;
};

export const DATA_RETENTION_PRESETS: DataRetentionPreset[] = [
  { value: 1, i18nKey: 'd1', fallback: '1 day' },
  { value: 180, i18nKey: 'm6', fallback: '6 months' },
  { value: 365, i18nKey: 'y1', fallback: '1 year' },
  { value: 730, i18nKey: 'y2', fallback: '2 years' },
  { value: 1095, i18nKey: 'y3', fallback: '3 years' },
  { value: 1825, i18nKey: 'y5', fallback: '5 years' },
];
