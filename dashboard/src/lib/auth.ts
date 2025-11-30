import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { encode } from 'next-auth/jwt';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import {
  deleteExpiredSessions,
  generateSessionToken,
  SESSION_MAX_AGE_SECONDS,
  SESSION_UPDATE_AGE_SECONDS,
} from '@/repositories/postgres/session';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { getUserSettings } from '@/services/userSettings';

const adapter = PrismaAdapter(prisma) as Adapter;

export const authOptions: NextAuthOptions = {
  adapter,
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
    strategy: 'database',
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  jwt: {
    encode: async (params) => {
      const sessionToken = params.token?.sessionToken as string | undefined;
      return sessionToken ?? encode(params);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      await deleteExpiredSessions();

      if (account?.provider === 'credentials') {
        try {
          const sessionToken = generateSessionToken();
          const sessionExpiry = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

          await adapter.createSession!({ sessionToken, userId: user.id, expires: sessionExpiry });
          (user as User & { sessionToken?: string }).sessionToken = sessionToken;
        } catch (error) {
          console.error('Failed to create session for credentials:', error);
          return false;
        }
      }

      if (account?.provider === 'google') {
        const emailVerifiedByGoogle = Boolean((user as unknown as { email_verified?: boolean })?.email_verified);
        if (emailVerifiedByGoogle && !user.emailVerified) {
          try {
            await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
          } catch (e) {
            console.error('Failed to update verified email from Google:', e);
          }
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const sessionToken = (user as User & { sessionToken?: string }).sessionToken;
        if (sessionToken) return { ...token, sessionToken };
        token.uid = user.id;
      }
      return token;
    },

    async session({ session, user }) {
      if (!session.user || !user) return session;

      const settings = await getUserSettings(user.id);

      session.user.id = user.id;
      session.user.name = user.name;
      session.user.email = user.email;
      session.user.emailVerified = user.emailVerified;
      session.user.role = user.role;
      session.user.totpEnabled = user.totpEnabled;
      session.user.hasPassword = user.hasPassword;
      session.user.onboardingCompletedAt = user.onboardingCompletedAt;
      session.user.termsAcceptedAt = user.termsAcceptedAt;
      session.user.termsAcceptedVersion = user.termsAcceptedVersion;
      session.user.changelogVersionSeen = user.changelogVersionSeen;
      session.user.settings = settings;

      return session;
    },
  },
};

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
