import 'server-only';

import { User } from 'next-auth';
import { GithubStarPromptState } from '@prisma/client';
import {
  userHasGithubAccount,
  setGithubStarPromptState,
} from '@/repositories/postgres/user.repository';
import { findAllUserDashboards } from '@/repositories/postgres/dashboard.repository';
import { anySiteHasEvents } from '@/repositories/clickhouse/events.repository';

const MINIMUM_ACCOUNT_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function isEligibleForGithubStarPrompt(user: User): Promise<boolean> {
  if (!user.onboardingCompletedAt) return false;
  if (user.githubStarPromptState !== GithubStarPromptState.pending) return false;
  if (!user.createdAt) return false;
  if (Date.now() - new Date(user.createdAt).getTime() < MINIMUM_ACCOUNT_AGE_MS) return false;

  if (!(await userHasGithubAccount(user.id))) return false;

  const dashboards = await findAllUserDashboards(user.id);
  if (dashboards.length === 0) return false;

  return await anySiteHasEvents(dashboards.map((d) => d.siteId));
}

export async function setGithubStarPromptStateForUser(
  userId: string,
  state: GithubStarPromptState,
): Promise<void> {
  await setGithubStarPromptState(userId, state);
}
