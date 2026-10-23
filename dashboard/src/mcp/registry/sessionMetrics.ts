import { safeSql, type SQLTaggedExpression } from '@/lib/safe-sql';
import { SessionMetricSql } from '@/lib/session-metrics-sql';
import type { SessionsTableSelectableColumn } from '@/lib/ba-session-query';

export const SESSION_METRIC_KEYS = [
  'sessions',
  'visitors',
  'pageviews',
  'bounce_rate',
  'avg_visit_duration',
  'pages_per_session',
] as const;
export type SessionMetricKey = (typeof SESSION_METRIC_KEYS)[number];

type SessionMetricDefinition = {
  key: SessionMetricKey;
  unit: string;
  description: string;
  /** Session columns the expression reads. */
  columns: SessionsTableSelectableColumn[];
  expression: SQLTaggedExpression;
  /** Overrides `expression` in time series, for metrics that are not simply re-aggregated per bucket. */
  timeSeriesExpression?: SQLTaggedExpression;
};

export const SESSION_METRICS = [
  {
    key: 'sessions',
    unit: 'count',
    description: 'Sessions that started in the range.',
    columns: [],
    expression: safeSql`${SessionMetricSql.sessions} AS sessions`,
  },
  {
    key: 'visitors',
    unit: 'count',
    description:
      'Unique visitors with at least one selected session. In a time series each visitor counts only in the bucket of their first session, so the buckets add up to the total, like the Overview chart.',
    columns: ['visitor_id'],
    expression: safeSql`uniq(visitor_id) AS visitors`,
    // first_session_created_at is added by the session builder's window over each visitor (and group).
    timeSeriesExpression: safeSql`uniqIf(visitor_id, session_created_at = first_session_created_at) AS visitors`,
  },
  {
    key: 'pageviews',
    unit: 'count',
    description:
      'Every pageview of the selected sessions, including pageviews after the range end, so it can differ slightly from the Overview Pageviews card at the edges of the range.',
    columns: ['pageview_count'],
    expression: safeSql`${SessionMetricSql.pageviews} AS pageviews`,
  },
  {
    key: 'bounce_rate',
    unit: 'percent (0 to 100, one decimal)',
    description: 'Share of sessions with at most one pageview.',
    columns: ['pageview_count'],
    expression: safeSql`round(${SessionMetricSql.bounceRate}, 1) AS bounce_rate`,
  },
  {
    key: 'avg_visit_duration',
    unit: 'seconds (whole)',
    description:
      'Average visit duration as on the Overview card: the total time of the selected sessions divided by the number of sessions with more than one pageview. 0 when every session bounced.',
    columns: ['session_start', 'session_end', 'pageview_count'],
    expression: safeSql`round(${SessionMetricSql.avgVisitDuration}) AS avg_visit_duration`,
  },
  {
    key: 'pages_per_session',
    unit: 'pageviews per session (one decimal)',
    description: 'Pageviews divided by sessions.',
    columns: ['pageview_count'],
    expression: safeSql`round(${SessionMetricSql.pagesPerSession}, 1) AS pages_per_session`,
  },
] satisfies SessionMetricDefinition[];

export function getSessionMetricByKey(key: string): SessionMetricDefinition | undefined {
  return SESSION_METRICS.find((m) => m.key === key);
}
