import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BASidebar from '@/components/sidebar/BASidebar';
import { DashboardProvider } from './DashboardProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import { TrackingScript } from './TrackingScript';
import { fetchSiteId } from '@/app/actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { IntegrationManager } from './IntegrationManager';
import { Suspense } from 'react';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/');
  }

  const { dashboardId } = await params;

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
    <DashboardProvider>
      <SidebarProvider>
        <BASidebar dashboardId={dashboardId} />
        <BAMobileSidebarTrigger />
        <main className='bg-background w-full max-w-svw overflow-x-hidden'>{children}</main>
        {/* Conditionally render tracking script based on server-side feature flag */}
        {shouldEnableTracking && siteId && <TrackingScript siteId={siteId} />}

        <Suspense>
          <IntegrationManager />
        </Suspense>
      </SidebarProvider>
    </DashboardProvider>
  );
}
