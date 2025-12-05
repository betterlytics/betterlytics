'use server';

import { Dashboard } from '@/entities/dashboard/dashboard';
import { withUserAuth, withDashboardAuthContext, withDashboardMutationAuthContext } from '@/auth/auth-actions';
import { createNewDashboard, getAllUserDashboards, getUserDashboardStats } from '@/services/dashboard/dashboard';
import {
  findFirstUserDashboard,
  findDashboardById,
  deleteDashboard,
} from '@/repositories/postgres/dashboard.repository';
import { User } from 'next-auth';
import { AuthContext } from '@/entities/auth/authContext';

export const createDashboardAction = withUserAuth(async (user: User, domain: string): Promise<Dashboard> => {
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
  return getUserDashboardStats(user.id);
});
