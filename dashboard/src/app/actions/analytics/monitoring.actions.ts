'use server';

import { MonitorCheckCreateSchema, MonitorCheckUpdateSchema } from '@/entities/analytics/monitoring.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import {
  addMonitorCheck,
  getMonitorCheck,
  getMonitorChecksWithStatus,
  updateMonitorCheck,
} from '@/services/analytics/monitoring.service';
import {
  fetchLatestMonitorTlsResult,
  fetchMonitorDailyUptime,
  fetchMonitorIncidentSegments,
  fetchMonitorMetrics,
  fetchRecentMonitorResults,
} from '@/services/analytics/monitoring.service';
import { toMonitorUptimePresentation } from '@/presenters/toMonitorUptimeDays';
import { normalizeUptimeBuckets } from '@/presenters/toMonitorMetrics';
import { revalidatePath } from 'next/cache';

export const fetchMonitorChecksAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  const now = new Date();
  const checks = await getMonitorChecksWithStatus(ctx.dashboardId, ctx.siteId);
  return checks.map((check) => ({
    ...check,
    uptimeBuckets: normalizeUptimeBuckets(check.uptimeBuckets ?? [], 24, now),
  }));
});

export const fetchMonitorCheckAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await getMonitorCheck(ctx.dashboardId, monitorId),
);

export const createMonitorCheckAction = withDashboardMutationAuthContext(
  async (
    ctx: AuthContext,
    input: { name?: string | null; url: string; intervalSeconds: number; timeoutMs: number; isEnabled?: boolean },
  ) => {
    const payload = MonitorCheckCreateSchema.parse({
      dashboardId: ctx.dashboardId,
      ...input,
    });
    const created = await addMonitorCheck(payload);
    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring`);
    return created;
  },
);

export const updateMonitorCheckAction = withDashboardMutationAuthContext(
  async (
    ctx: AuthContext,
    input: {
      id: string;
      name?: string | null;
      url: string;
      intervalSeconds: number;
      timeoutMs: number;
      isEnabled: boolean;
    },
  ) => {
    const payload = MonitorCheckUpdateSchema.parse({
      dashboardId: ctx.dashboardId,
      ...input,
    });
    const updated = await updateMonitorCheck(payload);
    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring`);
    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring/${input.id}`);
    return updated;
  },
);

export const fetchMonitorMetricsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await fetchMonitorMetrics(monitorId, ctx.siteId),
);

export const fetchRecentMonitorResultsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await fetchRecentMonitorResults(monitorId, ctx.siteId, 10),
);

export const fetchMonitorIncidentsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string, days: number = 7, limit: number = 5) => {
    return await fetchMonitorIncidentSegments(monitorId, ctx.siteId, days, limit);
  },
);

export const fetchLatestMonitorTlsResultAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await fetchLatestMonitorTlsResult(monitorId, ctx.siteId),
);

export const fetchMonitorUptimeAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string, days?: number) => {
    const totalDays = typeof days === 'number' ? days : 180;
    const rows = await fetchMonitorDailyUptime(monitorId, ctx.siteId, totalDays);
    return toMonitorUptimePresentation(rows, totalDays);
  },
);
