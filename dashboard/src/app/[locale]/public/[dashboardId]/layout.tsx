import type { Metadata } from 'next';
import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { assertPublicDashboardAccess } from '@/services/auth.service';
import { SUPPORTED_LANGUAGES, type SupportedLanguages } from '@/constants/i18n';
import { routing } from '@/i18n/routing';
import { buildSEOConfig, generateSEO, SEO_CONFIGS } from '@/lib/seo';

const isSupportedLocale = (candidate: string): candidate is SupportedLanguages =>
  SUPPORTED_LANGUAGES.some((supportedLocale) => supportedLocale === candidate);

type PublicLayoutProps = {
  params: Promise<{ locale: string; dashboardId: string }>;
  children: React.ReactNode;
};

export default async function PublicDashboardLayout({ params, children }: PublicLayoutProps) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  await assertPublicDashboardAccess(dashboardId);

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DemoModeProvider isDemo={true}>
          <DashboardLayoutShell
            dashboardId={dashboardId}
            isDemo={true}
            basePath={`/${locale}/public`}
            includeIntegrationManager={false}
          >
            <div className='flex w-full justify-center'>{children}</div>
          </DashboardLayoutShell>
        </DemoModeProvider>
      </DashboardProvider>
    </PublicEnvironmentVariablesProvider>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; dashboardId: string }>;
}): Promise<Metadata> {
  const { locale, dashboardId } = await params;
  const resolvedLocale = isSupportedLocale(locale) ? locale : routing.defaultLocale;
  const seoConfig = await buildSEOConfig(SEO_CONFIGS.publicDemo);
  const config = {
    ...seoConfig,
    path: `/public/${dashboardId}`,
  };

  return generateSEO(config, {
    locale: resolvedLocale,
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
