'use server';

import { MonitorCheckCreateSchema, MonitorCheckUpdateSchema } from '@/entities/analytics/monitoring.entities';
import { withDashboardAuthContext, withDashboardMutationAuthContext, getCachedSession } from '@/auth/auth-actions';
import { type AuthContext } from '@/entities/auth/authContext.entities';
import { getTranslations } from 'next-intl/server';
import {
  addMonitorCheck,
  getMonitorCheck,
  getMonitorChecksWithStatus,
  updateMonitorCheck,
  deleteMonitorCheck,
  checkMonitorUrlExists,
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
import z from 'zod';

export const fetchMonitorChecksAction = withDashboardAuthContext(async (ctx: AuthContext, timezone: string) => {
  return await getMonitorChecksWithStatus(ctx.dashboardId, ctx.siteId, timezone);
});

export const fetchMonitorCheckAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await getMonitorCheck(ctx.dashboardId, monitorId),
);

export const createMonitorCheckAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof MonitorCheckCreateSchema>) => {
    const t = await getTranslations('validation');
    const payload = MonitorCheckCreateSchema.parse(input);

    const dashboard = await findDashboardById(ctx.dashboardId);

    if (!isUrlOnDomain(payload.url, dashboard.domain)) {
      throw new UserException(t('urlMustBeOnDomain', { domain: dashboard.domain }));
    }

    const alreadyExists = await checkMonitorUrlExists(ctx.dashboardId, payload.url);
    if (alreadyExists) {
      throw new UserException(t('monitorAlreadyExists'));
    }

    const created = await addMonitorCheck(ctx.dashboardId, {
      ...payload,
      alertEmails: [(await getCachedSession())!.user.email],
    });

    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring`);
    return created;
  },
);

export const updateMonitorCheckAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, input: z.input<typeof MonitorCheckUpdateSchema>) => {
    const payload = MonitorCheckUpdateSchema.parse(input);

    const updated = await updateMonitorCheck(ctx.dashboardId, payload);

    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring`);
    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring/${payload.id}`);

    return updated;
  },
);

export const deleteMonitorCheckAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, monitorId: string) => {
    await deleteMonitorCheck(ctx.dashboardId, monitorId);
    revalidatePath(`/dashboard/${ctx.dashboardId}/monitoring`);
  },
);

export const fetchMonitorMetricsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string, timezone: string) =>
    await fetchMonitorMetrics(ctx.dashboardId, monitorId, ctx.siteId, timezone),
);

export const fetchRecentMonitorResultsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string, errorsOnly: boolean) =>
    await fetchRecentMonitorResults(monitorId, ctx.siteId, 10, errorsOnly),
);

export const fetchMonitorIncidentsAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => {
    return await fetchMonitorIncidentSegments(monitorId, ctx.siteId);
  },
);

export const fetchLatestMonitorTlsResultAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string) => await fetchLatestMonitorTlsResult(monitorId, ctx.siteId),
);

export const fetchMonitorUptimeAction = withDashboardAuthContext(
  async (ctx: AuthContext, monitorId: string, timezone: string, days?: number) => {
    const totalDays = typeof days === 'number' ? days : 180;
    const rows = await fetchMonitorDailyUptime(monitorId, ctx.dashboardId, ctx.siteId, timezone, totalDays);
    return toMonitorUptimePresentation(rows, totalDays);
  },
);
