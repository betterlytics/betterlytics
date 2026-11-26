'server-only';

import { Dashboard, DashboardWithMemberCount } from '@/entities/dashboard/dashboard.entities';
import {
  createDashboard,
  createDashboardCompletingOnboarding,
  findAllUserDashboards,
  findOwnedDashboards,
  findSoleUserDashboard,
  updateDashboardDomain as updateDashboardDomainRepo,
} from '@/repositories/postgres/dashboard.repository';
import { generateSiteId } from '@/lib/site-id-generator';
import { updateUserSettings } from '@/services/account/userSettings.service';
import { SupportedLanguages } from '@/constants/i18n';
import { ensureTermsAccepted } from '@/services/auth/user.service';
import { UserException } from '@/lib/exceptions';
import { ONBOARDING_ALREADY_COMPLETE } from '@/constants/onboarding';
import { getTranslations } from 'next-intl/server';

export async function createNewDashboard(domain: string, userId: string): Promise<Dashboard> {
  const siteId = generateSiteId(domain);
  return await createDashboard({ domain, userId, siteId });
}

export async function getAllUserDashboards(userId: string): Promise<DashboardWithMemberCount[]> {
  return findAllUserDashboards(userId);
}

export async function getSoleUserDashboard(userId: string): Promise<Dashboard | null> {
  return findSoleUserDashboard(userId);
}

export async function getOwnedDashboards(userId: string): Promise<Dashboard[]> {
  return findOwnedDashboards(userId);
}

export async function completeOnboardingAndCreateDashboard(
  domain: string,
  userId: string,
  language: SupportedLanguages,
  assertWithinLimit: (ownedCount: number) => Promise<void>,
): Promise<Dashboard> {
  await ensureTermsAccepted(userId);
  const siteId = generateSiteId(domain);
  const dashboard = await createDashboardCompletingOnboarding({ domain, userId, siteId }, assertWithinLimit);

  if (!dashboard) {
    const t = await getTranslations('validation');
    throw new UserException(t('onboardingAlreadyComplete'), ONBOARDING_ALREADY_COMPLETE);
  }

  await updateUserSettings(userId, { language }).catch((e) =>
    console.error('Failed to set language during onboarding finalization:', e),
  );

  return dashboard;
}

export async function updateDashboardDomain(dashboardId: string, domain: string): Promise<Dashboard> {
  return await updateDashboardDomainRepo(dashboardId, domain);
}
