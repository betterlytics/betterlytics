import prisma from '@/lib/postgres';
import { OnboardingGoalStatus } from '@prisma/client';

export type DashboardOnboardingGoal = {
  id: string;
  dashboardId: string;
  goalId: string;
  status: OnboardingGoalStatus;
  completedAt: Date | null;
  skippedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getOnboardingGoalsByDashboardId(dashboardId: string): Promise<DashboardOnboardingGoal[]> {
  return prisma.dashboardOnboardingGoal.findMany({
    where: { dashboardId },
  });
}

export async function getOnboardingGoalByDashboardAndGoalId(
  dashboardId: string,
  goalId: string,
): Promise<DashboardOnboardingGoal | null> {
  return prisma.dashboardOnboardingGoal.findUnique({
    where: {
      dashboardId_goalId: {
        dashboardId,
        goalId,
      },
    },
  });
}

export async function upsertOnboardingGoal(
  dashboardId: string,
  goalId: string,
  status: OnboardingGoalStatus,
): Promise<DashboardOnboardingGoal> {
  const now = new Date();
  return prisma.dashboardOnboardingGoal.upsert({
    where: {
      dashboardId_goalId: {
        dashboardId,
        goalId,
      },
    },
    update: {
      status,
      completedAt: status === 'completed' ? now : undefined,
      skippedAt: status === 'skipped' ? now : undefined,
    },
    create: {
      dashboardId,
      goalId,
      status,
      completedAt: status === 'completed' ? now : null,
      skippedAt: status === 'skipped' ? now : null,
    },
  });
}

export async function deleteOnboardingGoal(dashboardId: string, goalId: string): Promise<void> {
  await prisma.dashboardOnboardingGoal.deleteMany({
    where: { dashboardId, goalId },
  });
}
