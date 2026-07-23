'server-only';

import {
  getUniqueVisitors,
  getActiveUsersCount,
} from '@/repositories/clickhouse/index.repository';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getUniqueVisitorsForSite(siteQuery: BASiteQuery) {
  return getUniqueVisitors(siteQuery);
}

export async function getActiveUsersForSite(siteId: string): Promise<number> {
  return getActiveUsersCount(siteId, 5);
}
