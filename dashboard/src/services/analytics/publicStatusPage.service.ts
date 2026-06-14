import { cache } from 'react';
import {
  defaultPublicMonitorName,
  PublicStatusPageDataSchema,
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  STATUS_PAGE_LIMITS,
  type PublicDailyUptimeBucket,
  type PublicMonitorStatus,
  type PublicStatusPageData,
  type PublicStatusPageIncident,
  type PublishedStatusPage,
  type StatusPagePreviewPayload,
} from '@/entities/analytics/statusPage.entities';
import type { MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { env } from '@/lib/env';
import { deriveOverallStatus, deriveOverallUptime } from '@/presenters/publicStatusPage';
import {
  getLatestCheckInfoForMonitors,
  getMonitorUptimeBuckets,
  getOpenIncidentsForMonitors,
} from '@/repositories/clickhouse/monitoring.repository';
import {
  getPublishedStatusPageBySlug,
  getStatusPageSnapshotById,
} from '@/repositories/postgres/statusPage.repository';
import { listPublishedIncidents } from '@/repositories/postgres/statusPageIncident.repository';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { toDateTimeString } from '@/utils/dateFormatters';
import { getStatusPageFixture } from './publicStatusPage.fixtures';

function deriveMonitorStatus(
  isEnabled: boolean,
  hasOpenIncident: boolean,
  latestStatus: MonitorStatus | null | undefined,
): PublicMonitorStatus {
  if (!isEnabled) return 'unknown';
  if (hasOpenIncident) return 'down';
  if (latestStatus == null) return 'unknown';
  if (latestStatus === 'warn') return 'degraded';
  return 'operational';
}

export const getPublicStatusPageData = cache(async (slug: string): Promise<PublicStatusPageData | null> => {
  const published = await getPublishedStatusPageBySlug(slug);
  if (published) {
    const { data } = await assembleStatusPage(published);
    return data;
  }
  return env.IS_DEVELOPMENT ? getStatusPageFixture(slug) : null;
});

export async function getStatusPagePreviewData(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPagePreviewPayload | null> {
  const snapshot = await getStatusPageSnapshotById(dashboardId, statusPageId);
  if (!snapshot) return null;

  const selectionByMonitorId = new Map(snapshot.monitors.map((monitor) => [monitor.monitorCheckId, monitor]));
  const allMonitors = await listMonitorChecks(dashboardId);

  const previewSnapshot: PublishedStatusPage = {
    ...snapshot,
    page: { ...snapshot.page, showPastIncidents: true },
    monitors: allMonitors.map((monitor, index) => {
      const selection = selectionByMonitorId.get(monitor.id);
      return {
        monitorCheckId: monitor.id,
        publicName: selection?.publicName ?? defaultPublicMonitorName(monitor),
        position: selection?.position ?? snapshot.monitors.length + index,
        isEnabled: monitor.isEnabled,
        monitorCreatedAt: monitor.createdAt,
      };
    }),
  };

  return assembleStatusPage(previewSnapshot);
}

/**
 * Preview payload for a status page that does NOT exist yet (the create wizard): assembles
 * uptime/incident data for ALL of the dashboard's monitors using default page settings. The wizard
 * layers its live draft (name/slug/branding/selection) on top client-side, so these defaults are
 * just fallbacks.
 */
export async function getStatusPagePreviewDataForDashboard(
  dashboardId: string,
  siteId: string,
): Promise<StatusPagePreviewPayload> {
  const allMonitors = await listMonitorChecks(dashboardId);
  const now = new Date();

  const draftSnapshot: PublishedStatusPage = {
    page: {
      id: 'draft-preview',
      dashboardId,
      slug: 'preview',
      name: '',
      description: null,
      isPublished: false,
      theme: 'system',
      accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
      logoUrl: null,
      language: 'en',
      // No persisted page yet → no published incidents to fetch; disable the section to skip the query.
      showPastIncidents: false,
      createdAt: now,
      updatedAt: now,
    },
    siteId,
    monitors: allMonitors.map((monitor, index) => ({
      monitorCheckId: monitor.id,
      publicName: defaultPublicMonitorName(monitor),
      position: index,
      isEnabled: monitor.isEnabled,
      monitorCreatedAt: monitor.createdAt,
    })),
  };

  return assembleStatusPage(draftSnapshot);
}

async function assembleStatusPage(published: PublishedStatusPage): Promise<StatusPagePreviewPayload> {
  const { page, siteId, monitors } = published;
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;
  const checkIds = monitors.map((monitor) => monitor.monitorCheckId);

  const rangeEndDate = new Date();
  const rangeStart = toDateTimeString(new Date(rangeEndDate.getTime() - days * 24 * 60 * 60 * 1000));
  const rangeEnd = toDateTimeString(rangeEndDate);

  const [bucketsPerMonitor, openIncidents, latestCheckInfo, publishedIncidents] = await Promise.all([
    Promise.all(
      monitors.map((monitor) =>
        getMonitorUptimeBuckets(
          monitor.monitorCheckId,
          siteId,
          monitor.monitorCreatedAt,
          'UTC',
          rangeStart,
          rangeEnd,
          days,
          'day',
        ),
      ),
    ),

    getOpenIncidentsForMonitors(checkIds, siteId),
    getLatestCheckInfoForMonitors(checkIds, siteId),

    page.showPastIncidents ? listPublishedIncidents(page.id) : Promise.resolve(null),
  ]);

  const publicMonitors = monitors.map((monitor, index) => {
    const buckets = bucketsPerMonitor[index];
    const latest = latestCheckInfo[monitor.monitorCheckId];

    const dailyBuckets: PublicDailyUptimeBucket[] = buckets.map((bucket) => ({
      date: bucket.bucket.slice(0, 10),
      upRatio: bucket.upRatio == null ? null : Math.min(1, Math.max(0, bucket.upRatio)),
    }));

    // Weight by bucket length so partial first/last days don't skew the window
    let uptimeSeconds = 0;
    let totalSeconds = 0;
    for (const bucket of buckets) {
      if (bucket.upRatio == null || bucket.totalSeconds == null) continue;
      uptimeSeconds += bucket.upRatio * bucket.totalSeconds;
      totalSeconds += bucket.totalSeconds;
    }

    const status = deriveMonitorStatus(
      monitor.isEnabled,
      openIncidents.has(monitor.monitorCheckId),
      latest?.status,
    );

    return {
      key: String(index),
      publicName: monitor.publicName,
      status,
      uptime: totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : null,
      days: dailyBuckets,
    };
  });

  const incidents =
    publishedIncidents == null
      ? null
      : publishedIncidents.map((incident) => {
          // Resolve the affected monitor's public name from the page's monitors; null = page-wide
          // (or the monitor is no longer on the page).
          const monitorIndex = incident.monitorCheckId ? checkIds.indexOf(incident.monitorCheckId) : -1;
          return {
            monitorIndex,
            incident: {
              title: incident.title,
              body: incident.body,
              impact: incident.impact,
              status: incident.status,
              monitorPublicName: monitorIndex >= 0 ? monitors[monitorIndex].publicName : null,
              startedAt: incident.startedAt.toISOString(),
              resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
            } satisfies PublicStatusPageIncident,
          };
        });

  const lastCheckTimestamps = Object.values(latestCheckInfo)
    .map((info) => info.ts)
    .filter((ts): ts is string => ts != null);
  const lastUpdatedAt = lastCheckTimestamps.length
    ? lastCheckTimestamps.reduce((max, ts) => (ts > max ? ts : max))
    : page.updatedAt.toISOString();

  const data = PublicStatusPageDataSchema.parse({
    name: page.name,
    slug: page.slug,
    logoUrl: page.logoUrl,
    accentColor: page.accentColor,
    theme: page.theme,
    language: page.language,
    overallStatus: deriveOverallStatus(publicMonitors.map((monitor) => monitor.status)),
    lastUpdatedAt,
    overallUptime: deriveOverallUptime(publicMonitors.map((monitor) => monitor.uptime)),
    monitors: publicMonitors,
    incidents: incidents == null ? null : incidents.map((entry) => entry.incident),
  });

  return {
    data,
    monitorCheckIds: checkIds,
    incidentMonitorIndexes: (incidents ?? []).map((entry) => entry.monitorIndex),
  };
}
