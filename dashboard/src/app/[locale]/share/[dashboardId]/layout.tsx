import type { Metadata } from 'next';
import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions/index.action';
import { assertPublicDashboardAccess } from '@/services/auth/auth.service';
import { type SupportedLanguages } from '@/constants/i18n';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';
import TimezoneCookieInitializer from '@/app/(protected)/TimezoneCookieInitializer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: SupportedLanguages; dashboardId: string }>;
}): Promise<Metadata> {
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

type PublicLayoutProps = {
  params: Promise<{ locale: SupportedLanguages; dashboardId: string }>;
  children: React.ReactNode;
};

export default async function PublicDashboardLayout({ params, children }: PublicLayoutProps) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  await assertPublicDashboardAccess(dashboardId);

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <TimezoneCookieInitializer />
      <DashboardProvider>
        <DemoModeProvider isDemo={true}>
          <DashboardLayoutShell
            dashboardId={dashboardId}
            isDemo={true}
            basePath={`/${locale}/share`}
            includeIntegrationManager={false}
          >
            <div className='flex w-full justify-center'>{children}</div>
          </DashboardLayoutShell>
        </DemoModeProvider>
      </DashboardProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
