import { redirect } from 'next/navigation';
import { DashboardProvider } from './DashboardProvider';
import { fetchSiteId, getCurrentDashboardAction } from '@/app/actions';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import UsageAlertBanner from '@/components/billing/UsageAlertBanner';
import { getUserBillingData } from '@/actions/billing';
import { Suspense } from 'react';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { fetchPublicEnvironmentVariablesAction } from '@/app/actions';
import { PublicEnvironmentVariablesProvider } from '@/contexts/PublicEnvironmentVariablesContextProvider';
import { TermsRequiredModal } from '@/components/account/TermsRequiredModal';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { BannerProvider } from '@/contexts/BannerProvider';
import { IntegrationBanner } from './IntegrationBanner';
import UsageExceededBanner from '@/components/billing/UsageExceededBanner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardLayoutShell from '@/app/(dashboard)/DashboardLayoutShell';

type DashboardLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { dashboardId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
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
        <DashboardLayoutShell
          dashboardId={dashboardId}
          isDemo={false}
          hasSession={!!session}
          basePath={'/dashboard'}
          trackingSiteId={shouldEnableTracking && siteId ? siteId : null}
          includeIntegrationManager={true}
        >
          <BannerProvider>
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
        </DashboardLayoutShell>
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
