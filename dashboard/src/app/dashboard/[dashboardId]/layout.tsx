import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import BASidebar from '@/components/sidebar/BASidebar';
import { DashboardProvider } from './DashboardProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import { TrackingScript } from './TrackingScript';
import { fetchSiteId, getCurrentDashboardAction } from '@/app/actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { IntegrationManager } from './IntegrationManager';
import UsageUpgradeBanner from '@/components/billing/UsageUpgradeBanner';
import { getUserBillingData } from '@/actions/billing';
import { Suspense } from 'react';
import BATopbar from '@/components/topbar/BATopbar';
import ScrollReset from '@/components/ScrollReset';
import { VerificationNotificationHandler } from '@/components/accountVerification/VerificationNotification';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { NotificationProvider } from '@/contexts/NotificationProvider';

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
  const billingEnabled = isClientFeatureEnabled('enableBilling');
  let siteId: string | null = null;

  if (shouldEnableTracking) {
    try {
      siteId = await fetchSiteId(dashboardId);
    } catch (error) {
      console.error('Failed to fetch site ID for tracking:', error);
    }
  }

  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <section>
          <BATopbar />
          <SidebarProvider>
            <BASidebar dashboardId={dashboardId} />
            <BAMobileSidebarTrigger />
            <main className='bg-background w-full overflow-x-hidden'>
              <NotificationProvider>
                <ScrollReset />
                {billingEnabled && (
                  <Suspense fallback={null}>
                    <UsageUpgradeBanner billingDataPromise={getUserBillingData()} />
                  </Suspense>
                )}
                {isFeatureEnabled('enableAccountVerification') &&
                  session.user?.email &&
                  !session.user?.emailVerified && <VerificationNotificationHandler email={session.user.email} />}
                <div className='flex w-full justify-center'>{children}</div>
              </NotificationProvider>
            </main>
            {/* Conditionally render tracking script based on server-side feature flag */}
            {shouldEnableTracking && siteId && <TrackingScript siteId={siteId} />}
            <Suspense>
              <IntegrationManager />
            </Suspense>
          </SidebarProvider>
        </section>
      </DashboardProvider>
    </PublicEnvironmentVariablesProvider>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ dashboardId: string }> }) {
  const { dashboardId } = await params;
  const dashboard = await getCurrentDashboardAction(dashboardId);

  return {
    title: `Betterlytics | ${dashboard.domain}`,
  };
}
