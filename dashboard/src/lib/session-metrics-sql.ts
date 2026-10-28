import { safeSql } from './safe-sql';

const sessions = safeSql`count()`;
const sessionsWithMultiplePageViews = safeSql`countIf(pageview_count > 1)`;
const pageviews = safeSql`sum(pageview_count)`;
const totalDuration = safeSql`sum(dateDiff('second', session_start, session_end))`;

/**
 * Session metric formulas over analytics.sessions rows, unrounded. Shared by the Overview and the
 * MCP query_sessions tool so the two cannot drift. A bounce is a session with at most one pageview,
 * and average visit duration divides by the sessions with more than one pageview.
 */
export const SessionMetricSql = {
  sessions,
  pageviews,
  bounceRate: safeSql`if(${sessions} > 0, 100 * (${sessions} - ${sessionsWithMultiplePageViews}) / ${sessions}, 0)`,
  avgVisitDuration: safeSql`if(${sessionsWithMultiplePageViews} > 0, ${totalDuration} / ${sessionsWithMultiplePageViews}, 0)`,
  pagesPerSession: safeSql`if(${sessions} > 0, ${pageviews} / ${sessions}, 0)`,
} as const;
