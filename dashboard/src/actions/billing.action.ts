'use server';

import { withUserAuth, withDashboardAuthContext } from '@/auth/auth-actions';
import { getUserBillingStats, getDashboardOwnerBillingStats } from '@/services/billing/billing.service';
import { listUserInvoices } from '@/services/billing/invoice.service';
import {
  previewSubscriptionChange,
  applySubscriptionChange,
  syncSubscriptionChangeStatus,
  type ApplyChangeResult,
} from '@/services/billing/subscription-change.service';
import {
  type UserBillingData,
  type UserInvoice,
  type SubscriptionChangePreview,
  buildSelfHostedBillingData,
} from '@/entities/billing/billing.entities';
import { SelectedPlanSchema, type SelectedPlan } from '@/types/pricing';
import { User } from 'next-auth';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { UserException } from '@/lib/exceptions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { z } from 'zod';

const AttemptIdSchema = z.string().uuid();

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

export const getSubscriptionChangePreview = withUserAuth(
  async (user: User, targetPlan: SelectedPlan): Promise<SubscriptionChangePreview> => {
    if (!isFeatureEnabled('enableBilling')) {
      throw new UserException('Billing is not enabled.');
    }
    const validatedPlan = SelectedPlanSchema.parse(targetPlan);
    return previewSubscriptionChange(user.id, validatedPlan);
  },
);

export const changeSubscriptionPlan = withUserAuth(
  async (user: User, targetPlan: SelectedPlan, attemptId: string): Promise<ApplyChangeResult> => {
    if (!isFeatureEnabled('enableBilling')) {
      throw new UserException('Billing is not enabled.');
    }
    if (!user.emailVerified) {
      throw new UserException('Email verification required to change plans.');
    }
    const validatedPlan = SelectedPlanSchema.parse(targetPlan);
    const validatedAttemptId = AttemptIdSchema.parse(attemptId);
    return applySubscriptionChange(user.id, validatedPlan, validatedAttemptId);
  },
);

export const syncSubscriptionPlanChangeStatus = withUserAuth(
  async (user: User): Promise<ApplyChangeResult> => {
    if (!isFeatureEnabled('enableBilling')) {
      throw new UserException('Billing is not enabled.');
    }
    if (!user.emailVerified) {
      throw new UserException('Email verification required to change plans.');
    }
    return syncSubscriptionChangeStatus(user.id);
  },
);

export const getDashboardOwnerBillingData = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<UserBillingData> => {
    if (!isFeatureEnabled('enableBilling')) {
      return buildSelfHostedBillingData();
    }

    return getDashboardOwnerBillingStats(ctx.dashboardId);
  },
);
