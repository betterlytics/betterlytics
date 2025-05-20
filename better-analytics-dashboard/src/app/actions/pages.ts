'use server';

import { getPageAnalytics, getPageDetail, getPageTrafficForTimePeriod } from "@/services/pages";
import { PageAnalytics } from "@/entities/pages";
import { checkAuth } from "@/lib/auth-actions";
import { TotalPageViewsRow } from "@/entities/pageviews";
import { GranularityRangeValues } from "@/utils/granularityRanges";

export async function fetchPageAnalyticsAction(siteId: string, startDate: Date, endDate: Date): Promise<PageAnalytics[]> {
  await checkAuth();
  return getPageAnalytics(siteId, startDate, endDate);
}

export async function fetchPageDetailAction(siteId: string, path: string, startDate: Date, endDate: Date): Promise<PageAnalytics | null> {
  await checkAuth();
  return getPageDetail(siteId, path, startDate, endDate);
}

export async function fetchPageTrafficTimeSeriesAction(
  siteId: string,
  path: string,
  startDate: Date,
  endDate: Date,
  granularity: GranularityRangeValues
): Promise<TotalPageViewsRow[]> {
  await checkAuth();
  return getPageTrafficForTimePeriod(siteId, path, startDate, endDate, granularity);
} 