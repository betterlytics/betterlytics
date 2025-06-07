'use server';

import { Dashboard } from '@/entities/dashboard';
import { withUserAuth } from '@/auth/auth-actions';
import { createNewDashboard, getAllUserDashboards } from '@/services/dashboard';
import { findFirstUserDashboard } from '@/repositories/postgres/dashboard';

export const createDashboardAction = withUserAuth(async (userId: string, domain: string): Promise<Dashboard> => {
  return createNewDashboard(domain, userId);
});

export const getFirstUserDashboardAction = withUserAuth(async (userId: string): Promise<Dashboard | null> => {
  return findFirstUserDashboard(userId);
});

export const getAllUserDashboardsAction = withUserAuth(async (userId: string): Promise<Dashboard[]> => {
  return getAllUserDashboards(userId);
});
