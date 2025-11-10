import { redirect } from 'next/navigation';
import { DashboardProvider } from './DashboardProvider';
import { getCurrentDashboardAction } from '@/app/actions';
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
import { getAuthorizedDashboardContextOrNull } from '@/services/auth.service';
import { DashboardFindByUserSchema } from '@/entities/dashboard';
import { env } from '@/lib/env';

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

  const authCtx = await getAuthorizedDashboardContextOrNull(
    DashboardFindByUserSchema.parse({ userId: session.user.id, dashboardId }),
  );

  if (!authCtx) {
    if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) {
      redirect(`/public/${dashboardId}`);
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
    !session.user.termsAcceptedAt || session.user.termsAcceptedVersion !== CURRENT_TERMS_VERSION;

  return (
    <PublicEnvironmentVariablesProvider publicEnvironmentVariables={publicEnvironmentVariables}>
      <DashboardProvider>
        <DashboardLayoutShell
          dashboardId={dashboardId}
          isDemo={false}
          basePath={'/dashboard'}
          includeIntegrationManager={true}
        >
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
            <div className='flex w-full justify-center'>{children}</div>
            {mustAcceptTerms && <TermsRequiredModal isOpen={true} />}
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
