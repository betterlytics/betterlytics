import { clickhouse } from '@/lib/clickhouse';
import { z } from 'zod';

import { SQL, safeSql } from '@/lib/safe-sql';

export async function getFunnelDetails(siteId: string, pages: string[]): Promise<number[]> {

  const urlPagesEqualityChecks = pages
    .map((page, index) => SQL.String({ [`page_${index}`]: page }))
    .map((page) => safeSql`url = ${page}`);

  const levelsArray = new Array(pages.length).fill(0).map((_, i) => i+1);

  const sql = safeSql`
    WITH
      -- Base pages funnel results
      baseFunnel AS (
          SELECT
              windowFunnel(24*60*60)(
                  timestamp,
                  ${SQL.SEPARATOR(urlPagesEqualityChecks)}
              ) AS level
          FROM analytics.events
          WHERE site_id = ${SQL.String({siteId})}
          GROUP BY visitor_id
      ),
      -- Aggregate by level
      funnelCounts AS (
          SELECT
              level,
              count() AS raw_count
          FROM baseFunnel
          GROUP BY level
      ),
      -- Static funnel levels
      levels AS (
          SELECT arrayJoin(${SQL.UInt32Array({ levelsArray })}) AS level
      ),
      -- Left join counts with all levels
      joined AS (
          SELECT
              levels.level,
              coalesce(funnelCounts.raw_count, 0) AS count
          FROM levels
          LEFT JOIN funnelCounts USING (level)
      )
    -- Cumulative aggregation on joined data
    SELECT
        sum(count) OVER (ORDER BY level DESC) AS count
    FROM joined
    ORDER BY level
  `;

  const result = await clickhouse.query(
    sql.taggedSql,
    { params: sql.taggedParams }
  ).toPromise() as any[];

  return result.map((res) => z.number().parse(res.count));
}

