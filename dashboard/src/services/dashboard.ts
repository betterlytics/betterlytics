'server-only';

import { Dashboard } from '@/entities/dashboard';
import {
  createDashboard,
  findAllDashboardsWithSiteConfig,
  findAllUserDashboards,
} from '@/repositories/postgres/dashboard';
import { ensureSiteConfig } from '@/services/siteConfig';
import { getUserSubscription } from '@/repositories/postgres/subscription';
import { generateSiteId } from '@/lib/site-id-generator';
import { getDashboardLimitForTier } from '@/lib/billing/plans';
import { UserException } from '@/lib/exceptions';
import { markOnboardingCompleted } from '@/repositories/postgres/user';
import { updateUserSettings } from '@/services/userSettings';
import { SupportedLanguages } from '@/constants/i18n';
import { ensureTermsAccepted } from '@/services/user.service';
import { writeConfigsBatch } from '@/repositories/redisConfigRepository';
import { createSiteConfigs } from '@/repositories/postgres/siteConfig';

export async function createNewDashboard(domain: string, userId: string): Promise<Dashboard> {
  await validateDashboardCreationLimit(userId);

  const siteId = generateSiteId(domain);
  const dashboardData = {
    domain,
    userId,
    siteId,
  };
  const dashboard = await createDashboard(dashboardData);

  try {
    await ensureSiteConfig(dashboard.id);
  } catch (e) {
    console.error('Failed to ensure site config after creation:', e);
  }
  return dashboard;
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

export async function completeOnboardingAndCreateDashboard(
  domain: string,
  userId: string,
  language: SupportedLanguages,
): Promise<Dashboard> {
  await ensureTermsAccepted(userId);
  const dashboard = await createNewDashboard(domain, userId);

  await updateUserSettings(userId, { language }).catch((e) =>
    console.error('Failed to set language during onboarding finalization:', e),
  );

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

export async function reconcileAllSiteConfigs(): Promise<{ processed: number }> {
  const items = await findAllDashboardsWithSiteConfig();

  const missingDashboardIds = items.filter((d) => !d.config).map((d) => d.dashboardId);
  if (missingDashboardIds.length > 0) {
    const created = await createSiteConfigs(missingDashboardIds);
    const createdByDashboardId = new Map(created.map((c) => [c.dashboardId, c]));
    for (const it of items) {
      if (!it.config) {
        const cfg = createdByDashboardId.get(it.dashboardId);
        if (cfg) it.config = cfg;
      }
    }
    const stillMissing = items.filter((d) => !d.config).map((d) => d.dashboardId);
    if (stillMissing.length > 0) {
      console.warn(
        `Warm-up: ${stillMissing.length} dashboards still missing configs after createMany. Example ids:`,
        stillMissing.slice(0, 10),
      );
    }
  }

  const chunkSize = 1000;
  let processed = 0;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const count = await writeConfigsBatch(
      chunk.map((d) => ({
        siteId: d.siteId,
        domain: d.domain,
        config: d.config
          ? {
              blacklistedIps: d.config.blacklistedIps,
              enforceDomain: d.config.enforceDomain,
              updatedAt: d.config.updatedAt,
            }
          : null,
      })),
    );
    processed += count;
  }

  return { processed };
}
