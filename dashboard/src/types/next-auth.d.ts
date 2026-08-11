import 'next-auth';
import 'next-auth/jwt';
import type { GithubStarPromptState } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified?: boolean;
    image?: string | null;
    role: string | null;
    twoFactorEnabled: boolean;
    hasPassword?: boolean;
    onboardingCompletedAt?: Date | null;
    termsAcceptedAt?: Date | null;
    termsAcceptedVersion?: number | null;
    changelogVersionSeen?: string | null;
    createdAt?: Date;
    githubStarPromptState?: GithubStarPromptState;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    name: string | null;
    email: string;
    emailVerified?: boolean;
    role: string | null;
    twoFactorEnabled: boolean;
    hasPassword?: boolean;
    onboardingCompletedAt?: Date | null;
    termsAcceptedAt?: Date | null;
    termsAcceptedVersion?: number | null;
    changelogVersionSeen?: string | null;
    createdAt?: Date;
    githubStarPromptState?: GithubStarPromptState;
  }
}
