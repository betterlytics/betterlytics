'server-only';

import prisma from '@/lib/postgres';
import { clickhouse } from '@/lib/clickhouse';
import {
  getOnboardingGoalsByDashboardId,
  upsertOnboardingGoal,
  deleteOnboardingGoal,
} from '@/repositories/postgres/onboardingGoals.repository';
import {
  OnboardingGoalId,
  OnboardingGoalState,
  QuickStartProgress,
  ONBOARDING_GOALS,
} from '@/entities/dashboard/quickStart.entities';

export type { OnboardingGoalId, OnboardingGoalState, QuickStartProgress };
export { ONBOARDING_GOALS };

async function checkInstallScript(siteId: string): Promise<boolean> {
  const result = (await clickhouse
    .query(
      `
      SELECT 1 FROM analytics.events 
      WHERE site_id = {site_id:String} 
      LIMIT 1
    `,
      { params: { site_id: siteId } },
    )
    .toPromise()) as any[];
  return result.length > 0;
}

async function checkFirstPageview(siteId: string): Promise<boolean> {
  const result = (await clickhouse
    .query(
      `
      SELECT 1 FROM analytics.events 
      WHERE site_id = {site_id:String} 
        AND event_type = 'pageview'
      LIMIT 1
    `,
      { params: { site_id: siteId } },
    )
    .toPromise()) as any[];
  return result.length > 0;
}

async function checkCreateFunnel(dashboardId: string): Promise<boolean> {
  const count = await prisma.funnel.count({
    where: { dashboardId, deletedAt: null },
  });
  return count > 0;
}

async function checkCreateSavedFilter(dashboardId: string): Promise<boolean> {
  const count = await prisma.savedFilter.count({
    where: { dashboardId, deletedAt: null },
  });
  return count > 0;
}

async function checkInviteTeamMember(dashboardId: string): Promise<boolean> {
  const count = await prisma.dashboardInvitation.count({
    where: { dashboardId },
  });
  return count > 0;
}

type DetectionContext = { dashboardId: string; siteId: string };
type DetectionFn = (ctx: DetectionContext) => Promise<boolean>;

const DETECTION_FUNCTIONS: Record<OnboardingGoalId, DetectionFn> = {
  install_script: (ctx) => checkInstallScript(ctx.siteId),
  first_pageview: (ctx) => checkFirstPageview(ctx.siteId),
  create_funnel: (ctx) => checkCreateFunnel(ctx.dashboardId),
  create_saved_filter: (ctx) => checkCreateSavedFilter(ctx.dashboardId),
  invite_team_member: (ctx) => checkInviteTeamMember(ctx.dashboardId),
};

export async function getQuickStartProgress(dashboardId: string, siteId: string): Promise<QuickStartProgress> {
  const existingGoals = await getOnboardingGoalsByDashboardId(dashboardId);
  const existingGoalMap = new Map(existingGoals.map((g) => [g.goalId, g]));

  const ctx: DetectionContext = { dashboardId, siteId };
  const goalStates: OnboardingGoalState[] = [];

  for (const goalDef of ONBOARDING_GOALS) {
    const existing = existingGoalMap.get(goalDef.id);

    if (existing && existing.status !== 'pending') {
      goalStates.push({
        id: goalDef.id,
        category: goalDef.category,
        status: existing.status,
        completedAt: existing.completedAt,
        skippedAt: existing.skippedAt,
      });
    } else {
      const detectionFn = DETECTION_FUNCTIONS[goalDef.id];
      const isComplete = await detectionFn(ctx);

      if (isComplete) {
        const updated = await upsertOnboardingGoal(dashboardId, goalDef.id, 'completed');
        goalStates.push({
          id: goalDef.id,
          category: goalDef.category,
          status: 'completed',
          completedAt: updated.completedAt,
          skippedAt: null,
        });
      } else {
        goalStates.push({
          id: goalDef.id,
          category: goalDef.category,
          status: 'pending',
          completedAt: null,
          skippedAt: null,
        });
      }
    }
  }

  const completedCount = goalStates.filter((g) => g.status === 'completed' || g.status === 'skipped').length;
  const totalCount = goalStates.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    goals: goalStates,
    completedCount,
    totalCount,
    percentage,
  };
}

export async function skipGoal(dashboardId: string, goalId: OnboardingGoalId): Promise<void> {
  await upsertOnboardingGoal(dashboardId, goalId, 'skipped');
}

export async function unskipGoal(dashboardId: string, goalId: OnboardingGoalId): Promise<void> {
  await deleteOnboardingGoal(dashboardId, goalId);
}
