import { SidebarProvider } from '@/components/ui/sidebar';
import BASidebar from '@/components/sidebar/BASidebar';
import BAMobileSidebarTrigger from '@/components/sidebar/BAMobileSidebarTrigger';
import { BannerProvider } from '@/contexts/BannerProvider';
import { Suspense } from 'react';
import UsageAlertBanner from '@/components/billing/UsageAlertBanner';
import UsageExceededBanner from '@/components/billing/UsageExceededBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { IntegrationBanner } from '../IntegrationBanner';
import { TermsRequiredModal } from '@/components/account/TermsRequiredModal';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { getUserBillingData } from '@/actions/billing.action';
import { requireAuth } from '@/auth/auth-actions';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';

type DashboardSidebarLayoutProps = {
  params: Promise<{ dashboardId: string }>;
  children: React.ReactNode;
};

export default async function DashboardSidebarLayout({ params, children }: DashboardSidebarLayoutProps) {
  const { dashboardId } = await params;
  const session = await requireAuth();

  const billingEnabled = isClientFeatureEnabled('enableBilling');

  let billingDataPromise;
  if (billingEnabled) {
    billingDataPromise = getUserBillingData();
  }

  const mustAcceptTerms =
    isClientFeatureEnabled('isCloud') &&
    (!session.user.termsAcceptedAt || session.user.termsAcceptedVersion !== CURRENT_TERMS_VERSION);

  return (
    <SidebarProvider>
      <BASidebar dashboardId={dashboardId} isDemo={false} />
      <BAMobileSidebarTrigger />
      <BannerProvider>
        <div className='flex w-full justify-center'>
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
          {mustAcceptTerms && <TermsRequiredModal isOpen={true} />}
          {children}
        </div>
      </BannerProvider>
    </SidebarProvider>
  );
}
