import type { Metadata } from 'next';
import DashboardLayoutShell from '@/app/(app)/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthProvider';
import { DashboardProvider } from '@/app/(app)/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { BillingFlowProvider } from '@/contexts/BillingFlowProvider';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { assertPublicDashboardAccess, isPublicDashboardId } from '@/services/auth/auth.service';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { getCurrentDashboardAction } from '@/app/actions/dashboard/dashboard.action';
import { type SupportedLanguages } from '@/constants/i18n';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import { isFeatureEnabled } from '@/lib/feature-flags';
import TimezoneCookieInitializer from '@/app/(app)/(protected)/TimezoneCookieInitializer';
import { UserSettingsProvider } from '@/contexts/UserSettingsProvider';
import { getCachedUserSettings } from '@/services/account/userSettings.service';
import { getAuthSession } from '@/auth/auth-actions';

const SHARE_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
    'max-image-preview': 'none',
    'max-snippet': 0,
    'max-video-preview': 0,
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages; dashboardId: string }>;
}): Promise<Metadata> {
  const { locale, dashboardId } = await params;

  // Every other id 404s in the layout. Never look it up here: a title would leak a private dashboard's domain.
  if (!isPublicDashboardId(dashboardId)) return { robots: SHARE_ROBOTS };

  const seoConfig = isFeatureEnabled('isCloud')
    ? await buildSEOConfig(SEO_CONFIGS.publicDemo)
    : await buildSEOConfig(SEO_CONFIGS.publicDashboardSelfHosted, {
        domain: (await getCurrentDashboardAction(dashboardId)).domain,
      });

  return generateSEO({ ...seoConfig, path: `/share/${dashboardId}` }, { locale, robots: SHARE_ROBOTS });
}

type PublicLayoutProps = {
  params: Promise<{ locale: string; dashboardId: string }>;
  children: React.ReactNode;
};

export default async function PublicDashboardLayout({ params, children }: PublicLayoutProps) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = getPublicEnvironmentVariables();

  await assertPublicDashboardAccess(dashboardId);
  const [initialSettings, session] = await Promise.all([
    getDashboardSettingsAction(dashboardId),
    getAuthSession(),
  ]);
  const userSettings = session?.user ? await getCachedUserSettings(session.user.id) : null;

  const shell = (
    <DashboardLayoutShell
      dashboardId={dashboardId}
      isDemo={true}
      basePath={`/${locale}/share`}
      includeIntegrationManager={false}
    >
      <div className='flex w-full justify-center'>{children}</div>
    </DashboardLayoutShell>
  );

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <TimezoneCookieInitializer />
      <DashboardAuthProvider isDemo={true} role='viewer'>
        <DashboardProvider initialSettings={initialSettings}>
          <BillingFlowProvider>
            {userSettings ? (
              <UserSettingsProvider initialSettings={userSettings}>{shell}</UserSettingsProvider>
            ) : (
              shell
            )}
          </BillingFlowProvider>
        </DashboardProvider>
      </DashboardAuthProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
