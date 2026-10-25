import prisma from '@/lib/postgres';
import {
  MonitorCheckSchema,
  MonitorPausePeriodSchema,
  type MonitorCheck,
  type MonitorCheckCreate,
  type MonitorCheckUpdate,
  type MonitorPausePeriod,
} from '@/entities/analytics/monitoring.entities';
import { normalizeUrl } from '@/utils/domainValidation';

export async function listMonitorChecks(dashboardId: string): Promise<MonitorCheck[]> {
  const results = await prisma.monitorCheck.findMany({
    where: { dashboardId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return results.map((row) => MonitorCheckSchema.parse(row));
}

export async function countMonitorChecks(dashboardId: string): Promise<number> {
  return prisma.monitorCheck.count({
    where: { dashboardId, deletedAt: null },
  });
}

export async function monitorExistsForUrl(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  const normalizedNewUrl = normalizeUrl(url);
  if (!normalizedNewUrl) return false;

  const existingMonitors = await prisma.monitorCheck.findMany({
    where: { dashboardId, deletedAt: null },
    select: { id: true, url: true },
  });

  return existingMonitors.some((monitor) => {
    if (excludeMonitorId && monitor.id === excludeMonitorId) return false;

    const existingNormalizedUrl = normalizeUrl(monitor.url);
    return existingNormalizedUrl === normalizedNewUrl;
  });
}

export async function getMonitorCheckById(dashboardId: string, monitorId: string): Promise<MonitorCheck | null> {
  const row = await prisma.monitorCheck.findFirst({
    where: { id: monitorId, dashboardId, deletedAt: null },
  });

  if (!row) return null;

  return MonitorCheckSchema.parse(row);
}

export async function createMonitorCheck(dashboardId: string, data: MonitorCheckCreate): Promise<MonitorCheck> {
  const created = await prisma.monitorCheck.create({
    data: {
      dashboardId,
      ...data,
      requestHeaders: data.requestHeaders ?? undefined,
    },
  });

  return MonitorCheckSchema.parse(created);
}

/**
 * Updates a monitor and records a pause or resume when `isEnabled` flips. Resuming a monitor
 * paused before pause times were recorded records its pause from `unrecordedPausedAt`.
 */
export async function updateMonitorCheck(
  dashboardId: string,
  data: MonitorCheckUpdate,
  options: { unrecordedPausedAt?: Date | null } = {},
): Promise<MonitorCheck> {
  const updated = await prisma.$transaction(async (tx) => {
    // Flipping isEnabled through a conditional update locks the row, so concurrent toggles
    // record one pause period, not two.
    const flipped =
      data.isEnabled === undefined
        ? 0
        : (
            await tx.monitorCheck.updateMany({
              where: { id: data.id, dashboardId, isEnabled: !data.isEnabled },
              data: { isEnabled: data.isEnabled },
            })
          ).count;

    if (flipped > 0) {
      const now = new Date();
      if (data.isEnabled === false) {
        await tx.monitorPausePeriod.create({ data: { monitorCheckId: data.id, pausedAt: now } });
      } else {
        const closed = await tx.monitorPausePeriod.updateMany({
          where: { monitorCheckId: data.id, resumedAt: null },
          data: { resumedAt: now },
        });
        if (closed.count === 0 && options.unrecordedPausedAt) {
          await tx.monitorPausePeriod.create({
            data: { monitorCheckId: data.id, pausedAt: options.unrecordedPausedAt, resumedAt: now },
          });
        }
      }
    }

    return tx.monitorCheck.update({
      where: {
        id_dashboardId: {
          id: data.id,
          dashboardId,
        },
      },
      data: {
        ...data,
        requestHeaders: data.requestHeaders ?? undefined,
      },
    });
  });

  return MonitorCheckSchema.parse(updated);
}

/** The monitors' pause periods, oldest first, with whether each monitor is enabled now. */
export async function listMonitorPauseState(
  dashboardId: string,
  monitorIds: string[],
): Promise<{ monitors: Array<{ id: string; isEnabled: boolean }>; pauses: MonitorPausePeriod[] }> {
  if (!monitorIds.length) return { monitors: [], pauses: [] };

  const rows = await prisma.monitorCheck.findMany({
    where: { id: { in: monitorIds }, dashboardId },
    select: {
      id: true,
      isEnabled: true,
      pausePeriods: {
        select: { monitorCheckId: true, pausedAt: true, resumedAt: true },
        orderBy: { pausedAt: 'asc' },
      },
    },
  });

  return {
    monitors: rows.map(({ id, isEnabled }) => ({ id, isEnabled })),
    pauses: rows.flatMap((row) => row.pausePeriods.map((pause) => MonitorPausePeriodSchema.parse(pause))),
  };
}

export async function deleteMonitorCheck(dashboardId: string, monitorId: string): Promise<void> {
  await prisma.monitorCheck.update({
    where: {
      id_dashboardId: {
        id: monitorId,
        dashboardId,
      },
    },
    data: { deletedAt: new Date() },
  });
}
