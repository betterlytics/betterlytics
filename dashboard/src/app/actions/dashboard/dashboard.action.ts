'use server';

import { Dashboard } from '@/entities/dashboard/dashboard.entities';
import { withUserAuth, withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { createNewDashboard, getAllUserDashboards } from '@/services/dashboard/dashboard.service';
import {
  findFirstUserDashboard,
  findDashboardById,
  deleteDashboard,
  findAllUserDashboards,
} from '@/repositories/postgres/dashboard.repository';
import { User } from 'next-auth';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getCapabilities } from '@/lib/billing/capabilityAccess';
import { dashboardValidator } from '@/lib/billing/validators';

export const createDashboardAction = withUserAuth(async (user: User, domain: string): Promise<Dashboard> => {
  const caps = await getCapabilities();
  const validator = await dashboardValidator(caps.dashboards);

  await validator.dashboardLimit(() => findAllUserDashboards(user.id).then((d) => d.length)).validate();

  return createNewDashboard(domain, user.id);
});

export const deleteDashboardAction = withDashboardMutationAuthContext(async (ctx: AuthContext): Promise<void> => {
  return deleteDashboard(ctx.dashboardId);
});

export const getFirstUserDashboardAction = withUserAuth(async (user: User): Promise<Dashboard | null> => {
  return findFirstUserDashboard(user.id);
});

export const getAllUserDashboardsAction = withUserAuth(async (user: User): Promise<Dashboard[]> => {
  return getAllUserDashboards(user.id);
});

export const getCurrentDashboardAction = withDashboardAuthContext(async (ctx: AuthContext): Promise<Dashboard> => {
  return findDashboardById(ctx.dashboardId);
});

export const getUserDashboardStatsAction = withUserAuth(async (user: User) => {
  const caps = await getCapabilities();
  const currentDashboards = await findAllUserDashboards(user.id);

  return {
    current: currentDashboards.length,
    limit: caps.dashboards.maxDashboards,
    canCreateMore: currentDashboards.length < caps.dashboards.maxDashboards,
  };
});
