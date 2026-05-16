import 'server-only';

import { User } from 'next-auth';
import { GithubStarPromptState } from '@prisma/client';
import { setGithubStarPromptState } from '@/repositories/postgres/user.repository';
import { findAllUserDashboards } from '@/repositories/postgres/dashboard.repository';
import { anySiteHasEventsWithinDays } from '@/repositories/clickhouse/events.repository';

const MINIMUM_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RECENT_EVENTS_WINDOW_DAYS = 7;

export async function isEligibleForGithubStarPrompt(user: User): Promise<boolean> {
  if (!user.onboardingCompletedAt) return false;
  if (user.githubStarPromptState !== GithubStarPromptState.pending) return false;
  if (!user.createdAt) return false;
  if (Date.now() - new Date(user.createdAt).getTime() < MINIMUM_ACCOUNT_AGE_MS) return false;

  const dashboards = await findAllUserDashboards(user.id);
  if (dashboards.length === 0) return false;

  return await anySiteHasEventsWithinDays(
    dashboards.map((d) => d.siteId),
    RECENT_EVENTS_WINDOW_DAYS,
  );
}

export async function setGithubStarPromptStateForUser(
  userId: string,
  state: GithubStarPromptState,
): Promise<void> {
  await setGithubStarPromptState(userId, state);
}
