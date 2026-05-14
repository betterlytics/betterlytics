import { safeSql } from '@/lib/safe-sql';

export const METRIC_KEYS = [
  'visitors',
  'sessions',
  'pageviews',
  'custom_events',
  'outbound_clicks',
  'avg_scroll_depth',
  'avg_time_on_page',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

type MetricDefinition = {
  key: MetricKey;
  description: string;
  expression: ReturnType<typeof safeSql>;
};

export const METRICS = [
  { key: 'visitors', description: 'Unique visitors', expression: safeSql`uniq(visitor_id) as visitors` },
  { key: 'sessions', description: 'Unique sessions', expression: safeSql`uniq(session_id) as sessions` },
  {
    key: 'pageviews',
    description: 'Total page views',
    expression: safeSql`countIf(event_type = 'pageview') as pageviews`,
  },
  {
    key: 'custom_events',
    description: 'Custom event count',
    expression: safeSql`countIf(event_type = 'custom') as custom_events`,
  },
  {
    key: 'outbound_clicks',
    description: 'Outbound link clicks',
    expression: safeSql`countIf(event_type = 'outbound_link') as outbound_clicks`,
  },
  {
    key: 'avg_scroll_depth',
    description:
      'Average scroll depth percentage. Computed as the per-session max scroll, averaged within each grouping. Group by url to match the dashboard per-page metric.',
    expression: safeSql`arrayAvg(maxMapIf([session_id], [toFloat64(scroll_depth_percentage)], event_type = 'engagement' AND scroll_depth_percentage IS NOT NULL).2) as avg_scroll_depth`,
  },
  {
    key: 'avg_time_on_page',
    description:
      'Average time spent in seconds. Computed as the per-session sum of active engagement time, averaged within each grouping. Group by url to match the dashboard per-page metric.',
    expression: safeSql`arrayAvg(arrayFilter(x -> x > 0, sumMapIf([session_id], [toFloat64(page_duration_seconds)], event_type = 'engagement' AND page_duration_seconds > 0).2)) as avg_time_on_page`,
  },
] satisfies MetricDefinition[];

export function getMetricByKey(key: string): MetricDefinition | undefined {
  return METRICS.find((m) => m.key === key);
}
