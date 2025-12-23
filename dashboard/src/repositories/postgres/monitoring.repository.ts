import prisma from '@/lib/postgres';
import {
  MonitorCheckSchema,
  type MonitorCheck,
  type MonitorCheckCreate,
  type MonitorCheckUpdate,
} from '@/entities/analytics/monitoring.entities';

function getHostnameFromUrl(url: string): string | null {
  try {
    return new URL(url.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export async function listMonitorChecks(dashboardId: string): Promise<MonitorCheck[]> {
  const results = await prisma.monitorCheck.findMany({
    where: { dashboardId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return results.map((row) => MonitorCheckSchema.parse(row));
}

export async function monitorExistsForHostname(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  const hostname = getHostnameFromUrl(url);
  if (!hostname) return false;

  const existingMonitors = await prisma.monitorCheck.findMany({
    where: { dashboardId, deletedAt: null },
    select: { id: true, url: true },
  });

  return existingMonitors.some((monitor) => {
    if (excludeMonitorId && monitor.id === excludeMonitorId) return false;

    const existingHostname = getHostnameFromUrl(monitor.url);
    return existingHostname === hostname;
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

export async function updateMonitorCheck(dashboardId: string, data: MonitorCheckUpdate): Promise<MonitorCheck> {
  const updated = await prisma.monitorCheck.update({
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

  return MonitorCheckSchema.parse(updated);
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
