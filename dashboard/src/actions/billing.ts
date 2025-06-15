'use server';

import { withUserAuth } from '@/auth/auth-actions';
import { getUserBillingStats, getUserBillingHistory } from '@/services/billing';
import { type UserBillingData } from '@/entities/billing';

export const getUserBillingData = withUserAuth(async (userId: string): Promise<UserBillingData> => {
  return await getUserBillingStats(userId);
});

export const getUserBillingHistoryData = withUserAuth(async (userId: string) => {
  try {
    return await getUserBillingHistory(userId);
  } catch (error) {
    console.error('Failed to fetch billing history:', error);
    return [];
  }
});
