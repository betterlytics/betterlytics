import type { Metadata } from 'next';
import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DashboardAuthProvider } from '@/contexts/DashboardAuthProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { getPublicEnvironmentVariables } from '@/services/system/environment.service';
import { assertPublicDashboardAccess } from '@/services/auth/auth.service';
import { getDashboardSettingsAction } from '@/app/actions/dashboard/dashboardSettings.action';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import TimezoneCookieInitializer from '@/app/(protected)/TimezoneCookieInitializer';

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/share/[dashboardId]'>): Promise<Metadata> {
  const { locale, dashboardId } = await params;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.publicDemo);
  const config = {
    ...seoConfig,
    path: `/share/${dashboardId}`,
  };

  return generateSEO(config, {
    locale: locale,
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        'max-image-preview': 'none',
        'max-snippet': 0,
        'max-video-preview': 0,
      },
    },
  });
}

export default async function PublicDashboardLayout({
  params,
  children,
}: LayoutProps<'/[locale]/share/[dashboardId]'>) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = getPublicEnvironmentVariables();

  await assertPublicDashboardAccess(dashboardId);
  const initialSettings = await getDashboardSettingsAction(dashboardId);

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <TimezoneCookieInitializer />
      <DashboardAuthProvider isDemo={true} role='viewer'>
        <DashboardProvider initialSettings={initialSettings}>
          <DashboardLayoutShell
            dashboardId={dashboardId}
            isDemo={true}
            basePath={`/${locale}/share`}
            includeIntegrationManager={false}
          >
            <div className='flex w-full justify-center'>{children}</div>
          </DashboardLayoutShell>
        </DashboardProvider>
      </DashboardAuthProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
