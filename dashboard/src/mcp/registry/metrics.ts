import { safeSql } from '@/lib/safe-sql';

type MetricDefinition = {
  key: string;
  description: string;
  expression: ReturnType<typeof safeSql>;
};

export const METRICS: MetricDefinition[] = [
  {
    key: 'visitors',
    description: 'Unique visitors',
    expression: safeSql`uniq(visitor_id) as visitors`,
  },
  {
    key: 'sessions',
    description: 'Unique sessions',
    expression: safeSql`uniq(session_id) as sessions`,
  },
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
    description: 'Average scroll depth percentage',
    expression: safeSql`avgIf(scroll_depth_percentage, scroll_depth_percentage IS NOT NULL) as avg_scroll_depth`,
  },
];

export const METRIC_KEYS = METRICS.map((m) => m.key);

export function getMetricByKey(key: string): MetricDefinition | undefined {
  return METRICS.find((m) => m.key === key);
}
