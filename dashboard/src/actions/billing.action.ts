'use server';

import { withUserAuth, withDashboardAuthContext } from '@/auth/auth-actions';
import { getUserBillingStats, getDashboardOwnerBillingStats } from '@/services/billing/billing.service';
import { listUserInvoices } from '@/services/billing/invoice.service';
import {
  type UserBillingData,
  type UserInvoice,
  buildSelfHostedBillingData,
} from '@/entities/billing/billing.entities';
import { User } from 'next-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { AuthContext } from '@/entities/auth/authContext.entities';

export const getUserBillingData = withUserAuth(async (user: User): Promise<UserBillingData> => {
  if (!isFeatureEnabled('enableBilling')) {
    return buildSelfHostedBillingData();
  }

  return getUserBillingStats(user.id);
});

export const getUserInvoices = withUserAuth(async (user: User): Promise<UserInvoice[]> => {
  if (!isFeatureEnabled('enableBilling')) {
    return [];
  }

  return listUserInvoices(user.id);
});

export const getDashboardOwnerBillingData = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<UserBillingData> => {
    if (!isFeatureEnabled('enableBilling')) {
      return buildSelfHostedBillingData();
    }

    return getDashboardOwnerBillingStats(ctx.dashboardId);
  },
);
