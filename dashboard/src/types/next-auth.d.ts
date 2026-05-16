import 'next-auth';
import 'next-auth/jwt';
import type { GithubStarPromptState } from '@prisma/client';
import type { UserSettings } from '@/entities/account/userSettings.entities';
import type { AdapterUser } from 'next-auth/adapters';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified?: Date | null;
    image?: string | null;
    role: string | null;
    totpEnabled: boolean;
    hasPassword?: boolean;
    onboardingCompletedAt?: Date | null;
    settings?: UserSettings;
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
    emailVerified?: Date | null;
    role: string | null;
    totpEnabled: boolean;
    hasPassword?: boolean;
    onboardingCompletedAt?: Date | null;
    settings?: UserSettings;
    userLastFetched?: number;
    termsAcceptedAt?: Date | null;
    termsAcceptedVersion?: number | null;
    changelogVersionSeen?: string | null;
    createdAt?: Date;
    githubStarPromptState?: GithubStarPromptState;
  }
}

declare module 'next-auth/adapters' {
  interface AdapterUser {
    passwordHash?: string | null;
  }
}
