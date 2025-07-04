export type GranularityRangeValues = 'minute' | 'hour' | 'day';

export interface GranularityRangePreset {
  label: string;
  value: GranularityRangeValues;
}

export const GRANULARITY_RANGE_PRESETS: GranularityRangePreset[] = [
  {
    label: 'Day',
    value: 'day',
  },
  {
    label: 'Hour',
    value: 'hour',
  },
  {
    label: 'Minute',
    value: 'minute',
  },
];

export function getAllowedGranularities(startDate: Date, endDate: Date): GranularityRangeValues[] {
  const durationMs = endDate.getTime() - startDate.getTime();
  const oneDayMs = 48 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  if (durationMs >= oneWeekMs) return ['day'];
  if (durationMs <= oneDayMs) return ['hour', 'minute'];
  return ['day', 'hour'];
}

export function getValidGranularityFallback(
  currentGranularity: GranularityRangeValues,
  allowedGranularities: GranularityRangeValues[],
): GranularityRangeValues {
  if (allowedGranularities.includes(currentGranularity)) {
    return currentGranularity;
  }

  if (currentGranularity === 'minute') {
    return allowedGranularities.includes('hour') ? 'hour' : 'day';
  }

  if (currentGranularity === 'day') {
    return allowedGranularities.includes('hour') ? 'hour' : 'minute';
  }

  return 'day';
}
