import { z } from 'zod';
import { STATUS_PAGE_LIMITS } from './statusPage.entities';

export const StatusPageIncidentImpactSchema = z.enum(['degraded', 'partial_outage', 'outage']);
export type StatusPageIncidentImpact = z.infer<typeof StatusPageIncidentImpactSchema>;

export const StatusPageIncidentStatusSchema = z.enum(['investigating', 'identified', 'monitoring', 'resolved']);
export type StatusPageIncidentStatusValue = z.infer<typeof StatusPageIncidentStatusSchema>;

export const StatusPageIncidentSchema = z.object({
  id: z.string(),
  statusPageId: z.string(),
  title: z.string(),
  body: z.string(),
  impact: StatusPageIncidentImpactSchema,
  status: StatusPageIncidentStatusSchema,
  startedAt: z.date(),
  resolvedAt: z.date().nullable(),
  // Affected monitors (display-only check ids); empty = unspecified, all selected = page-wide.
  monitorCheckIds: z.array(z.string()).default([]),
  detectedIncidentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StatusPageIncident = z.infer<typeof StatusPageIncidentSchema>;

export type IncidentWithSlug = { incident: StatusPageIncident; slug: string };

// A single public timeline update: status + message + when. This is the whole content model now —
// no per-field audit.
export const StatusPageIncidentTimelineEntrySchema = z.object({
  id: z.string(),
  incidentId: z.string(),
  status: StatusPageIncidentStatusSchema,
  message: z.string(),
  createdById: z.string().nullable(),
  createdAt: z.date(),
});
export type StatusPageIncidentTimelineEntry = z.infer<typeof StatusPageIncidentTimelineEntrySchema>;

const incidentTitle = z.string().trim().min(1).max(STATUS_PAGE_LIMITS.INCIDENT_TITLE_MAX);
// Update messages are optional — a status-only update (e.g. "Monitoring", no text) is allowed.
const incidentMessage = z.string().trim().max(STATUS_PAGE_LIMITS.INCIDENT_UPDATE_MESSAGE_MAX);

// `occurredAt` defaults to now.
const incidentUpdateInput = z.object({
  status: StatusPageIncidentStatusSchema,
  message: incidentMessage.default(''),
  occurredAt: z.coerce.date().optional(),
});

// Create = the incident row + its first timeline update (the composer) + staged `updates`, in one
// transaction. status/body/resolvedAt are timeline-derived, never direct inputs.
export const StatusPageIncidentCreateSchema = z.object({
  statusPageId: z.string().min(1),
  title: incidentTitle,
  message: incidentMessage.default(''),
  impact: StatusPageIncidentImpactSchema.default('outage'),
  status: StatusPageIncidentStatusSchema.default('investigating'),
  startedAt: z.coerce.date().optional(),
  updates: z
    .array(incidentUpdateInput)
    .max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX - 1)
    .default([]),
  monitorCheckIds: z.array(z.string().min(1)).default([]),
  detectedIncidentId: z.string().min(1).nullable().default(null),
});

export type StatusPageIncidentCreate = z.infer<typeof StatusPageIncidentCreateSchema>;

// Edit incident metadata only. Status/body/resolvedAt are derived from the timeline, so they are
// never edited here — those change by posting/editing/removing updates.
export const StatusPageIncidentUpdateSchema = z.object({
  id: z.string().min(1),
  statusPageId: z.string().min(1),
  title: incidentTitle.optional(),
  impact: StatusPageIncidentImpactSchema.optional(),
  monitorCheckIds: z.array(z.string().min(1)).optional(),
});
export type StatusPageIncidentUpdate = z.infer<typeof StatusPageIncidentUpdateSchema>;

export const StatusPageIncidentUpdatePostSchema = z.object({
  incidentId: z.string().min(1),
  statusPageId: z.string().min(1),
  updates: z.array(incidentUpdateInput).min(1).max(STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX),
});
export type StatusPageIncidentUpdatePost = z.infer<typeof StatusPageIncidentUpdatePostSchema>;

// Edit an existing update — only its message (text body) is mutable; status and time are fixed.
export const StatusPageIncidentUpdateEditSchema = z.object({
  incidentId: z.string().min(1),
  statusPageId: z.string().min(1),
  updateId: z.string().min(1),
  message: incidentMessage.default(''),
});
export type StatusPageIncidentUpdateEdit = z.infer<typeof StatusPageIncidentUpdateEditSchema>;

export const StatusPageIncidentUpdateDeleteSchema = z.object({
  incidentId: z.string().min(1),
  statusPageId: z.string().min(1),
  updateId: z.string().min(1),
});
export type StatusPageIncidentUpdateDelete = z.infer<typeof StatusPageIncidentUpdateDeleteSchema>;

export type DetectedOutageMonitor = {
  monitorCheckId: string;
  monitorPublicName: string;
};

// A group of detected outages that started close enough together to be one real incident (shared
// root cause across monitors). Single-monitor outages are just groups of one.
export type DetectedOutageSuggestion = {
  /** Representative ClickHouse incident id (the earliest in the group) */
  detectedIncidentId: string;
  monitors: DetectedOutageMonitor[];
  /** Earliest start across the group. */
  startedAt: string;
  /** Latest resolve across the group, or null if any monitor is still down. */
  resolvedAt: string | null;
  /** True if any monitor in the group is still down. */
  ongoing: boolean;
  /** Worst impact across the group. */
  suggestedImpact: StatusPageIncidentImpact;
};
