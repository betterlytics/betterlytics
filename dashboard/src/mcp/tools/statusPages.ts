import { z } from 'zod';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { round } from '@/mcp/utils/round';
import { statusPagePublicUrl } from '@/entities/analytics/statusPage/statusPage.helpers';
import type { StatusPageListItem } from '@/entities/analytics/statusPage/statusPage.entities';
import type {
  PublicStatusPageIncident,
  StatusPagePreviewPayload,
} from '@/entities/analytics/statusPage/publicStatusPage.entities';
import type { DetectedOutageSuggestion } from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { getStatusPagesForDashboard } from '@/services/analytics/statusPage.service';
import { getStatusPageLivePreviewData } from '@/services/analytics/publicStatusPage.service';
import { getIncidentSuggestions } from '@/services/analytics/statusPageIncident.service';

function assertStatusPagesEnabled() {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    throw new Error('Public status pages are not enabled on this Betterlytics deployment.');
  }
}

/** Narrows the dashboard's status pages to the requested one, rejecting an id that isn't ours. */
function scopeToStatusPage<T extends { id: string }>(pages: T[], statusPageId?: string): T[] {
  if (!statusPageId) return pages;

  const scoped = pages.filter((page) => page.id === statusPageId);
  if (!scoped.length) throw new Error('Status page not found');
  return scoped;
}

const statusPageIdInput = z
  .string()
  .optional()
  .describe('Only look at this status page. Use an id from list_status_pages. Omit for all of them.');

export const McpListStatusPagesInputBaseSchema = z.object({
  statusPageId: statusPageIdInput,
});

function formatIncident(incident: PublicStatusPageIncident) {
  return {
    title: incident.title,
    description: incident.description,
    impact: incident.impact,
    status: incident.status,
    // Empty means the incident is shown as affecting the whole page.
    affected_monitors: incident.monitorPublicNames,
    started_at: incident.startedAt,
    resolved_at: incident.resolvedAt,
    updates: incident.updates.map((update) => ({
      status: update.status,
      message: update.message,
      created_at: update.createdAt,
    })),
  };
}

function formatStatusPage(page: StatusPageListItem, payload: StatusPagePreviewPayload | null) {
  const data = payload?.data;

  return {
    id: page.id,
    name: page.name,
    slug: page.slug,
    public_url: statusPagePublicUrl(page, env.PUBLIC_BASE_URL),
    published: page.isPublished,
    visibility: page.visibility,
    custom_domain: page.customDomain,
    shows_past_incidents: page.showPastIncidents,
    overall_status: data?.overallStatus ?? null,
    overall_uptime_percent: round(data?.overallUptime, 3),
    last_updated_at: data?.lastUpdatedAt ?? null,
    monitors: (data?.monitors ?? []).map((monitor, index) => ({
      monitor_id: payload?.monitorCheckIds[index] ?? null,
      public_name: monitor.publicName,
      status: monitor.status,
      uptime_percent: round(monitor.uptime, 3),
    })),
    incidents: (data?.incidents ?? []).map(formatIncident),
  };
}

export async function executeListStatusPages(rawInput: unknown, dashboardId: string) {
  assertStatusPagesEnabled();

  const input = McpListStatusPagesInputBaseSchema.parse(rawInput);
  const pages = await getStatusPagesForDashboard(dashboardId);
  const selected = scopeToStatusPage(pages, input.statusPageId);

  const payloads = await Promise.all(selected.map((page) => getStatusPageLivePreviewData(dashboardId, page.id)));

  return {
    status_pages: selected.map((page, index) => formatStatusPage(page, payloads[index])),
    total: selected.length,
  };
}

export const McpListIncidentSuggestionsInputBaseSchema = z.object({
  statusPageId: statusPageIdInput,
});

function formatSuggestion(suggestion: DetectedOutageSuggestion) {
  return {
    detected_incident_id: suggestion.detectedIncidentId,
    monitors: suggestion.monitors.map((monitor) => ({
      monitor_id: monitor.monitorCheckId,
      public_name: monitor.monitorPublicName,
    })),
    started_at: suggestion.startedAt,
    resolved_at: suggestion.resolvedAt,
    ongoing: suggestion.ongoing,
    suggested_impact: suggestion.suggestedImpact,
  };
}

export async function executeListIncidentSuggestions(rawInput: unknown, dashboardId: string) {
  assertStatusPagesEnabled();

  const input = McpListIncidentSuggestionsInputBaseSchema.parse(rawInput);
  const pages = await getStatusPagesForDashboard(dashboardId);
  const selected = scopeToStatusPage(pages, input.statusPageId);

  const suggestionsByPage = await Promise.all(
    selected.map((page) => getIncidentSuggestions(dashboardId, page.id)),
  );

  return {
    status_pages: selected.map((page, index) => ({
      status_page_id: page.id,
      status_page_name: page.name,
      slug: page.slug,
      published: page.isPublished,
      suggestions: suggestionsByPage[index].map(formatSuggestion),
    })),
    total_suggestions: suggestionsByPage.reduce((sum, suggestions) => sum + suggestions.length, 0),
    total_status_pages: selected.length,
  };
}
