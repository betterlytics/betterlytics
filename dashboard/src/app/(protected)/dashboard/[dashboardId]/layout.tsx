import { redirect } from 'next/navigation';
import { DashboardProvider } from './DashboardProvider';
import { getCurrentDashboardAction } from '@/app/actions/index.actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import UsageAlertBanner from '@/components/billing/UsageAlertBanner';
import { getUserBillingData } from '@/actions/billing.action';
import { Suspense } from 'react';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { fetchPublicEnvironmentVariablesAction, fetchSiteId } from '@/app/actions/index.actions';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { TermsRequiredModal } from '@/components/account/TermsRequiredModal';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { BannerProvider } from '@/contexts/BannerProvider';
import { IntegrationBanner } from './IntegrationBanner';
import UsageExceededBanner from '@/components/billing/UsageExceededBanner';
import { env } from '@/lib/env';
import { getCachedAuthorizedContext, requireAuth } from '@/auth/auth-actions';
import BATopbar from '@/components/topbar/BATopbar';
import ScrollReset from '@/components/ScrollReset';
import { IntegrationManager } from './IntegrationManager';
import { TrackingScript } from './TrackingScript';
import { DashboardNavigationProvider } from '@/contexts/DashboardNavigationContext';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const session = await requireAuth();

  const { dashboardId } = await params;

  const authCtx = await getCachedAuthorizedContext(session.user.id, dashboardId);

  if (!authCtx) {
    if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
      redirect(`/share/${dashboardId}`);
    }
    redirect('/signin');
  }

  const billingEnabled = isClientFeatureEnabled('enableBilling');

  let billingDataPromise;
  if (billingEnabled) {
    billingDataPromise = getUserBillingData();
  }

  const publicEnvironmentVariables = await fetchPublicEnvironmentVariablesAction();

  const mustAcceptTerms =
    isClientFeatureEnabled('isCloud') &&
    (!session.user.termsAcceptedAt || session.user.termsAcceptedVersion !== CURRENT_TERMS_VERSION);

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
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DashboardNavigationProvider basePath='/dashboard' dashboardId={dashboardId} isDemo={false}>
          <section>
            <BATopbar />
            <BannerProvider>
              {billingEnabled && billingDataPromise && (
                <Suspense fallback={null}>
                  <UsageAlertBanner billingDataPromise={billingDataPromise} />
                  <UsageExceededBanner billingDataPromise={billingDataPromise} />
                </Suspense>
              )}
              {isFeatureEnabled('enableAccountVerification') && (
                <VerificationBanner email={session.user.email} isVerified={!!session.user.emailVerified} />
              )}
              <Suspense>
                <IntegrationBanner />
              </Suspense>
              <main className='bg-background w-full overflow-x-hidden'>
                <ScrollReset />
                {children}
              </main>
              {mustAcceptTerms && <TermsRequiredModal isOpen={true} />}
            </BannerProvider>
            {trackingSiteId && <TrackingScript siteId={trackingSiteId} />}
            <Suspense>
              <IntegrationManager />
            </Suspense>
          </section>
        </DashboardNavigationProvider>
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
