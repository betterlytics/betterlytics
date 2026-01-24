import { OnboardingGoalStatus } from '@prisma/client';

export type OnboardingGoalId =
  | 'install_script'
  | 'first_pageview'
  | 'create_funnel'
  | 'create_saved_filter'
  | 'invite_team_member';

export type OnboardingGoalCategory = 'get_started' | 'analytics' | 'team';

export type OnboardingGoalDefinition = {
  id: OnboardingGoalId;
  category: OnboardingGoalCategory;
  priority: number;
};

export const ONBOARDING_GOALS: OnboardingGoalDefinition[] = [
  { id: 'install_script', category: 'get_started', priority: 1 },
  { id: 'first_pageview', category: 'get_started', priority: 2 },
  { id: 'create_funnel', category: 'analytics', priority: 1 },
  { id: 'create_saved_filter', category: 'analytics', priority: 2 },
  { id: 'invite_team_member', category: 'team', priority: 1 },
];

export type OnboardingGoalState = {
  id: OnboardingGoalId;
  category: OnboardingGoalCategory;
  status: OnboardingGoalStatus;
  completedAt: Date | null;
  skippedAt: Date | null;
};

export type QuickStartProgress = {
  goals: OnboardingGoalState[];
  completedCount: number;
  totalCount: number;
  percentage: number;
};
