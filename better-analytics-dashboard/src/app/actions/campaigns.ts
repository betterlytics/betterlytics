"use server";

import {
  fetchCampaignPerformance,
  fetchCampaignSourceBreakdown,
  fetchCampaignVisitorTrend,
  fetchCampaignMediumBreakdown,
  fetchCampaignContentBreakdown,
  fetchCampaignTermBreakdown,
  fetchCampaignLandingPagePerformance,
} from "@/services/campaign";
import {
  CampaignPerformance,
  CampaignSourceBreakdownItem,
  PivotedCampaignVisitorTrendItem,
  CampaignMediumBreakdownItem,
  CampaignContentBreakdownItem,
  CampaignTermBreakdownItem,
  CampaignLandingPagePerformanceItem,
} from "@/entities/campaign";
import { checkAuth } from "@/lib/auth-actions";

export async function fetchCampaignPerformanceAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignPerformance[]> {
  await checkAuth();

  try {
    const performanceData = await fetchCampaignPerformance(
      siteId,
      startDate,
      endDate
    );
    return performanceData;
  } catch (error) {
    console.error("Error in fetchCampaignPerformanceAction:", error);
    return [];
  }
}

export async function fetchCampaignSourceBreakdownAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignSourceBreakdownItem[]> {
  await checkAuth();

  try {
    const breakdownData = await fetchCampaignSourceBreakdown(
      siteId,
      startDate,
      endDate
    );
    return breakdownData;
  } catch (error) {
    console.error("Error in fetchCampaignSourceBreakdownAction:", error);
    return [];
  }
}

export async function fetchCampaignMediumBreakdownAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignMediumBreakdownItem[]> {
  await checkAuth();

  try {
    const breakdownData = await fetchCampaignMediumBreakdown(
      siteId,
      startDate,
      endDate
    );
    return breakdownData;
  } catch (error) {
    console.error("Error in fetchCampaignMediumBreakdownAction:", error);
    return [];
  }
}

export async function fetchCampaignContentBreakdownAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignContentBreakdownItem[]> {
  await checkAuth();

  try {
    const breakdownData = await fetchCampaignContentBreakdown(
      siteId,
      startDate,
      endDate
    );
    return breakdownData;
  } catch (error) {
    console.error("Error in fetchCampaignContentBreakdownAction:", error);
    return [];
  }
}

export async function fetchCampaignTermBreakdownAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignTermBreakdownItem[]> {
  await checkAuth();

  try {
    const breakdownData = await fetchCampaignTermBreakdown(
      siteId,
      startDate,
      endDate
    );
    return breakdownData;
  } catch (error) {
    console.error("Error in fetchCampaignTermBreakdownAction:", error);
    return [];
  }
}

export async function fetchCampaignLandingPagePerformanceAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<CampaignLandingPagePerformanceItem[]> {
  await checkAuth();

  try {
    const performanceData = await fetchCampaignLandingPagePerformance(
      siteId,
      startDate,
      endDate
    );
    return performanceData;
  } catch (error) {
    console.error("Error in fetchCampaignLandingPagePerformanceAction:", error);
    return [];
  }
}

export async function fetchCampaignVisitorTrendAction(
  siteId: string,
  startDate: Date,
  endDate: Date
): Promise<PivotedCampaignVisitorTrendItem[]> {
  await checkAuth();
  try {
    return await fetchCampaignVisitorTrend(siteId, startDate, endDate);
  } catch (error) {
    console.error("Error in fetchCampaignVisitorTrendAction:", error);
    return [];
  }
} 