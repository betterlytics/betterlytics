import { clickhouse } from '@/lib/clickhouse';
import { SequentialPath, SequentialPathSchema } from '@/entities/userJourney';
import { DateTimeString } from '@/types/dates';

/**
 * Gets complete sequential path data for sessions
 * This returns full paths like Home→Products→Cart grouped by frequency
 */
export async function getUserSequentialPaths(
  siteId: string,
  startDate: DateTimeString,
  endDate: DateTimeString,
  maxPathLength: number = 3,
  limit: number = 25
): Promise<SequentialPath[]> {
  const query = `
  WITH ordered_events AS (
    SELECT
      session_id,
      groupArray((timestamp, url)) AS page_tuples
    FROM analytics.events
    WHERE
      site_id = {site_id:String}
      AND timestamp BETWEEN {start:DateTime} AND {end:DateTime}
      AND url != ''
      AND event_type = 'pageview'
    GROUP BY session_id
  ),
  session_paths AS (
    SELECT
      session_id,
      arrayMap(x -> x.2, arraySlice(arraySort(x -> x.1, page_tuples), 1, {max_length:UInt8})) AS path
    FROM ordered_events
    HAVING length(path) > 1
  )
  SELECT
    path,
    COUNT(*) AS count
  FROM session_paths
  GROUP BY path
  ORDER BY count DESC
  LIMIT {limit:UInt32}
  `;

  const result = await clickhouse.query(query, {
    params: {
      site_id: siteId,
      start: startDate,
      end: endDate,
      max_length: maxPathLength,
      limit: limit
    },
  }).toPromise() as Array<{path: string[], count: number}>;
  
  return result.map(path => SequentialPathSchema.parse(path));
} 