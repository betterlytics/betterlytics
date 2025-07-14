'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createStripeCustomerPortalSessionForCancellation } from '@/actions/stripe';
import { toast } from 'sonner';
import type { Tier } from '@/entities/billing';
import { ExternalLink } from 'lucide-react';

interface CancelSubscriptionDialogProps {
  children: React.ReactNode;
  tier: Tier;
  isActive: boolean;
  onCloseDialog?: () => void;
}

export function CancelSubscriptionDialog({
  children,
  tier,
  isActive,
  onCloseDialog,
}: CancelSubscriptionDialogProps) {
  const handleCancelSubscription = async () => {
    try {
      const portalUrl = await createStripeCustomerPortalSessionForCancellation();
      if (portalUrl.success) {
        window.location.href = portalUrl.data;
        onCloseDialog?.();
      } else {
        throw new Error('No customer portal URL received');
      }
    } catch {
      toast.error('Failed to open cancellation page, please try again.');
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild disabled={!isActive}>
        {children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your subscription? You'll be redirected to Stripe Customer Portal to
            cancel your subscription. You'll still have access to your {tier} plan until the end of your current
            billing period, after which you'll be downgraded to the free plan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
          <AlertDialogAction onClick={handleCancelSubscription}>
            <ExternalLink className='h-4 w-4' />
            Cancel Subscription
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
