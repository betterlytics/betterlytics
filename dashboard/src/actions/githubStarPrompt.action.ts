'use server';

import { GithubStarPromptState } from '@prisma/client';
import type { User } from '@/entities/auth/session.entities';
import { withUserAuth } from '@/auth/auth-actions';
import {
  isEligibleForGithubStarPrompt,
  setGithubStarPromptStateForUser,
} from '@/services/account/githubStarPrompt.service';

export const markGithubStarPromptStarred = withUserAuth(async (user: User): Promise<void> => {
  await setGithubStarPromptStateForUser(user.id, GithubStarPromptState.starred);
});

export const markGithubStarPromptDismissed = withUserAuth(async (user: User): Promise<void> => {
  await setGithubStarPromptStateForUser(user.id, GithubStarPromptState.dismissed);
});

export const getGithubStarPromptEligibility = withUserAuth(async (user: User): Promise<boolean> => {
  return await isEligibleForGithubStarPrompt(user);
});
