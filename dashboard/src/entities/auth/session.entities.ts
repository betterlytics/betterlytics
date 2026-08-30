export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified?: boolean;
  image?: string | null;
  role?: string | null;
  twoFactorEnabled?: boolean | null;
  onboardingCompletedAt?: Date | null;
  termsAcceptedAt?: Date | null;
  termsAcceptedVersion?: number | null;
  changelogVersionSeen?: string | null;
  createdAt?: Date;
  githubStarPromptState?: string | null;
}

export interface Session {
  user: User;
  session: {
    token: string;
    expiresAt: Date;
  };
}
