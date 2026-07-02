import { cache } from 'react';
import {
  STATUS_PAGE_DEFAULT_ACCENT_COLOR,
  STATUS_PAGE_LIMITS,
  type PublishedStatusPage,
  type StatusPageImageKind,
} from '@/entities/analytics/statusPage/statusPage.entities';
import {
  PublicStatusPageDataSchema,
  type PublicDailyUptimeBucket,
  type PublicMonitorStatus,
  type PublicStatusPageData,
  type StatusPagePreviewPayload,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { defaultPublicMonitorName } from '@/entities/analytics/statusPage/statusPage.helpers';
import type { MonitorStatus } from '@/entities/analytics/monitoring.entities';
import { env } from '@/lib/env';
import {
  deriveOverallUptime,
  deriveStatusWithIncidents,
  toPublicIncident,
  type OpenIncidentRef,
} from '@/entities/analytics/statusPage/publicStatusPage.helpers';
import {
  getLatestCheckInfoForMonitors,
  getOpenIncidentsForMonitors,
  getUptimeBucketsForMonitors,
} from '@/repositories/clickhouse/monitoring.repository';
import {
  getPublishedStatusPageBySlug,
  getStatusPageImageBySlug,
  getStatusPageSnapshotById,
} from '@/repositories/postgres/statusPage.repository';
import {
  listPublishedIncidents,
  listPublishedIncidentUpdates,
} from '@/repositories/postgres/statusPageIncident.repository';
import { type StatusPageIncidentTimelineEntry } from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { listMonitorChecks } from '@/repositories/postgres/monitoring.repository';
import { canRemoveStatusPageBranding } from '@/lib/billing/capabilityAccess';
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
    const hideBranding =
      published.page.hideBranding && (await canRemoveStatusPageBranding(published.page.dashboardId));
    const { data } = await assembleStatusPage(published, { hideBranding });
    return data;
  }
  return env.IS_DEVELOPMENT ? getStatusPageFixture(slug) : null;
});

export async function getPublicStatusPageImage(slug: string, kind: StatusPageImageKind) {
  return getStatusPageImageBySlug(slug, kind);
}

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
      visibility: 'public',
      homepageUrl: null,
      customDomain: null,
      theme: 'system',
      accentColor: STATUS_PAGE_DEFAULT_ACCENT_COLOR,
      logoUrl: null,
      faviconUrl: null,
      showPastIncidents: false,
      hideBranding: false,
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

async function assembleStatusPage(
  published: PublishedStatusPage,
  options?: { hideBranding?: boolean },
): Promise<StatusPagePreviewPayload> {
  const { page, siteId, monitors } = published;
  const days = STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS;
  const checkIds = monitors.map((monitor) => monitor.monitorCheckId);

  const rangeEndDate = new Date();
  const rangeStart = toDateTimeString(new Date(rangeEndDate.getTime() - days * 24 * 60 * 60 * 1000));
  const rangeEnd = toDateTimeString(rangeEndDate);

  const [bucketsByCheckId, openIncidents, latestCheckInfo, publishedIncidents] = await Promise.all([
    getUptimeBucketsForMonitors(
      monitors.map((monitor) => ({ checkId: monitor.monitorCheckId, createdAt: monitor.monitorCreatedAt })),
      siteId,
      'UTC',
      rangeStart,
      rangeEnd,
      days,
    ),

    getOpenIncidentsForMonitors(checkIds, siteId),
    getLatestCheckInfoForMonitors(checkIds, siteId),

    listPublishedIncidents(page.id, { includeResolved: page.showPastIncidents }),
  ]);

  const detectedStatuses = monitors.map((monitor) =>
    deriveMonitorStatus(
      monitor.isEnabled,
      openIncidents.has(monitor.monitorCheckId),
      latestCheckInfo[monitor.monitorCheckId]?.status,
    ),
  );

  const { monitorStatuses, overallStatus } = deriveStatusWithIncidents(
    monitors.map((monitor, index) => ({ key: monitor.monitorCheckId, detected: detectedStatuses[index] })),
    // One ref per affected monitor (removed monitors still escalate via ghost handling); empty = page-wide.
    publishedIncidents
      .filter((incident) => incident.resolvedAt == null)
      .flatMap((incident): OpenIncidentRef[] =>
        incident.monitorCheckIds.length === 0
          ? [{ impact: incident.impact, monitorKey: null }]
          : incident.monitorCheckIds.map((id) => ({ impact: incident.impact, monitorKey: id })),
      ),
  );

  const publicMonitors = monitors.map((monitor, index) => {
    const buckets = bucketsByCheckId.get(monitor.monitorCheckId) ?? [];

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

    return {
      key: String(index),
      publicName: monitor.publicName,
      status: monitorStatuses[index],
      uptime: totalSeconds > 0 ? (uptimeSeconds / totalSeconds) * 100 : null,
      days: dailyBuckets,
    };
  });

  const updatesByIncident: Map<string, StatusPageIncidentTimelineEntry[]> = await listPublishedIncidentUpdates(
    publishedIncidents.map((incident) => incident.id),
  );

  const nameByCheckId = new Map(monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName]));

  const mappedIncidents = publishedIncidents.map((incident) => {
    // Keep only monitors still on the page, then resolve each to its public name. Empty = page-wide
    // (or every affected monitor has since been removed from the page).
    const affectedCheckIds = incident.monitorCheckIds.filter((id) => nameByCheckId.has(id));
    return {
      monitorCheckIds: affectedCheckIds,
      incident: toPublicIncident(
        incident,
        affectedCheckIds.map((id) => nameByCheckId.get(id) as string),
        updatesByIncident.get(incident.id) ?? [],
      ),
    };
  });

  const incidents = page.showPastIncidents || mappedIncidents.length > 0 ? mappedIncidents : null;

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
    faviconUrl: page.faviconUrl,
    homepageUrl: page.homepageUrl,
    noindex: page.visibility === 'unlisted',
    accentColor: page.accentColor,
    theme: page.theme,
    overallStatus,
    lastUpdatedAt,
    overallUptime: deriveOverallUptime(publicMonitors.map((monitor) => monitor.uptime)),
    hideBranding: options?.hideBranding ?? false,
    showPastIncidents: page.showPastIncidents,
    monitors: publicMonitors,
    incidents: incidents == null ? null : incidents.map((entry) => entry.incident),
  });

  return {
    data,
    monitorCheckIds: checkIds,
    detectedStatuses,
    incidentMonitorCheckIds: (incidents ?? []).map((entry) => entry.monitorCheckIds),
  };
}
