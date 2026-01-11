'use server';

import { Dashboard, DashboardWithMemberCount, domainValidation } from '@/entities/dashboard/dashboard.entities';
import { withUserAuth, withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import {
  createNewDashboard,
  getAllUserDashboards,
  updateDashboardDomain,
} from '@/services/dashboard/dashboard.service';
import {
  findFirstUserDashboard,
  findDashboardById,
  deleteDashboard,
  findOwnedDashboards,
} from '@/repositories/postgres/dashboard.repository';
import { User } from 'next-auth';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { getUserCapabilities } from '@/lib/billing/capabilityAccess';
import { dashboardValidator } from '@/lib/billing/validators';

export const createDashboardAction = withUserAuth(async (user: User, domain: string): Promise<Dashboard> => {
  const caps = await getUserCapabilities();
  const validator = await dashboardValidator(caps.dashboards);

  await validator.dashboardLimit(() => findOwnedDashboards(user.id).then((d) => d.length)).validate();

  return createNewDashboard(domain, user.id);
});

export const deleteDashboardAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext): Promise<void> => {
    return deleteDashboard(ctx.dashboardId);
  },
  { permission: 'canDeleteDashboard' },
);

export const getFirstUserDashboardAction = withUserAuth(async (user: User): Promise<Dashboard | null> => {
  return findFirstUserDashboard(user.id);
});

export const getAllUserDashboardsAction = withUserAuth(async (user: User): Promise<DashboardWithMemberCount[]> => {
  return getAllUserDashboards(user.id);
});

export const getCurrentDashboardAction = withDashboardAuthContext(async (ctx: AuthContext): Promise<Dashboard> => {
  return findDashboardById(ctx.dashboardId);
});

export const getUserDashboardStatsAction = withUserAuth(async (user: User) => {
  const caps = await getUserCapabilities();
  const ownedDashboards = await findOwnedDashboards(user.id);

  return {
    current: ownedDashboards.length,
    limit: caps.dashboards.maxDashboards,
    canCreateMore: ownedDashboards.length < caps.dashboards.maxDashboards,
  };
});

export const updateDashboardDomainAction = withDashboardMutationAuthContext(
  async (ctx: AuthContext, domain: string): Promise<Dashboard> => {
    const validated = domainValidation.parse(domain);
    return updateDashboardDomain(ctx.dashboardId, validated);
  },
  { permission: 'canManageSettings' },
);
