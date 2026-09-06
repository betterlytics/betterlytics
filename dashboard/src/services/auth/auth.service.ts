'server-only';

import { findUserDashboardWithDashboardOrNull } from '@/repositories/postgres/dashboard.repository';
import { env } from '@/lib/env';
import { AuthContextSchema } from '@/entities/auth/authContext.entities';
import { notFound } from 'next/navigation';
import { DashboardFindByUserData } from '@/entities/dashboard/dashboard.entities';

export async function getAuthorizedDashboardContextOrNull(data: DashboardFindByUserData) {
  const result = await findUserDashboardWithDashboardOrNull(data);

  if (!result) return null;

  const { dashboardUser, dashboard } = result;

  return AuthContextSchema.parse({
    role: dashboardUser.role,
    userId: dashboardUser.userId,
    dashboardId: dashboard.id,
    siteId: dashboard.siteId,
    isDemo: false,
  });
}

export async function assertPublicDashboardAccess(dashboardId: string): Promise<void> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) return;
  notFound();
}
