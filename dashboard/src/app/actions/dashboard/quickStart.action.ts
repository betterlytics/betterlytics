'use server';

import { withDashboardAuthContext } from '@/auth/auth-actions';
import { AuthContext } from '@/entities/auth/authContext.entities';
import { QuickStartProgress, OnboardingGoalId, ONBOARDING_GOALS } from '@/entities/dashboard/quickStart.entities';
import { getQuickStartProgress, skipGoal, unskipGoal } from '@/services/dashboard/quickStart.service';

export const getQuickStartProgressAction = withDashboardAuthContext(
  async (ctx: AuthContext): Promise<QuickStartProgress> => {
    return getQuickStartProgress(ctx.dashboardId, ctx.siteId);
  },
);

export const skipGoalAction = withDashboardAuthContext(async (ctx: AuthContext, goalId: string): Promise<void> => {
  const validGoalIds = ONBOARDING_GOALS.map((g) => g.id);
  if (!validGoalIds.includes(goalId as OnboardingGoalId)) {
    throw new Error(`Invalid goal ID: ${goalId}`);
  }
  await skipGoal(ctx.dashboardId, goalId as OnboardingGoalId);
});

export const unskipGoalAction = withDashboardAuthContext(
  async (ctx: AuthContext, goalId: string): Promise<void> => {
    const validGoalIds = ONBOARDING_GOALS.map((g) => g.id);
    if (!validGoalIds.includes(goalId as OnboardingGoalId)) {
      throw new Error(`Invalid goal ID: ${goalId}`);
    }
    await unskipGoal(ctx.dashboardId, goalId as OnboardingGoalId);
  },
);
