'use server';

import { DailyUniqueVisitorsRow } from "@/entities/visitors";
import { DailyPageViewRow, TotalPageViewsRow } from "@/entities/pageviews";
import { getDeviceTypeBreakdownForSite } from "@/services/devices";
import { getPageViewsForSite, getTopPagesForSite, getTotalPageViewsForSite } from "@/services/pages";
import { getSummaryStatsForSite } from "@/services/visitors";
import { getUniqueVisitorsForSite } from "@/services/visitors";
import { checkAuth } from "@/lib/auth-actions";
import { GranularityRangeValues } from "@/utils/granularityRanges";

export async function fetchTotalPageViewsAction(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues): Promise<TotalPageViewsRow[]> {
  await checkAuth();
  return getTotalPageViewsForSite(siteId, startDate, endDate, granularity);
}

export async function fetchPageViewsAction(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues): Promise<DailyPageViewRow[]> {
  await checkAuth();
  return getPageViewsForSite(siteId, startDate, endDate, granularity);
}

export async function fetchUniqueVisitorsAction(siteId: string, startDate: Date, endDate: Date, granularity: GranularityRangeValues): Promise<DailyUniqueVisitorsRow[]> {
  await checkAuth();
  return getUniqueVisitorsForSite(siteId, startDate, endDate, granularity);
}

export async function fetchSummaryStatsAction(siteId: string, startDate: Date, endDate: Date) {
  await checkAuth();
  return getSummaryStatsForSite(siteId, startDate, endDate);
}

export async function fetchTopPagesAction(siteId: string, startDate: Date, endDate: Date, limit: number) {
  await checkAuth();
  return getTopPagesForSite(siteId, startDate, endDate, limit);
}

export async function fetchDeviceTypeBreakdownAction(siteId: string, startDate: Date, endDate: Date) {
  await checkAuth();
  return getDeviceTypeBreakdownForSite(siteId, startDate, endDate);
}
  
