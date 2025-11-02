import BATopbar from '@/components/topbar/BATopbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import BASidebar from '@/components/sidebar/BASidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import ScrollReset from '@/components/ScrollReset';
import { Suspense } from 'react';
import { IntegrationManager } from '@/app/(protected)/dashboard/[dashboardId]/IntegrationManager';
import { TrackingScript } from '@/app/(protected)/dashboard/[dashboardId]/TrackingScript';

export type DashboardLayoutShellProps = {
  dashboardId: string;
  isDemo: boolean;
  basePath?: string;
  trackingSiteId?: string | null;
  includeIntegrationManager?: boolean;
  children: React.ReactNode;
};

export default function DashboardLayoutShell({
  dashboardId,
  isDemo,
  basePath = '/dashboard',
  trackingSiteId,
  includeIntegrationManager = true,
  children,
}: DashboardLayoutShellProps) {
  return (
    <section>
      <BATopbar />
      <SidebarProvider>
        <BASidebar dashboardId={dashboardId} isDemo={isDemo} basePath={basePath} />
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
  );
}
