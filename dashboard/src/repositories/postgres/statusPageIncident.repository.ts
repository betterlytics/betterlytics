import type { Prisma } from '@prisma/client';
import prisma from '@/lib/postgres';
import {
  StatusPageIncidentSchema,
  StatusPageIncidentTimelineEntrySchema,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentCreate,
  type StatusPageIncidentTimelineEntry,
  type StatusPageIncidentUpdate,
  type StatusPageIncidentUpdateDelete,
  type StatusPageIncidentUpdateEdit,
  type StatusPageIncidentUpdatePost,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';

// Status, denormalized body, and resolvedAt all follow the timeline: status/resolvedAt from the
// most recent update, body from the most recent update that actually has a message. Call this inside
// the transaction after any post / edit / delete so the incident row stays in sync. Returns the
// refreshed incident row.
async function syncIncidentFromTimeline(tx: Prisma.TransactionClient, incidentId: string) {
  const updates = await tx.statusPageIncidentUpdate.findMany({
    where: { incidentId },
    orderBy: { createdAt: 'desc' },
  });
  const latest = updates[0];
  const latestWithMessage = updates.find((u) => u.message.trim().length > 0);
  return tx.statusPageIncident.update({
    where: { id: incidentId },
    data: {
      status: latest ? latest.status : undefined,
      body: latestWithMessage?.message ?? '',
      resolvedAt: latest && latest.status === 'resolved' ? latest.createdAt : null,
    },
  });
}

export async function listStatusPageIncidents(
  dashboardId: string,
  statusPageId: string,
): Promise<StatusPageIncident[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, dashboardId, deletedAt: null },
    orderBy: { startedAt: 'desc' },
  });
  return rows.map((row) => StatusPageIncidentSchema.parse(row));
}

export async function getStatusPageIncidentById(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncident | null> {
  const row = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
  });
  return row ? StatusPageIncidentSchema.parse(row) : null;
}

export async function countStatusPageIncidents(dashboardId: string, statusPageId: string): Promise<number> {
  return prisma.statusPageIncident.count({ where: { statusPageId, dashboardId, deletedAt: null } });
}

export async function countActiveIncidentsByStatusPage(dashboardId: string): Promise<Map<string, number>> {
  const grouped = await prisma.statusPageIncident.groupBy({
    by: ['statusPageId'],
    where: { dashboardId, deletedAt: null, status: { not: 'resolved' } },
    _count: { _all: true },
  });
  return new Map(grouped.map((row) => [row.statusPageId, row._count._all]));
}

export async function createStatusPageIncident(
  dashboardId: string,
  createdById: string,
  data: StatusPageIncidentCreate,
): Promise<IncidentWithSlug> {
  // `message` is the first update; the incident's startedAt is when that update happened (or now),
  // and body/resolvedAt are derived from it (resolvedAt may be seeded for resolved detected outages).
  const { statusPageId, message, startedAt, resolvedAt, ...fields } = data;
  const occurredAt = startedAt ?? new Date();
  const created = await prisma.$transaction(async (tx) => {
    const incident = await tx.statusPageIncident.create({
      data: {
        statusPageId,
        dashboardId,
        createdById,
        body: message,
        startedAt: occurredAt,
        resolvedAt: resolvedAt ?? (fields.status === 'resolved' ? occurredAt : null),
        ...fields,
      },
      include: { statusPage: { select: { slug: true } } },
    });

    await tx.statusPageIncidentUpdate.create({
      data: { incidentId: incident.id, status: incident.status, message, createdById, createdAt: occurredAt },
    });
    return incident;
  });
  const { statusPage, ...incident } = created;
  return { incident: StatusPageIncidentSchema.parse(incident), slug: statusPage.slug };
}

// Metadata-only: title, impact, affected monitor. Status/body/resolvedAt are timeline-derived and
// only change through the update functions below.
export async function updateStatusPageIncident(
  dashboardId: string,
  data: StatusPageIncidentUpdate,
): Promise<IncidentWithSlug | null> {
  const { id, statusPageId, ...metadata } = data;
  const existing = await prisma.statusPageIncident.findFirst({
    where: { id, statusPageId, dashboardId, deletedAt: null },
    select: { id: true, statusPage: { select: { slug: true } } },
  });
  if (!existing) return null;

  const updated = await prisma.statusPageIncident.update({ where: { id: existing.id }, data: metadata });
  return { incident: StatusPageIncidentSchema.parse(updated), slug: existing.statusPage.slug };
}

/** Append a timeline update (the "post an update" box), then resync the incident's derived fields. */
export async function postStatusPageIncidentUpdate(
  dashboardId: string,
  actorId: string | null,
  data: StatusPageIncidentUpdatePost,
): Promise<IncidentWithSlug | null> {
  const { incidentId, statusPageId, status, message, occurredAt } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.statusPageIncident.findFirst({
      where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
      select: { id: true, statusPage: { select: { slug: true } } },
    });
    if (!existing) return null;

    await tx.statusPageIncidentUpdate.create({
      data: { incidentId, status, message, createdById: actorId, createdAt: occurredAt ?? new Date() },
    });
    const incident = await syncIncidentFromTimeline(tx, incidentId);
    return { incident: StatusPageIncidentSchema.parse(incident), slug: existing.statusPage.slug };
  });
}

/** Edit only an existing update's message (text body); status and time are immutable. */
export async function editStatusPageIncidentUpdate(
  dashboardId: string,
  data: StatusPageIncidentUpdateEdit,
): Promise<IncidentWithSlug | null> {
  const { incidentId, statusPageId, updateId, message } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.statusPageIncident.findFirst({
      where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
      select: { id: true, statusPage: { select: { slug: true } } },
    });
    if (!existing) return null;

    const edited = await tx.statusPageIncidentUpdate.updateMany({
      where: { id: updateId, incidentId },
      data: { message },
    });
    if (edited.count === 0) return null;

    const incident = await syncIncidentFromTimeline(tx, incidentId);
    return { incident: StatusPageIncidentSchema.parse(incident), slug: existing.statusPage.slug };
  });
}

/** Remove a timeline update, then resync derived fields. The caller guards against deleting the last. */
export async function deleteStatusPageIncidentUpdate(
  dashboardId: string,
  data: StatusPageIncidentUpdateDelete,
): Promise<IncidentWithSlug | null> {
  const { incidentId, statusPageId, updateId } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.statusPageIncident.findFirst({
      where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
      select: { id: true, statusPage: { select: { slug: true } } },
    });
    if (!existing) return null;

    const deleted = await tx.statusPageIncidentUpdate.deleteMany({ where: { id: updateId, incidentId } });
    if (deleted.count === 0) return null;

    const incident = await syncIncidentFromTimeline(tx, incidentId);
    return { incident: StatusPageIncidentSchema.parse(incident), slug: existing.statusPage.slug };
  });
}

export function countStatusPageIncidentUpdates(incidentId: string): Promise<number> {
  return prisma.statusPageIncidentUpdate.count({ where: { incidentId } });
}

export async function listStatusPageIncidentUpdates(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<StatusPageIncidentTimelineEntry[] | null> {
  const incident = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
    select: { id: true },
  });
  if (!incident) return null;

  const rows = await prisma.statusPageIncidentUpdate.findMany({
    where: { incidentId: incident.id },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => StatusPageIncidentTimelineEntrySchema.parse(row));
}

export async function deleteStatusPageIncident(
  dashboardId: string,
  statusPageId: string,
  incidentId: string,
): Promise<string | null> {
  const existing = await prisma.statusPageIncident.findFirst({
    where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
    select: { id: true, statusPage: { select: { slug: true } } },
  });
  if (!existing) return null;

  await prisma.statusPageIncident.update({ where: { id: existing.id }, data: { deletedAt: new Date() } });
  return existing.statusPage.slug;
}

/** Public timeline read: entries for the given incidents, newest first, keyed by incident id. */
export async function listPublishedIncidentUpdates(
  incidentIds: string[],
): Promise<Map<string, StatusPageIncidentTimelineEntry[]>> {
  if (incidentIds.length === 0) return new Map();

  const rows = await prisma.statusPageIncidentUpdate.findMany({
    where: { incidentId: { in: incidentIds } },
    orderBy: { createdAt: 'desc' },
  });

  const byIncident = new Map<string, StatusPageIncidentTimelineEntry[]>();
  for (const row of rows) {
    const entry = StatusPageIncidentTimelineEntrySchema.parse(row);
    const list = byIncident.get(entry.incidentId);
    if (list) list.push(entry);
    else byIncident.set(entry.incidentId, [entry]);
  }
  return byIncident;
}

export async function listPublishedIncidents(
  statusPageId: string,
  { includeResolved = true }: { includeResolved?: boolean } = {},
): Promise<StatusPageIncident[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, deletedAt: null, ...(includeResolved ? {} : { resolvedAt: null }) },
    orderBy: { startedAt: 'desc' },
  });
  return rows.map((row) => StatusPageIncidentSchema.parse(row));
}

export async function listLinkedDetectedIncidentIds(dashboardId: string, statusPageId: string): Promise<string[]> {
  const rows = await prisma.statusPageIncident.findMany({
    where: { statusPageId, dashboardId, deletedAt: null, detectedIncidentId: { not: null } },
    select: { detectedIncidentId: true },
  });
  return rows.flatMap((row) => (row.detectedIncidentId ? [row.detectedIncidentId] : []));
}
