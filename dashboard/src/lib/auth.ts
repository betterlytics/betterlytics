import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { encode } from 'next-auth/jwt';
import { randomBytes } from 'crypto';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { getUserSettings } from '@/services/userSettings';
import { cookies } from 'next/headers';

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;
const SESSION_COOKIE = 'next-auth.session-token';
const SESSION_COOKIE_SECURE = '__Secure-next-auth.session-token';

function fromDate(time: number, date = Date.now()) {
  return new Date(date + time * 1000);
}

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
    decode: async () => null,
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'credentials') {
        try {
          const sessionToken = getSessionToken();
          const sessionExpiry = fromDate(SESSION_MAX_AGE_SECONDS);

          await adapter.createSession!({ sessionToken, userId: user.id, expires: sessionExpiry });
          (user as User & { sessionToken?: string }).sessionToken = sessionToken;

          const cookieStore = await cookies();
          const isSecure = process.env.NODE_ENV === 'production';
          cookieStore.set(isSecure ? SESSION_COOKIE_SECURE : SESSION_COOKIE, sessionToken, {
            expires: sessionExpiry,
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/',
          });
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
      const freshUser = await findUserByEmail(user.email!);
      if (!freshUser || !session.user) return session;

      const settings = await getUserSettings(freshUser.id);

      session.user.id = freshUser.id;
      session.user.name = freshUser.name;
      session.user.email = freshUser.email!;
      session.user.emailVerified = freshUser.emailVerified || null;
      session.user.role = freshUser.role;
      session.user.totpEnabled = freshUser.totpEnabled;
      session.user.hasPassword = Boolean(freshUser.passwordHash);
      session.user.onboardingCompletedAt = freshUser.onboardingCompletedAt ?? null;
      session.user.termsAcceptedAt = freshUser.termsAcceptedAt ?? null;
      session.user.termsAcceptedVersion = freshUser.termsAcceptedVersion ?? null;
      session.user.changelogVersionSeen = freshUser.changelogVersionSeen ?? 'v0';
      session.user.settings = settings;

      return session;
    },
  },
};

function getSessionToken() {
  return randomBytes(32).toString('hex');
}

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
