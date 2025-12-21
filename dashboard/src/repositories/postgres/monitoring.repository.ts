import prisma from '@/lib/postgres';
import {
  MonitorCheckSchema,
  MonitorCheckCreateSchema,
  MonitorCheckUpdateSchema,
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
    where: { dashboardId },
    orderBy: { createdAt: 'desc' },
  });
  return results.map((row) => MonitorCheckSchema.parse(row));
}

/**
 * Checks if a monitor already exists for the given hostname within a dashboard.
 */
export async function monitorExistsForHostname(
  dashboardId: string,
  url: string,
  excludeMonitorId?: string,
): Promise<boolean> {
  const hostname = getHostnameFromUrl(url);
  if (!hostname) return false;

  const existingMonitors = await prisma.monitorCheck.findMany({
    where: { dashboardId },
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
      httpMethod: data.httpMethod,
      requestHeaders: data.requestHeaders ?? undefined,
      acceptedStatusCodes: data.acceptedStatusCodes,
      // Alert configuration
      alertsEnabled: data.alertsEnabled,
      alertEmails: data.alertEmails,
      alertOnDown: data.alertOnDown,
      alertOnRecovery: data.alertOnRecovery,
      alertOnSslExpiry: data.alertOnSslExpiry,
      sslExpiryAlertDays: data.sslExpiryAlertDays,
      failureThreshold: data.failureThreshold,
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
      httpMethod: data.httpMethod,
      requestHeaders: data.requestHeaders ?? undefined,
      acceptedStatusCodes: data.acceptedStatusCodes,
      // Alert configuration
      alertsEnabled: data.alertsEnabled,
      alertEmails: data.alertEmails,
      alertOnDown: data.alertOnDown,
      alertOnRecovery: data.alertOnRecovery,
      alertOnSslExpiry: data.alertOnSslExpiry,
      sslExpiryAlertDays: data.sslExpiryAlertDays,
      failureThreshold: data.failureThreshold,
    },
  });

  return MonitorCheckSchema.parse(updated);
}

export async function deleteMonitorCheck(dashboardId: string, monitorId: string): Promise<void> {
  const existing = await prisma.monitorCheck.findFirst({
    where: { id: monitorId, dashboardId },
  });

  if (!existing) {
    throw new Error('Monitor not found');
  }

  await prisma.monitorCheck.delete({
    where: { id: monitorId },
  });
}
