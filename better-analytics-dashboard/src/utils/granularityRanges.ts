export type GranularityRangeValues = 'minute' | 'hour' | 'day';

export interface GranularityRangePreset {
  label: string;
  value: GranularityRangeValues;
}

export const GRANULARITY_RANGE_PRESETS: GranularityRangePreset[] = [
  {
    label: 'Day',
    value: 'day'
  },
  {
    label: 'Hour',
    value: 'hour'
  },
  {
    label: 'Minute',
    value: 'minute'
  }
];
