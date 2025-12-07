'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { getUserBillingStats } from '@/services/billing/billing.service';
import { type UserBillingData } from '@/entities/billing/billing.entities';
import { User } from 'next-auth';

export const getUserBillingData = withUserAuth(async (user: User): Promise<UserBillingData> => {
  return getUserBillingStats(user.id);
});
