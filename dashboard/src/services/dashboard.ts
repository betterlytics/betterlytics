'server-only';

import { Dashboard } from '@/entities/dashboard';
import { createDashboard, findFirstUserDashboard, findAllUserDashboards } from '@/repositories/postgres/dashboard';
import { generateSiteId } from '@/lib/site-id-generator';

export async function createNewDashboard(domain: string, userId: string): Promise<Dashboard> {
  const siteId = generateSiteId(domain);
  const dashboardData = {
    domain,
    userId,
    siteId,
  };
  return createDashboard(dashboardData);
}

export async function getFirstUserDashboard(userId: string): Promise<Dashboard | null> {
  return findFirstUserDashboard(userId);
}

export async function getAllUserDashboards(userId: string): Promise<Dashboard[]> {
  return findAllUserDashboards(userId);
}
