import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserBillingData } from '@/actions/billing';
import { BillingNavigationBanner } from './BillingNavigationBanner';
import { BillingFAQGrid } from './BillingFAQGrid';
import { BillingInteractive } from './BillingInteractive';
import { CurrentPlanCard } from '@/components/billing/CurrentPlanCard';
import { isClientFeatureEnabled } from '@/lib/client-feature-flags';

export default async function BillingPage() {
  if (!isClientFeatureEnabled('enableBilling')) {
    return notFound();
  }

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/signin');
  }

  const billingData = await getUserBillingData();

  return (
    <div className='bg-background min-h-screen'>
      <BillingNavigationBanner />

      <div className='container mx-auto max-w-6xl px-4 py-8'>
        <div className='mb-16 space-y-4 text-center'>
          <h2 className='text-3xl font-bold sm:text-4xl'>Upgrade your plan</h2>
          <p className='text-muted-foreground text-xl'>Choose the perfect plan for your analytics needs.</p>
        </div>

        <div className='mb-8'>
          <CurrentPlanCard billingData={billingData} />
        </div>

        <BillingInteractive billingData={billingData} />

        <div className='mt-10'>
          <BillingFAQGrid />
        </div>
      </div>
    </div>
  );
}
