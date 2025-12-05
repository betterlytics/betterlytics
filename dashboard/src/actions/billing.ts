'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { getUserBillingStats } from '@/services/billing/billing';
import { type UserBillingData } from '@/entities/billing';
import { User } from 'next-auth';

export const getUserBillingData = withUserAuth(async (user: User): Promise<UserBillingData> => {
  return getUserBillingStats(user.id);
});
