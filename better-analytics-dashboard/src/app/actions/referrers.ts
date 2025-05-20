'use server';

import { getReferrerSourceAggregationDataForSite, getReferrerSummaryDataForSite, getReferrerTableDataForSite, getReferrerTrafficTrendBySourceDataForSite } from '@/services/referrers';
import { GranularityRangeValues } from '@/utils/granularityRanges';
import { checkAuth } from '@/lib/auth-actions';

/**
 * Fetches the referrer distribution data for a site
 */
export async function fetchReferrerSourceAggregationDataForSite(siteId: string, startDate: Date, endDate: Date) {
  await checkAuth();

  try {
    const data = await getReferrerSourceAggregationDataForSite(siteId, startDate, endDate);
    return { data };
  } catch (error) {
    console.error('Error fetching referrer distribution:', error);
    throw error;
  }
} 

/**
 * Fetches the referrer traffic trend data grouped by source type for a site with specified granularity
 */
export async function fetchReferrerTrafficTrendBySourceDataForSite(
  siteId: string, 
  startDate: Date, 
  endDate: Date,
  granularity: GranularityRangeValues
) {
  await checkAuth();

  try {
    const data = await getReferrerTrafficTrendBySourceDataForSite(siteId, startDate, endDate, granularity);
    return { data };
  } catch (error) {
    console.error('Error fetching referrer traffic trend by source:', error);
    throw error;
  }
} 

/**
 * Fetches the summary data for referrers including total count, traffic and bounce rate
 */
export async function fetchReferrerSummaryDataForSite(siteId: string, startDate: Date, endDate: Date) {
  await checkAuth();

  try {
    const data = await getReferrerSummaryDataForSite(siteId, startDate, endDate);
    return { data };
  } catch (error) {
    console.error('Error fetching referrer summary data:', error);
    throw error;
  }
} 

/**
 * Fetches detailed referrer data for table display
 */
export async function fetchReferrerTableDataForSite(siteId: string, startDate: Date, endDate: Date, limit = 100) {
  await checkAuth();
  
  try {
    const data = await getReferrerTableDataForSite(siteId, startDate, endDate, limit);
    return { data };
  } catch (error) {
    console.error('Error fetching referrer table data:', error);
    throw error;
  }
} 