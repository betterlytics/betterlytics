import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { DashboardProvider } from '@/app/(protected)/dashboard/[dashboardId]/DashboardProvider';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { assertPublicDashboardAccess } from '@/services/auth.service';
import { useDemoMode } from '@/contexts/DemoModeContextProvider';

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
            isDemo={useDemoMode()}
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
