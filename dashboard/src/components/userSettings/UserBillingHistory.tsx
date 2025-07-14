'use client';

import { Button } from '@/components/ui/button';
import { CreditCard, ExternalLink } from 'lucide-react';
import { createStripeCustomerPortalSession } from '@/actions/stripe';
import { toast } from 'sonner';
import { useBillingData } from '@/hooks/useBillingData';
import SettingsCard from '@/components/SettingsCard';

export default function UserBillingHistory() {
  const { billingData, isLoading } = useBillingData();

  const handleViewBillingHistory = async () => {
    try {
      const portalUrl = await createStripeCustomerPortalSession();
      if (portalUrl.success) {
        window.open(portalUrl.data, '_blank');
      } else {
        throw new Error('No customer portal URL received');
      }
    } catch {
      toast.error('Failed to open billing portal, please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className='py-8 text-center'>
        <p className='text-muted-foreground'>Loading billing information...</p>
      </div>
    );
  }

  return (
    <SettingsCard
      icon={CreditCard}
      title='Billing Portal'
      description='Manage your billing details and access your full billing history'
    >
      <div className='flex flex-col items-center justify-center py-4 text-center'>
        <h3 className='mb-2 text-lg font-medium'>Access Billing Portal</h3>
        <p className='text-muted-foreground mb-6 text-sm'>
          View all past invoices, update payment methods, and manage your billing through Stripe&apos;s secure
          customer portal.
        </p>

        {billingData?.isExistingPaidSubscriber ? (
          <Button onClick={handleViewBillingHistory} className='flex items-center gap-2'>
            <ExternalLink className='h-4 w-4' />
            Open Billing Portal
          </Button>
        ) : (
          <p className='text-muted-foreground text-sm'>
            Billing portal will be available once you upgrade to a paid plan.
          </p>
        )}
      </div>

      <div className='mt-6 border-t pt-4'>
        <p className='text-muted-foreground text-center text-sm'>
          Need help with billing?{' '}
          <a href='mailto:support@betterlytics.io' className='text-primary hover:underline'>
            Contact support
          </a>
        </p>
      </div>
    </SettingsCard>
  );
}
