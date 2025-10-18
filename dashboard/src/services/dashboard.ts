'server-only';

import { Dashboard } from '@/entities/dashboard';
import { createDashboard, findAllUserDashboards } from '@/repositories/postgres/dashboard';
import { getUserSubscription } from '@/repositories/postgres/subscription';
import { generateSiteId } from '@/lib/site-id-generator';
import { getDashboardLimitForTier } from '@/lib/billing/plans';
import { UserException } from '@/lib/exceptions';
import { markOnboardingCompleted } from '@/repositories/postgres/user';
import { ensureTermsAccepted } from '@/services/user.service';

export async function createNewDashboard(domain: string, userId: string): Promise<Dashboard> {
  await validateDashboardCreationLimit(userId);

  const siteId = generateSiteId(domain);
  const dashboardData = {
    domain,
    userId,
    siteId,
  };
  return createDashboard(dashboardData);
}

export async function getAllUserDashboards(userId: string): Promise<Dashboard[]> {
  return findAllUserDashboards(userId);
}

export async function validateDashboardCreationLimit(userId: string): Promise<void> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error('No subscription found for user');
  }

  const currentDashboards = await findAllUserDashboards(userId);
  const dashboardLimit = getDashboardLimitForTier(subscription.tier);

  if (currentDashboards.length >= dashboardLimit) {
    throw new UserException(`Dashboard limit reached`);
  }
}

export async function completeOnboardingAndCreateDashboard(domain: string, userId: string): Promise<Dashboard> {
  await ensureTermsAccepted(userId);
  const dashboard = await createNewDashboard(domain, userId);
  await markOnboardingCompleted(userId);
  return dashboard;
}

export async function getUserDashboardStats(userId: string): Promise<{
  current: number;
  limit: number;
  canCreateMore: boolean;
}> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error('No subscription found for user');
  }

  const currentDashboards = await findAllUserDashboards(userId);
  const dashboardLimit = getDashboardLimitForTier(subscription.tier);

  return {
    current: currentDashboards.length,
    limit: dashboardLimit,
    canCreateMore: currentDashboards.length < dashboardLimit,
  };
}
