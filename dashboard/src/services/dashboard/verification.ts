"server-only";

import { hasAnalyticsData } from "@/repositories/clickhouse/verification";

export async function checkTrackingDataExists(siteId: string): Promise<boolean> {
  try {
    return await hasAnalyticsData(siteId);
  } catch (error) {
    console.error('Error checking tracking data existence:', error);
    return false;
  }
} 