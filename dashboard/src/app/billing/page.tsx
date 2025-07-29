import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { getAuthOptions } from '@/lib/auth';
import { getUserBillingData } from '@/actions/billing';
import { BillingNavigationBanner } from './BillingNavigationBanner';
import { BillingFAQGrid } from './BillingFAQGrid';
import { BillingInteractive } from './BillingInteractive';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';
import { VerificationBanner } from '@/components/accountVerification/VerificationBanner';
import { toast } from 'sonner';

export default async function BillingPage() {
  if (!isClientFeatureEnabled('enableBilling')) {
    return notFound();
  }

  const session = await getServerSession(getAuthOptions());

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

      <div className='container mx-auto max-w-6xl px-4 py-8'>
        {!session.user?.emailVerified && (
          <div className='mb-8'>
            <VerificationBanner
              email={session.user.email}
              userName={session.user.name || undefined}
              showDismiss={false}
            />
          </div>
        )}

        <div className='mb-16 space-y-4 text-center'>
          <h2 className='text-3xl font-bold sm:text-4xl'>Upgrade your plan</h2>
          <p className='text-muted-foreground text-xl'>Choose the perfect plan for your analytics needs.</p>
        </div>

        <div className='mb-8'>
          <CurrentPlanCard billingData={billingData.data} showManagementButtons={true} />
        </div>

        <BillingInteractive billingData={billingData.data} />

        <div className='mt-10'>
          <BillingFAQGrid />
        </div>
      </div>
    </div>
  );
}
