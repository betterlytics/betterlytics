import {
  countStatusPageIncidents,
  createStatusPageIncident,
  deleteStatusPageIncident,
  getStatusPageIncidentById,
  listLinkedDetectedIncidentIds,
  listStatusPageIncidents,
  setStatusPageIncidentPublished,
  updateStatusPageIncident,
} from '@/repositories/postgres/statusPageIncident.repository';
import { getStatusPageSnapshotById } from '@/repositories/postgres/statusPage.repository';
import { getDetectedOutagesForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import {
  STATUS_PAGE_LIMITS,
  type DetectedOutageSuggestion,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentCreate,
  type StatusPageIncidentImpact,
  type StatusPageIncidentUpdate,
} from '@/entities/analytics/statusPage.entities';


export function getIncidentsForStatusPage(dashboardId: string, statusPageId: string): Promise<StatusPageIncident[]> {
  return listStatusPageIncidents(dashboardId, statusPageId);
}

export function getStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncident | null> {
  return getStatusPageIncidentById(dashboardId, statusPageId, incidentId);
}

export function addStatusPageIncident(
  dashboardId: string,
  createdById: string,
  data: StatusPageIncidentCreate,
): Promise<IncidentWithSlug> {
  return createStatusPageIncident(dashboardId, createdById, data);
}

export function saveStatusPageIncident(
  dashboardId: string,
  data: StatusPageIncidentUpdate,
): Promise<IncidentWithSlug | null> {
  return updateStatusPageIncident(dashboardId, data);
}

export function publishStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
  isPublished: boolean,
): Promise<IncidentWithSlug | null> {
  return setStatusPageIncidentPublished(dashboardId, statusPageId, incidentId, isPublished);
}

export function removeStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<string | null> {
  return deleteStatusPageIncident(dashboardId, statusPageId, incidentId);
}

export function countActiveStatusPageIncidents(dashboardId: string, statusPageId: string): Promise<number> {
  return countStatusPageIncidents(dashboardId, statusPageId);
}

function severityToImpact(severity: string): StatusPageIncidentImpact {
  return severity === 'critical' ? 'outage' : 'degraded';
}

export async function getIncidentSuggestions(
  dashboardId: string,
  statusPageId: string,
): Promise<DetectedOutageSuggestion[]> {
  const snapshot = await getStatusPageSnapshotById(dashboardId, statusPageId);
  if (!snapshot) return [];

  const nameByCheckId = new Map(snapshot.monitors.map((monitor) => [monitor.monitorCheckId, monitor.publicName]));
  const checkIds = snapshot.monitors.map((monitor) => monitor.monitorCheckId);
  if (!checkIds.length) return [];

  const [detected, linkedIds] = await Promise.all([
    getDetectedOutagesForMonitors(
      checkIds,
      snapshot.siteId,
      STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS,
      STATUS_PAGE_LIMITS.SUGGESTIONS_MAX * 3,
    ),
    listLinkedDetectedIncidentIds(dashboardId, statusPageId),
  ]);
  const linked = new Set(linkedIds);

  const suggestions: DetectedOutageSuggestion[] = [];
  for (const outage of detected) {
    if (linked.has(outage.detectedIncidentId)) continue;
    const monitorPublicName = nameByCheckId.get(outage.monitorCheckId);
    if (monitorPublicName == null) continue;
    suggestions.push({
      detectedIncidentId: outage.detectedIncidentId,
      monitorCheckId: outage.monitorCheckId,
      monitorPublicName,
      startedAt: outage.startedAt,
      resolvedAt: outage.resolvedAt,
      ongoing: outage.ongoing,
      reasonCode: outage.reasonCode,
      suggestedImpact: severityToImpact(outage.severity),
    });
    if (suggestions.length >= STATUS_PAGE_LIMITS.SUGGESTIONS_MAX) break;
  }
  return suggestions;
}
