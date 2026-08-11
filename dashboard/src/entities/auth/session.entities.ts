import type { GithubStarPromptState } from '@prisma/client';

/**
 * The session identity shape the app consumes, produced by getCachedSession()
 * from better-auth's session. Identity-only by design (issue #79) — user
 * settings and derived flags like hasPassword are fetched where they're used.
 */
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role: string | null;
  twoFactorEnabled: boolean;
  onboardingCompletedAt?: Date | null;
  termsAcceptedAt?: Date | null;
  termsAcceptedVersion?: number | null;
  changelogVersionSeen?: string | null;
  createdAt?: Date;
  githubStarPromptState?: GithubStarPromptState;
}

export interface Session {
  user: User;
  session: {
    token: string;
    expiresAt: Date;
  };
}
