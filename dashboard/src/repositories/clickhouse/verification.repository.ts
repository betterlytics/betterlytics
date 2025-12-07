import { clickhouse } from "@/lib/clickhouse";
import { safeSql } from "@/lib/safe-sql";

export async function hasAnalyticsData(siteId: string): Promise<boolean> {
  try {
    const query = safeSql`
      SELECT 1
      FROM analytics.events 
      WHERE site_id = {site_id:String}
      LIMIT 1
    `;

    const result = await clickhouse.query(query.taggedSql, {
      params: {
        ...query.taggedParams,
        site_id: siteId,
      },
    }).toPromise();
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking analytics data existence:', error);
    return false;
  }
} 