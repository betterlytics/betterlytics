import BATopbar from '@/components/topbar/BATopbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import BASidebar from '@/components/sidebar/BASidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import ScrollReset from '@/components/ScrollReset';
import { Suspense } from 'react';
import { IntegrationManager } from '@/app/(protected)/dashboard/[dashboardId]/IntegrationManager';
import { TrackingScript } from '@/app/(protected)/dashboard/[dashboardId]/TrackingScript';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { fetchSiteId } from '@/app/actions/index.action';
import { DashboardNavigationProvider } from '@/contexts/DashboardNavigationContext';

export type DashboardLayoutShellProps = {
  dashboardId: string;
  isDemo: boolean;
  basePath?: string;
  includeIntegrationManager?: boolean;
  children: React.ReactNode;
};

export default async function DashboardLayoutShell({
  dashboardId,
  isDemo,
  basePath = '/dashboard',
  includeIntegrationManager = true,
  children,
}: DashboardLayoutShellProps) {
  const shouldEnableTracking = isFeatureEnabled('enableDashboardTracking');
  let trackingSiteId: string | null = null;

  if (shouldEnableTracking) {
    try {
      trackingSiteId = await fetchSiteId(dashboardId);
    } catch (error) {
      console.error('Failed to fetch site ID for tracking:', error);
    }
  }

  return (
    <DashboardNavigationProvider basePath={basePath} dashboardId={dashboardId} isDemo={isDemo}>
      <section>
        <BATopbar />
        <SidebarProvider>
          <BASidebar dashboardId={dashboardId} isDemo={isDemo} />
          <BAMobileSidebarTrigger />
          <main className='bg-background w-full overflow-x-hidden'>
            <ScrollReset />
            {children}
          </main>
          {trackingSiteId && <TrackingScript siteId={trackingSiteId} />}
          {includeIntegrationManager && (
            <Suspense>
              <IntegrationManager />
            </Suspense>
          )}
        </SidebarProvider>
      </section>
    </DashboardNavigationProvider>
  );
}
