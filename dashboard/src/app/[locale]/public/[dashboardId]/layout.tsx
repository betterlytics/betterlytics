import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { assertPublicDashboardAccess } from '@/services/auth.service';
import { fetchSiteId } from '@/app/actions';
import { isFeatureEnabled } from '@/lib/feature-flags';

type PublicLayoutProps = {
  params: Promise<{ locale: string; dashboardId: string }>;
  children: React.ReactNode;
};

export default async function PublicDashboardLayout({ params, children }: PublicLayoutProps) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  await assertPublicDashboardAccess(dashboardId);

  const shouldEnableTracking = isFeatureEnabled('enableDashboardTracking');
  let siteId: string | null = null;

  if (shouldEnableTracking) {
    try {
      siteId = await fetchSiteId(dashboardId);
    } catch (error) {
      console.error('Failed to fetch site ID for tracking:', error);
    }
  }

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DemoModeProvider isDemo={true}>
          <DashboardLayoutShell
            dashboardId={dashboardId}
            isDemo={true}
            basePath={`/${locale}/public`}
            trackingSiteId={shouldEnableTracking && siteId ? siteId : null}
            includeIntegrationManager={false}
          >
            <div className='flex w-full justify-center'>{children}</div>
          </DashboardLayoutShell>
        </DemoModeProvider>
      </DashboardProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
