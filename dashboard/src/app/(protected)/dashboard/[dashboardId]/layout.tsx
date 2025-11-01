import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { env } from '@/lib/env';
import BASidebar from '@/components/sidebar/BASidebar';
import { DashboardProvider } from './DashboardProvider';
import { SidebarProvider } from '@/components/ui/sidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import { TrackingScript } from './TrackingScript';
import { fetchSiteId, getCurrentDashboardAction } from '@/app/actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { IntegrationManager } from './IntegrationManager';
import UsageAlertBanner from '@/components/billing/UsageAlertBanner';
import { getUserBillingData } from '@/actions/billing';
import { Suspense } from 'react';
import BATopbar from '@/components/topbar/BATopbar';
import ScrollReset from '@/components/ScrollReset';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { TermsRequiredModal } from '@/components/account/TermsRequiredModal';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { BannerProvider } from '@/contexts/BannerProvider';
import { IntegrationBanner } from './IntegrationBanner';
import UsageExceededBanner from '@/components/billing/UsageExceededBanner';
import { DemoModeProvider } from '@/contexts/DemoModeContextProvider';
import { getDashboardAccessAction } from '@/app/actions/authentication';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { dashboardId } = await params;
  const { session, isDemo: isDemoDashboard } = await getDashboardAccessAction(dashboardId);

  if (!session && !isDemoDashboard) {
    redirect('/');
  }

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

  let billingDataPromise;
  if (billingEnabled && session) {
    billingDataPromise = getUserBillingData();
  }

  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  const mustAcceptTerms = session
    ? !session.user.termsAcceptedAt || session.user.termsAcceptedVersion !== CURRENT_TERMS_VERSION
    : false;

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DemoModeProvider isDemo={isDemoDashboard}>
          <section>
            <BATopbar />
            <SidebarProvider>
              <BASidebar dashboardId={dashboardId} isDemo={isDemoDashboard} hasSession={!!session} />
              <BAMobileSidebarTrigger />
              <main className='bg-background w-full overflow-x-hidden'>
                {!isDemoDashboard ? (
                  <BannerProvider>
                    <ScrollReset />
                    {billingEnabled && billingDataPromise && (
                      <Suspense fallback={null}>
                        <UsageAlertBanner billingDataPromise={billingDataPromise} />
                        <UsageExceededBanner billingDataPromise={billingDataPromise} />
                      </Suspense>
                    )}
                    {session && isFeatureEnabled('enableAccountVerification') && (
                      <VerificationBanner email={session.user.email} isVerified={!!session.user.emailVerified} />
                    )}
                    <Suspense>
                      <IntegrationBanner />
                    </Suspense>
                    <div className='flex w-full justify-center'>{children}</div>
                    {session && mustAcceptTerms && <TermsRequiredModal isOpen={true} />}
                  </BannerProvider>
                ) : (
                  <>
                    <ScrollReset />
                    <div className='flex w-full justify-center'>{children}</div>
                  </>
                )}
              </main>
              {/* Conditionally render tracking script based on server-side feature flag */}
              {shouldEnableTracking && siteId && <TrackingScript siteId={siteId} />}
              <Suspense>
                <IntegrationManager />
              </Suspense>
            </SidebarProvider>
          </section>
        </DemoModeProvider>
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
