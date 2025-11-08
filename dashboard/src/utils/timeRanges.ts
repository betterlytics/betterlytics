export const TIME_RANGE_VALUES = [
  // fast/short ranges
  'realtime',
  'today',
  'yesterday',
  '1h',
  // week-ish ranges
  '24h',
  '7d',
  '28d',
  '90d',
  // month/quarter/half/year ranges
  'mtd',
  'last_month',
  'ytd',
  '1y',
  'custom',
] as const;
export type TimeRangeValue = (typeof TIME_RANGE_VALUES)[number];

export interface TimeRangePreset {
  label: string;
  value: TimeRangeValue;
}

export const TIME_RANGE_PRESETS: TimeRangePreset[] = [
  // Short ranges
  {
    label: 'Realtime',
    value: 'realtime',
  },
  {
    label: 'Today',
    value: 'today',
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
  },
  {
    label: 'Past Hour',
    value: '1h',
  },
  {
    label: 'Past 24 Hours',
    value: '24h',
  },
  {
    label: 'Last 7 Days',
    value: '7d',
  },
  {
    label: 'Last 28 Days',
    value: '28d',
  },
  {
    label: 'Last 90 days',
    value: '90d',
  },
  // Month/Quarter/Year collections
  {
    label: 'Month to Date',
    value: 'mtd',
  },
  {
    label: 'Last Month',
    value: 'last_month',
  },
  {
    label: 'Year to Date',
    value: 'ytd',
  },
  {
    label: 'Past Year',
    value: '1y',
  },
];
