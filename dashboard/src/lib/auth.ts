import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user.repository';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/auth/user.entities';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { createDefaultUserSettings, getUserSettings } from '@/services/account/userSettings.service';
import { createStarterSubscriptionForUser } from '@/services/billing/subscription.service';
import { setLocaleCookie } from '@/constants/cookies';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totp: { label: '2FA code' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        try {
          const user = await verifyCredentials(credentials as LoginUserData);
          if (user) {
            return user;
          }

          const { email, password } = credentials;
          return await attemptAdminInitialization(email, password);
        } catch (error) {
          console.error('Authorization error:', error);
          if (isUserException(error)) {
            throw error;
          }
          return null;
        }
      },
    }),

    // Conditionally add GitHub provider
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: env.GITHUB_ID,
            clientSecret: env.GITHUB_SECRET,
          }),
        ]
      : []),

    // Conditionally add Google provider
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/signin',
    error: '/signin',
    newUser: '/onboarding',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  events: {
    async createUser({ user }) {
      try {
        await createStarterSubscriptionForUser(user.id);
      } catch (error) {
        console.error('Failed to create initial subscription for user in NextAuth event:', error);
      }

      try {
        await createDefaultUserSettings(user.id);
      } catch (error) {
        console.error('Failed to create initial user settings for user in NextAuth event:', error);
      }
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, account, profile }) {
      if (user) {
        token.uid = user.id;
        token.name = user.name;
        token.email = user.email;
        token.emailVerified = user.emailVerified;
        token.role = user.role;
        token.totpEnabled = user.totpEnabled;
        token.hasPassword = Boolean((user as unknown as { passwordHash?: string | null })?.passwordHash);
        token.onboardingCompletedAt =
          (user as unknown as { onboardingCompletedAt?: Date | null })?.onboardingCompletedAt ?? null;
        token.termsAcceptedAt = (user as unknown as { termsAcceptedAt?: Date | null })?.termsAcceptedAt ?? null;
        token.termsAcceptedVersion =
          (user as unknown as { termsAcceptedVersion?: number | null })?.termsAcceptedVersion ?? null;
        token.changelogVersionSeen =
          (user as unknown as { changelogVersionSeen?: string | null })?.changelogVersionSeen ?? 'v0';

        if (account?.provider === 'google') {
          const emailVerifiedByGoogle = Boolean(
            (profile as unknown as { email_verified?: boolean })?.email_verified,
          );
          const userIsUnverified = !user.emailVerified;

          if (emailVerifiedByGoogle && userIsUnverified) {
            const verifiedAt = new Date();
            token.emailVerified = verifiedAt;

            try {
              await prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: verifiedAt },
              });
            } catch (e) {
              console.error('Failed to update verified email from Google:', e);
            }
          }
        }
      } else if (trigger === 'update' && token.email) {
        // Clears TTL on fetching user
        token.userLastFetched = 0;
      }

      // Fetch user / user settings to token / session on cache TTL expirery
      if (token.uid) {
        const staleThreshold = 5 * 60 * 1000;
        const isStale = !token.userLastFetched || Date.now() - token.userLastFetched > staleThreshold;
        if (isStale) {
          try {
            const freshUser = await findUserByEmail(token.email as string);
            if (freshUser) {
              // Refresh user
              token.uid = freshUser.id;
              token.name = freshUser.name;
              token.email = freshUser.email;
              token.emailVerified = freshUser.emailVerified || null;
              token.role = freshUser.role;
              token.totpEnabled = freshUser.totpEnabled;
              token.hasPassword = Boolean(freshUser.passwordHash);
              token.onboardingCompletedAt = freshUser.onboardingCompletedAt ?? null;
              token.termsAcceptedAt = freshUser.termsAcceptedAt ?? null;
              token.termsAcceptedVersion = freshUser.termsAcceptedVersion ?? null;
              token.changelogVersionSeen = freshUser.changelogVersionSeen ?? 'v0';

              // Refresh usersettings
              const freshSettings = await getUserSettings(token.uid);
              token.settings = freshSettings;

              // Update TTL
              token.userLastFetched = Date.now();
            }
          } catch (error) {
            console.error('Error refreshing user:', error);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.emailVerified = token.emailVerified;
        session.user.role = token.role;
        session.user.totpEnabled = token.totpEnabled;
        session.user.hasPassword = token.hasPassword;
        session.user.settings = token.settings;
        session.user.onboardingCompletedAt = token.onboardingCompletedAt;
        session.user.termsAcceptedAt = token.termsAcceptedAt;
        session.user.termsAcceptedVersion = token.termsAcceptedVersion;
        session.user.changelogVersionSeen = token.changelogVersionSeen ?? 'v0';

        if (session.user.settings?.language) {
          await setLocaleCookie(session.user.settings.language);
        }
      }
      return session;
    },
  },
};

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
