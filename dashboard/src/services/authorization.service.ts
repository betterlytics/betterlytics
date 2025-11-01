import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authorizeUserDashboard } from '@/services/auth.service';
import { env } from '@/lib/env';

export type DashboardAccess = {
  session: Session | null;
  isAuthorized: boolean;
  isDemo: boolean;
};

export async function getDashboardAccess(dashboardId: string): Promise<DashboardAccess> {
  const session = await getServerSession(authOptions);

  let isAuthorized = false;
  if (session?.user) {
    try {
      await authorizeUserDashboard(session.user.id, dashboardId);
      isAuthorized = true;
    } catch {}
  }

  const isDemo = !isAuthorized && Boolean(env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID);

  return { session, isAuthorized, isDemo };
}
