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
  countMonitorChecks,
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
import { getCapabilities, requireCapability } from '@/lib/billing/capabilityAccess';
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

    const caps = await getCapabilities();

    const currentMonitorCount = await countMonitorChecks(ctx.dashboardId);
    requireCapability(currentMonitorCount < caps.monitoring.maxMonitors, t('capabilities.monitorLimit'));

    requireCapability(
      payload.intervalSeconds >= caps.monitoring.minIntervalSeconds,
      t('capabilities.minInterval'),
    );

    if (payload.httpMethod !== undefined && payload.httpMethod !== 'HEAD') {
      requireCapability(caps.monitoring.httpMethodConfigurable, t('capabilities.httpMethod'));
    }

    if (payload.acceptedStatusCodes !== undefined) {
      const isDefault = payload.acceptedStatusCodes.length === 1 && payload.acceptedStatusCodes[0] === '2xx';
      if (!isDefault) {
        requireCapability(caps.monitoring.customStatusCodes, t('capabilities.statusCodes'));
      }
    }

    const hasCustomHeaders = payload.requestHeaders?.some((h) => h.key.trim() !== '' || h.value.trim() !== '');
    if (hasCustomHeaders) {
      requireCapability(caps.monitoring.customHeaders, t('capabilities.customHeaders'));
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
    const t = await getTranslations('validation');
    const payload = MonitorCheckUpdateSchema.parse(input);
    const caps = await getCapabilities();

    if (payload.intervalSeconds !== undefined) {
      requireCapability(
        payload.intervalSeconds >= caps.monitoring.minIntervalSeconds,
        t('capabilities.minInterval'),
      );
    }

    if (payload.httpMethod !== undefined && payload.httpMethod !== 'HEAD') {
      requireCapability(caps.monitoring.httpMethodConfigurable, t('capabilities.httpMethod'));
    }

    if (payload.acceptedStatusCodes !== undefined) {
      const isDefault = payload.acceptedStatusCodes.length === 1 && payload.acceptedStatusCodes[0] === '2xx';
      if (!isDefault) {
        requireCapability(caps.monitoring.customStatusCodes, t('capabilities.statusCodes'));
      }
    }

    if (payload.requestHeaders != null) {
      const hasCustomHeaders = payload.requestHeaders.some((h) => h.key.trim() !== '' || h.value.trim() !== '');
      if (hasCustomHeaders) {
        requireCapability(caps.monitoring.customHeaders, t('capabilities.customHeaders'));
      }
    }

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
