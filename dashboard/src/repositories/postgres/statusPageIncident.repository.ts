import { Prisma } from '@prisma/client';
import prisma from '@/lib/postgres';
import {
  StatusPageIncidentSchema,
  StatusPageIncidentTimelineEntrySchema,
  type IncidentWithSlug,
  type StatusPageIncident,
  type StatusPageIncidentBatchSave,
  type StatusPageIncidentCreate,
  type StatusPageIncidentTimelineEntry,
} from '@/entities/analytics/statusPage/statusPageIncident.entities';
import { STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';
import { groupByKey } from '@/utils/collections';

async function syncIncidentFromTimeline(tx: Prisma.TransactionClient, incidentId: string) {
  const latest = await tx.statusPageIncidentUpdate.findFirst({
    where: { incidentId },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { status: true, createdAt: true },
  });
  const latestWithMessage = await tx.statusPageIncidentUpdate.findFirst({
    where: { incidentId, message: { not: '' } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    select: { message: true },
  });
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
  const { statusPageId, message, startedAt, updates, ...fields } = data;
  const occurredAt = startedAt ?? new Date();
  const created = await prisma.$transaction(async (tx) => {
    const incident = await tx.statusPageIncident.create({
      data: { statusPageId, dashboardId, createdById, body: message, startedAt: occurredAt, ...fields },
      select: { id: true, statusPage: { select: { slug: true } } },
    });

    await tx.statusPageIncidentUpdate.create({
      data: { incidentId: incident.id, status: fields.status, message, createdById, createdAt: occurredAt },
    });
    if (updates.length > 0) {
      await tx.statusPageIncidentUpdate.createMany({
        data: updates.map((update) => ({
          incidentId: incident.id,
          status: update.status,
          message: update.message,
          createdById,
          createdAt: update.occurredAt ?? new Date(),
        })),
      });
    }

    const synced = await syncIncidentFromTimeline(tx, incident.id);
    return { incident: synced, slug: incident.statusPage.slug };
  });
  return { incident: StatusPageIncidentSchema.parse(created.incident), slug: created.slug };
}

export async function applyStatusPageIncidentChanges(
  dashboardId: string,
  actorId: string | null,
  data: StatusPageIncidentBatchSave,
): Promise<IncidentWithSlug | null> {
  const { incidentId, statusPageId, metadata, editedUpdates, newUpdates, deletedUpdateIds } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.statusPageIncident.findFirst({
      where: { id: incidentId, statusPageId, dashboardId, deletedAt: null },
      select: { id: true, statusPage: { select: { slug: true } } },
    });
    if (!existing) return null;

    if (metadata) {
      await tx.statusPageIncident.update({ where: { id: incidentId }, data: metadata });
    }
    if (editedUpdates.length > 0) {
      // One UPDATE ... FROM (VALUES ...) instead of a round trip per edited message.
      // The incidentId guard keeps ids belonging to other incidents inert, like the
      // per-row updateMany filter it replaces.
      await tx.$executeRaw`
        UPDATE "StatusPageIncidentUpdate" AS u
        SET "message" = v."message"
        FROM (VALUES ${Prisma.join(
          editedUpdates.map((edit) => Prisma.sql`(${edit.updateId}::text, ${edit.message}::text)`),
        )}) AS v("id", "message")
        WHERE u."id" = v."id" AND u."incidentId" = ${incidentId}
      `;
    }
    if (newUpdates.length > 0) {
      await tx.statusPageIncidentUpdate.createMany({
        data: newUpdates.map((update) => ({
          incidentId,
          status: update.status,
          message: update.message,
          createdById: actorId,
          createdAt: update.occurredAt ?? new Date(),
        })),
      });
    }
    if (deletedUpdateIds.length > 0) {
      await tx.statusPageIncidentUpdate.deleteMany({ where: { id: { in: deletedUpdateIds }, incidentId } });
    }

    const remaining = await tx.statusPageIncidentUpdate.count({ where: { incidentId } });
    if (remaining < 1 || remaining > STATUS_PAGE_LIMITS.INCIDENT_UPDATES_MAX) {
      throw new Error(`Incident ${incidentId} timeline would have ${remaining} updates`);
    }

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
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
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

export async function listPublishedIncidentUpdates(
  incidentIds: string[],
): Promise<Map<string, StatusPageIncidentTimelineEntry[]>> {
  if (incidentIds.length === 0) return new Map();

  const rows = await prisma.statusPageIncidentUpdate.findMany({
    where: { incidentId: { in: incidentIds } },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  return groupByKey(
    rows.map((row) => StatusPageIncidentTimelineEntrySchema.parse(row)),
    (entry) => entry.incidentId,
  );
}

export async function listPublishedIncidents(
  statusPageId: string,
  { includeResolved = true }: { includeResolved?: boolean } = {},
): Promise<StatusPageIncident[]> {
  const windowStart = new Date(Date.now() - STATUS_PAGE_LIMITS.UPTIME_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const rows = await prisma.statusPageIncident.findMany({
    where: {
      statusPageId,
      deletedAt: null,
      ...(includeResolved
        ? { OR: [{ resolvedAt: null }, { resolvedAt: { gte: windowStart } }] }
        : { resolvedAt: null }),
    },
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
