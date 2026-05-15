'use server';

import { GithubStarPromptState } from '@prisma/client';
import { User } from 'next-auth';
import { withUserAuth } from '@/auth/auth-actions';
import { setGithubStarPromptStateForUser } from '@/services/account/githubStarPrompt.service';

export const markGithubStarPromptStarred = withUserAuth(async (user: User): Promise<void> => {
  await setGithubStarPromptStateForUser(user.id, GithubStarPromptState.starred);
});

export const markGithubStarPromptDismissed = withUserAuth(async (user: User): Promise<void> => {
  await setGithubStarPromptStateForUser(user.id, GithubStarPromptState.dismissed);
});
