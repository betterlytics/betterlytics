'server-only';

import { Dashboard, DashboardWithMemberCount } from '@/entities/dashboard/dashboard.entities';
import {
  createDashboard,
  findAllUserDashboards,
  findOwnedDashboards,
  updateDashboardDomain as updateDashboardDomainRepo,
} from '@/repositories/postgres/dashboard.repository';
import { generateSiteId } from '@/lib/site-id-generator';
import { markOnboardingCompleted } from '@/repositories/postgres/user.repository';
import { updateUserSettings } from '@/services/account/userSettings.service';
import { SupportedLanguages } from '@/constants/i18n';
import { ensureTermsAccepted } from '@/services/auth/user.service';

export async function createNewDashboard(domain: string, userId: string): Promise<Dashboard> {
  const siteId = generateSiteId(domain);
  return await createDashboard({ domain, userId, siteId });
}

export async function getAllUserDashboards(userId: string): Promise<DashboardWithMemberCount[]> {
  return findAllUserDashboards(userId);
}

export async function getOwnedDashboards(userId: string): Promise<Dashboard[]> {
  return findOwnedDashboards(userId);
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

export async function updateDashboardDomain(dashboardId: string, domain: string): Promise<Dashboard> {
  return await updateDashboardDomainRepo(dashboardId, domain);
}
