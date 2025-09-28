export const GRANULARITY_RANGE_VALUES = ['minute_1', 'minute_15', 'minute_30', 'hour', 'day'] as const;

export type GranularityRangeValues = (typeof GRANULARITY_RANGE_VALUES)[number];

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
    label: '30 min',
    value: 'minute_30',
  },
  {
    label: '15 min',
    value: 'minute_15',
  },
];

export function getAllowedGranularities(startDate: Date, endDate: Date): GranularityRangeValues[] {
  const durationMs = endDate.getTime() - startDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;
  const twoDaysMs = 2 * oneDayMs;
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  const twoHoursMs = 2 * 60 * 60 * 1000;

  if (durationMs >= oneWeekMs) return ['day'];
  if (durationMs <= twoHoursMs) return ['minute_1'];
  if (durationMs <= twelveHoursMs) return ['hour', 'minute_30', 'minute_15'];
  if (durationMs <= twoDaysMs) return ['hour', 'minute_30', 'minute_15'];
  return ['day', 'hour'];
}

export function getValidGranularityFallback(
  currentGranularity: GranularityRangeValues,
  allowedGranularities: GranularityRangeValues[],
): GranularityRangeValues {
  if (allowedGranularities.includes(currentGranularity)) {
    return currentGranularity;
  }

  const fallbackOrder: Record<GranularityRangeValues, GranularityRangeValues[]> = {
    minute_1: ['minute_1', 'minute_15'],
    minute_15: ['minute_15', 'minute_30', 'hour', 'day'],
    minute_30: ['minute_30', 'hour', 'day'],
    hour: ['hour', 'minute_30', 'minute_15', 'day'],
    day: ['day', 'hour', 'minute_30', 'minute_15'],
  };

  const found = fallbackOrder[currentGranularity].find((g) => allowedGranularities.includes(g));
  return found ?? allowedGranularities[0] ?? 'day';
}

export function getMinuteStep(granularity: GranularityRangeValues): 1 | 15 | 30 {
  switch (granularity) {
    case 'minute_1':
      return 1;
    case 'minute_15':
      return 15;
    case 'minute_30':
      return 30;
    default:
      throw new Error(`Invalid granularity: ${granularity}`);
  }
}
