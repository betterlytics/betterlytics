import { z } from 'zod';
import { clickhouse } from '@/lib/clickhouse';
import { SQL, safeSql } from '@/lib/safe-sql';
import { BAQuery } from '@/lib/ba-query';
import { DateTimeString } from '@/types/dates';
import { FunnelStep } from '@/entities/funnels';

export async function getFunnelDetails(
  siteId: string,
  funnelSteps: FunnelStep[],
  isStrict: boolean,
  startDate?: DateTimeString,
  endDate?: DateTimeString,
): Promise<number[]> {
  const filters = BAQuery.getFilterQuery(funnelSteps);

  const levelsArray = new Array(filters.length).fill(0).map((_, i) => i + 1);

  const whereConditions = [safeSql`1=1`];

  if (startDate && endDate) {
    whereConditions.push(
      safeSql`timestamp BETWEEN ${SQL.DateTime({ query_start_date: startDate })} AND ${SQL.DateTime({ query_end_date: endDate })}`,
    );
  }

  const windowDurationSeconds = 24 * 60 * 60;
  let funnelWindowFunctionDefinition;

  if (isStrict) {
    funnelWindowFunctionDefinition = safeSql`windowFunnel(${SQL.UInt32({ windowDuration: windowDurationSeconds })}, 'strict_order')`;
  } else {
    funnelWindowFunctionDefinition = safeSql`windowFunnel(${SQL.UInt32({ windowDuration: windowDurationSeconds })})`;
  }

  const sql = safeSql`
    WITH
      baseFunnel AS (
          SELECT
              ${funnelWindowFunctionDefinition}(timestamp, ${SQL.SEPARATOR(filters)}) AS level
          FROM analytics.events
          WHERE
            site_id = ${SQL.String({ siteId })}
            AND ${SQL.AND(whereConditions)} 
          GROUP BY visitor_id
      ),
      funnelCounts AS (
          SELECT
              level,
              count() AS raw_count
          FROM baseFunnel
          GROUP BY level
      ),
      levels AS (
          SELECT arrayJoin(${SQL.UInt32Array({ levels_array: levelsArray })}) AS level
      ),
      joined AS (
          SELECT
              levels.level,
              coalesce(funnelCounts.raw_count, 0) AS count
          FROM levels
          LEFT JOIN funnelCounts USING (level)
      )
    SELECT
        sum(count) OVER (ORDER BY level DESC) AS count
    FROM joined
    ORDER BY level
  `;

  const result = (await clickhouse.query(sql.taggedSql, { params: sql.taggedParams }).toPromise()) as any[];

  return result.map((res) => z.number().parse(res.count));
}
