'use server';

import {
  MonitorCheckCreateSchema,
  MonitorCheckUpdateSchema,
  StatusCodeValue,
  type HttpMethod,
  type RequestHeader,
} from '@/entities/analytics/monitoring.entities';
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
import { revalidatePath } from 'next/cache';
import { findDashboardById } from '@/repositories/postgres/dashboard.repository';
import { isUrlOnDomain } from '@/utils/domainValidation';
import { UserException } from '@/lib/exceptions';

export const fetchMonitorChecksAction = withDashboardAuthContext(async (ctx: AuthContext) => {
  return await getMonitorChecksWithStatus(ctx.dashboardId, ctx.siteId);
});

export const fetchMonitorCheckAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await getMonitorCheck(ctx.dashboardId, monitorId),
);

export const createMonitorCheckAction = withDashboardMutationAuthContext(
  async (
    ctx: AuthContext,
    input: {
      name?: string | null;
      url: string;
      intervalSeconds: number;
      timeoutMs: number;
      isEnabled?: boolean;
      failureThreshold?: number;
    },
  ) => {
    const dashboard = await findDashboardById(ctx.dashboardId);
    if (!isUrlOnDomain(input.url, dashboard.domain)) {
      throw new UserException(`URL must be on ${dashboard.domain} or a subdomain`);
    }

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
      checkSslErrors: boolean;
      sslExpiryReminders: boolean;
      httpMethod: HttpMethod;
      requestHeaders: RequestHeader[] | null;
      acceptedStatusCodes: StatusCodeValue[];
      // Alert configuration
      alertsEnabled: boolean;
      alertEmails: string[];
      alertOnDown: boolean;
      alertOnRecovery: boolean;
      alertOnSslExpiry: boolean;
      sslExpiryAlertDays: number;
      failureThreshold: number;
    },
  ) => {
    // Validate URL belongs to dashboard's domain
    const dashboard = await findDashboardById(ctx.dashboardId);
    if (!isUrlOnDomain(input.url, dashboard.domain)) {
      throw new UserException(`URL must be on ${dashboard.domain} or a subdomain`);
    }

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
  async (ctx: AuthContext, monitorId: string) => await fetchMonitorMetrics(ctx.dashboardId, monitorId, ctx.siteId),
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
