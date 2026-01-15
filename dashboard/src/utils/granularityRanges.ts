export const GRANULARITY_RANGE_VALUES = [
  'minute_1',
  'minute_15',
  'minute_30',
  'hour',
  'day',
  'week',
  'month',
] as const;

export type GranularityRangeValues = (typeof GRANULARITY_RANGE_VALUES)[number];

export interface GranularityRangePreset {
  label: string;
  value: GranularityRangeValues;
}

export const GRANULARITY_RANGE_PRESETS: GranularityRangePreset[] = [
  {
    label: 'Month',
    value: 'month',
  },
  {
    label: 'Week',
    value: 'week',
  },
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
  const twoHoursMs = 2 * 60 * 60 * 1000;
  const twelveHoursMs = 12 * 60 * 60 * 1000;
  const twoDaysMs = 2 * oneDayMs;
  const oneWeekMs = 7.5 * oneDayMs;
  const fourWeeksMs = 27 * oneDayMs;
  const sixMonthsMs = 180 * oneDayMs;

  if (durationMs >= sixMonthsMs) return ['month', 'week', 'day'];
  if (durationMs >= fourWeeksMs) return ['week', 'day'];
  if (durationMs >= oneWeekMs) return ['day'];
  if (durationMs <= twoHoursMs) return ['minute_1'];
  if (durationMs <= twelveHoursMs) return ['hour', 'minute_30', 'minute_15'];
  if (durationMs <= twoDaysMs) return ['hour', 'minute_30', 'minute_15'];
  return ['day', 'hour'];
}

export function getVisibleGranularities(startDate: Date, endDate: Date): GranularityRangeValues[] {
  const durationMs = endDate.getTime() - startDate.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const twoDaysMs = 2 * oneDayMs;
  const oneWeekMs = 7.5 * oneDayMs;

  if (durationMs > oneWeekMs) {
    return ['hour', 'day', 'week', 'month'];
  }

  if (durationMs > twoDaysMs) {
    return ['minute_30', 'hour', 'day', 'week'];
  }

  return ['minute_15', 'minute_30', 'hour', 'day'];
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
    minute_15: ['minute_15', 'minute_30', 'hour', 'day', 'week', 'month'],
    minute_30: ['minute_30', 'hour', 'day', 'week', 'month'],
    hour: ['hour', 'minute_30', 'minute_15', 'day', 'week', 'month'],
    day: ['day', 'hour', 'week', 'month', 'minute_30', 'minute_15'],
    week: ['week', 'day', 'month', 'hour'],
    month: ['month', 'week', 'day'],
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
