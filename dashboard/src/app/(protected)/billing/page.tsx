import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserBillingData } from '@/actions/billing';
import { BillingNavigationBanner } from './BillingNavigationBanner';
import { BillingFAQGrid } from './BillingFAQGrid';
import { BillingInteractive } from './BillingInteractive';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { toast } from 'sonner';
import { getTranslations } from 'next-intl/server';
import { BannerProvider } from '@/contexts/BannerProvider';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { isFeatureEnabled } from '@/lib/feature-flags';

export default async function BillingPage() {
  if (!isClientFeatureEnabled('enableBilling')) {
    return notFound();
  }

  const session = await getServerSession(authOptions);
  const t = await getTranslations('components.billing.page');

  if (!session) {
    redirect('/signin');
  }

  const billingData = await getUserBillingData();

  if (!billingData.success) {
    toast.error(billingData.error.message);
    throw new Error(billingData.error.message);
  }

  return (
    <div className='bg-background'>
      <BillingNavigationBanner />

      <BannerProvider>
        <div className='container mx-auto max-w-6xl px-4 py-8'>
          {isFeatureEnabled('enableAccountVerification') && (
            <VerificationBanner
              email={session.user.email}
              isVerified={!!session.user.emailVerified}
              showDismiss={false}
              id='billing'
            />
          )}

          <div className='mb-16 space-y-4 text-center'>
            <h2 className='text-3xl font-bold sm:text-4xl'>{t('heading')}</h2>
            <p className='text-muted-foreground text-xl'>{t('subheading')}</p>
          </div>

          <BillingInteractive billingData={billingData.data} />
          <div className='mt-10'>
            <CurrentPlanCard billingData={billingData.data} showManagementButtons={true} />
          </div>

          <div className='mt-10'>
            <BillingFAQGrid />
          </div>
        </div>
      </BannerProvider>
    </div>
  );
}
