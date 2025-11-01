export const dynamic = 'force-static';
export const revalidate = 300;

import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';

type PublicLayoutProps = {
  params: Promise<{ locale: string; dashboardId: string }>;
  children: React.ReactNode;
};

export default async function PublicDashboardLayout({ params, children }: PublicLayoutProps) {
  const { locale, dashboardId } = await params;
  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  // IMPORTANT: Ensure the dashboard is public or demo here.
  // e.g., await assertPublicDashboardAccess(dashboardId)

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DemoModeProvider isDemo={true}>
          <DashboardLayoutShell
            dashboardId={dashboardId}
            isDemo={true}
            hasSession={false}
            basePath={`/${locale}/public`}
            trackingSiteId={null}
            includeIntegrationManager={false}
          >
            <div className='flex w-full justify-center'>{children}</div>
          </DashboardLayoutShell>
        </DemoModeProvider>
      </DashboardProvider>
    </PublicEnvironmentVariablesProvider>
  );
}
