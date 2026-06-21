import {
  countStatusPageIncidents,
  countStatusPageIncidentUpdates,
  createStatusPageIncident,
  deleteStatusPageIncident,
  deleteStatusPageIncidentUpdate,
  editStatusPageIncidentUpdate,
  getStatusPageIncidentById,
  listLinkedDetectedIncidentIds,
  listStatusPageIncidents,
  listStatusPageIncidentUpdates,
  postStatusPageIncidentUpdate,
  updateStatusPageIncident,
} from '@/repositories/postgres/statusPageIncident.repository';
import { getStatusPageSnapshotById } from '@/repositories/postgres/statusPage.repository';
import { getDetectedOutagesForMonitors } from '@/repositories/clickhouse/monitoring.repository';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import {
  type DetectedOutageSuggestion,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentCreate,
  type StatusPageIncidentImpact,
  type StatusPageIncidentTimelineEntry,
  type StatusPageIncidentUpdate,
  type StatusPageIncidentUpdateDelete,
  type StatusPageIncidentUpdateEdit,
  type StatusPageIncidentUpdatePost,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';


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

export function addStatusPageIncidentUpdate(
  dashboardId: string,
  actorId: string,
  data: StatusPageIncidentUpdatePost,
): Promise<IncidentWithSlug | null> {
  return postStatusPageIncidentUpdate(dashboardId, actorId, data);
}

export function editStatusPageIncidentUpdateMessage(
  dashboardId: string,
  data: StatusPageIncidentUpdateEdit,
): Promise<IncidentWithSlug | null> {
  return editStatusPageIncidentUpdate(dashboardId, data);
}

export function removeStatusPageIncidentUpdate(
  dashboardId: string,
  data: StatusPageIncidentUpdateDelete,
): Promise<IncidentWithSlug | null> {
  return deleteStatusPageIncidentUpdate(dashboardId, data);
}

export function countIncidentUpdates(incidentId: string): Promise<number> {
  return countStatusPageIncidentUpdates(incidentId);
}

export function getStatusPageIncidentTimeline(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncidentTimelineEntry[] | null> {
  return listStatusPageIncidentUpdates(dashboardId, statusPageId, incidentId);
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
