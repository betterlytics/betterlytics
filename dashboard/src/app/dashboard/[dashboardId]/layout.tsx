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
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { IntegrationManager } from './IntegrationManager';
import UsageUpgradeBanner from '@/components/billing/UsageUpgradeBanner';
import { getUserBillingData } from '@/actions/billing';
import { Suspense } from 'react';
import BATopbar from '@/components/topbar/BATopbar';
import ScrollReset from '@/components/ScrollReset';
import { getDictionary } from '@/app/actions/dictionary';
import DictionaryProvider from '@/contexts/DictionaryContextProvider';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';

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
  const { dictionary, language } = await getDictionary();

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

  return (
    <DashboardProvider>
      <DictionaryProvider dictionary={dictionary} initialLanguage={language}>
        <section>
          <BATopbar />
          <SidebarProvider>
            <BASidebar dashboardId={dashboardId} />
            <BAMobileSidebarTrigger />
            <main className='bg-background box-border flex w-full flex-col overflow-x-hidden'>
              <ScrollReset />
              {billingEnabled && (
                <Suspense fallback={null}>
                  <UsageUpgradeBanner billingDataPromise={getUserBillingData()} />
                </Suspense>
              )}
              {isFeatureEnabled('enableAccountVerification') &&
                session.user?.email &&
                !session.user?.emailVerified && (
                  <div className='mx-auto max-w-7xl px-4 pt-4'>
                    <VerificationBanner email={session.user.email} userName={session.user.name || undefined} />
                  </div>
                )}

              <div className='relative flex h-full w-full justify-center'>{children}</div>
            </main>
            {/* Conditionally render tracking script based on server-side feature flag */}
            {shouldEnableTracking && siteId && <TrackingScript siteId={siteId} />}
            <Suspense>
              <IntegrationManager />
            </Suspense>
          </SidebarProvider>
        </section>
      </DictionaryProvider>
    </DashboardProvider>
  );
}
