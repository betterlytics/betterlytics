import { FilterQueryParams, FilterQueryParamsSchema, FilterQuerySearchParams } from '@/entities/filterQueryParams';
import { getResolvedRanges } from '@/lib/ba-timerange';
import moment from 'moment-timezone';
import { stableStringify } from '@/utils/stableStringify';

const ENCODE_ORDER: Array<keyof FilterQueryParams> = [
  'startDate',
  'endDate',
  'interval',
  'offset',
  'granularity',
  'compare',
  'compareStartDate',
  'compareEndDate',
  'compareAlignWeekdays',
  'queryFilters',
  'userJourney',
];

function getDefaultFilters(): FilterQueryParams {
  const granularity = 'hour';

  const now = new Date();
  const range = getResolvedRanges('24h', 'previous', 'Etc/UTC', now, now, 'hour', undefined, undefined, 0, false);

  return {
    queryFilters: [],
    startDate: range.main.start,
    endDate: range.main.end,
    granularity,
    interval: '24h',
    compare: 'previous',
    compareAlignWeekdays: false,
    userJourney: {
      numberOfSteps: 3,
      numberOfJourneys: 5,
    },
    compareStartDate: range.compare?.start,
    compareEndDate: range.compare?.end,
    offset: 0,
  };
}

function filterVariable(key: string, value: unknown) {
  const defaultFilters = getDefaultFilters();

  // Check if filters are actual filters
  if (key in defaultFilters === false) {
    return false;
  }

  // Don't filter dates
  if (value instanceof Date) {
    return true;
  }

  // Check if filters are required or if they already match the default filters
  if (
    key in defaultFilters &&
    stableStringify(value) === stableStringify(defaultFilters[key as keyof FilterQueryParams])
  ) {
    return false;
  }

  // Filter non-value values
  if (value === undefined || value === null) {
    return false;
  }

  // Filter empty objects (except dates)
  if (typeof value === 'object') {
    return Object.keys(value).length !== 0;
  }

  // Keep remaining
  return true;
}

// Util for encoding date
function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based so add 1
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Encode filter values
function encodeValue<Key extends keyof FilterQueryParams>(key: Key, value: unknown): string {
  switch (key) {
    case 'startDate':
    case 'endDate':
    case 'compareStartDate':
    case 'compareEndDate':
      return formatLocalDate(value as Date);
    case 'queryFilters':
    case 'userJourney':
      return stableStringify(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'offset':
      return (value as number).toString();
    case 'compare':
      return value as FilterQueryParams['compare'];
    case 'compareAlignWeekdays':
      return (value as boolean) ? '1' : '0';
  }

  throw new Error(`Unknown filter key "${key}"`);
}

function encode(params: FilterQueryParams) {
  return ENCODE_ORDER.filter((key) => filterVariable(key, params[key])).map((key) => [
    key,
    encodeValue(key, params[key]),
  ]);
}

function decodeValue<Key extends keyof FilterQueryParams>(
  key: Key,
  value: string,
  timezone: string,
): FilterQueryParams[keyof FilterQueryParams] {
  switch (key) {
    case 'startDate':
    case 'endDate':
    case 'compareStartDate':
    case 'compareEndDate':
      return moment.tz(value, timezone).toDate();
    case 'queryFilters':
    case 'userJourney':
      return JSON.parse(value);
    case 'granularity':
      return value as FilterQueryParams['granularity'];
    case 'interval':
      return value as FilterQueryParams['interval'];
    case 'offset':
      return Number(value);
    case 'compare':
      return value as FilterQueryParams['compare'];
    case 'compareAlignWeekdays':
      return value === '1' || value === 'true';
  }

  throw new Error(`Unknown filter key "${key}"`);
}

function enforceGranularityAndDuration(
  timezone: string,
  {
    interval,
    compare,
    startDate,
    endDate,
    granularity,
    compareStartDate,
    compareEndDate,
    offset,
    compareAlignWeekdays,
  }: {
    interval: FilterQueryParams['interval'];
    compare: FilterQueryParams['compare'];
    startDate: Date;
    endDate: Date;
    granularity: FilterQueryParams['granularity'];
    compareStartDate?: Date;
    compareEndDate?: Date;
    offset?: number;
    compareAlignWeekdays?: boolean;
  },
) {
  const ranges = getResolvedRanges(
    interval,
    compare,
    timezone,
    startDate,
    endDate,
    granularity,
    compareStartDate,
    compareEndDate,
    offset,
    compareAlignWeekdays,
  );

  return {
    main: ranges.main,
    compare: ranges.compare,
    startDate: ranges.main.start,
    endDate: ranges.main.end,
    granularity: ranges.granularity,
  } as const;
}

function decode(params: FilterQuerySearchParams, timezone: string) {
  const defaultFilters = getDefaultFilters();

  const decodedEntries = Object.entries(params)
    .filter(([key]) => key in defaultFilters)
    .map(([key, value]) => [key, decodeValue(key as keyof FilterQueryParams, value, timezone)]);

  const decoded = Object.fromEntries(decodedEntries) as Partial<FilterQueryParams>;

  const filters = {
    ...defaultFilters,
    ...decoded,
  };

  const enforced = enforceGranularityAndDuration(timezone, {
    interval: filters.interval,
    compare: filters.compare,
    startDate: filters.startDate,
    endDate: filters.endDate,
    granularity: filters.granularity,
    compareStartDate: filters.compareStartDate,
    compareEndDate: filters.compareEndDate,
    offset: filters.offset,
    compareAlignWeekdays: filters.compareAlignWeekdays,
  });

  filters.startDate = enforced.startDate;
  filters.endDate = enforced.endDate;
  filters.granularity = enforced.granularity;

  filters.compareStartDate = enforced.compare?.start;
  filters.compareEndDate = enforced.compare?.end;

  return FilterQueryParamsSchema.parse(filters);
}

export const BAFilterSearchParams = {
  getDefaultFilters,
  encode,
  decode,
};
