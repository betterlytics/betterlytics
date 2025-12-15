import prisma from '@/lib/postgres';
import {
  MonitorCheckSchema,
  MonitorCheckCreateSchema,
  MonitorCheckUpdateSchema,
  type MonitorCheck,
  type MonitorCheckCreate,
  type MonitorCheckUpdate,
} from '@/entities/analytics/monitoring.entities';

export async function listMonitorChecks(dashboardId: string): Promise<MonitorCheck[]> {
  const results = await prisma.monitorCheck.findMany({
    where: { dashboardId },
    orderBy: { createdAt: 'desc' },
  });
  return results.map((row) => MonitorCheckSchema.parse(row));
}

export async function getMonitorCheckById(dashboardId: string, monitorId: string): Promise<MonitorCheck | null> {
  const row = await prisma.monitorCheck.findFirst({
    where: { id: monitorId, dashboardId },
  });
  if (!row) return null;
  return MonitorCheckSchema.parse(row);
}

export async function createMonitorCheck(input: MonitorCheckCreate): Promise<MonitorCheck> {
  const data = MonitorCheckCreateSchema.parse(input);

  const created = await prisma.monitorCheck.create({
    data: {
      dashboardId: data.dashboardId,
      name: data.name,
      url: data.url,
      intervalSeconds: data.intervalSeconds,
      timeoutMs: data.timeoutMs,
      isEnabled: data.isEnabled,
      checkSslErrors: data.checkSslErrors,
      sslExpiryReminders: data.sslExpiryReminders,
    },
  });

  return MonitorCheckSchema.parse(created);
}

export async function updateMonitorCheck(input: MonitorCheckUpdate): Promise<MonitorCheck> {
  const data = MonitorCheckUpdateSchema.parse(input);

  const existing = await prisma.monitorCheck.findFirst({
    where: { id: data.id, dashboardId: data.dashboardId },
  });

  if (!existing) {
    throw new Error('Monitor not found');
  }

  const updated = await prisma.monitorCheck.update({
    where: { id: data.id },
    data: {
      name: data.name,
      url: data.url,
      intervalSeconds: data.intervalSeconds,
      timeoutMs: data.timeoutMs,
      isEnabled: data.isEnabled,
      checkSslErrors: data.checkSslErrors,
      sslExpiryReminders: data.sslExpiryReminders,
    },
  });

  return MonitorCheckSchema.parse(updated);
}
