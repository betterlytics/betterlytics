'use server';

import { getDeviceTypeBreakdownForSite, getBrowserBreakdownForSite, getDeviceSummaryForSite, getOperatingSystemBreakdownForSite, getDeviceUsageTrendForSite } from "@/services/devices";
import { DeviceType, BrowserStats, DeviceSummary, OperatingSystemStats, DeviceUsageTrendRow } from "@/entities/devices";
import { checkAuth } from "@/lib/auth-actions";
import { GranularityRangeValues } from "@/utils/granularityRanges";

export async function fetchDeviceTypeBreakdownAction(siteId: string, startDate: Date, endDate: Date): Promise<DeviceType[]> {
  await checkAuth();
  return getDeviceTypeBreakdownForSite(siteId, startDate, endDate);
}

export async function fetchDeviceSummaryAction(siteId: string, startDate: Date, endDate: Date): Promise<DeviceSummary> {
  await checkAuth();
  return getDeviceSummaryForSite(siteId, startDate, endDate);
}

export async function fetchBrowserBreakdownAction(siteId: string, startDate: Date, endDate: Date): Promise<BrowserStats[]> {
  await checkAuth();
  return getBrowserBreakdownForSite(siteId, startDate, endDate);
}

export async function fetchOperatingSystemBreakdownAction(siteId: string, startDate: Date, endDate: Date): Promise<OperatingSystemStats[]> {
  await checkAuth();
  return getOperatingSystemBreakdownForSite(siteId, startDate, endDate);
}

export async function fetchDeviceUsageTrendAction(
  siteId: string, 
  startDate: Date, 
  endDate: Date,
  granularity: GranularityRangeValues
): Promise<DeviceUsageTrendRow[]> {
  await checkAuth();
  return getDeviceUsageTrendForSite(siteId, startDate, endDate, granularity);
} 
