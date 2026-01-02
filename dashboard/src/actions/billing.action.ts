'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { getUserBillingStats } from '@/services/billing/billing.service';
import { type UserBillingData, buildSelfHostedBillingData } from '@/entities/billing/billing.entities';
import { User } from 'next-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';

export const getUserBillingData = withUserAuth(async (user: User): Promise<UserBillingData> => {
  if (!isFeatureEnabled('enableBilling')) {
    return buildSelfHostedBillingData();
  }

  return getUserBillingStats(user.id);
});
