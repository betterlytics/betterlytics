import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { encode } from 'next-auth/jwt';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { generateSessionToken, sessionUserCache, USER_SESSION_CACHE_TTL_MS, type CachedUserData } from '@/services/session.service';
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
          if (user) return user;
          return await attemptAdminInitialization(credentials.email, credentials.password);
        } catch (error) {
          console.error('Authorization error:', error);
          if (error instanceof UserException) throw error;
          return null;
        }
      },
    }),

    // Conditionally add GitHub provider
    ...(env.GITHUB_ID && env.GITHUB_SECRET
      ? [GithubProvider({ clientId: env.GITHUB_ID, clientSecret: env.GITHUB_SECRET })]
      : []),

    // Conditionally add Google provider
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: { prompt: 'consent', access_type: 'offline', response_type: 'code' },
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
          const sessionToken = generateSessionToken();
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
      const dbSession = await prisma.session.findFirst({
        where: { userId: user.id, expires: { gt: new Date() } },
        select: { sessionToken: true, userLastFetched: true },
      });

      if (!dbSession) return session;

      const cached = sessionUserCache.get(dbSession.sessionToken);
      const isStale =
        !dbSession.userLastFetched || Date.now() - dbSession.userLastFetched.getTime() > USER_SESSION_CACHE_TTL_MS;

      let userData: CachedUserData | null = null;

      if (cached && !isStale) {
        userData = cached;
      } else {
        try {
          const freshUser = await findUserByEmail(user.email!);
          if (freshUser) {
            const freshSettings = await getUserSettings(freshUser.id);
            userData = { user: freshUser, settings: freshSettings };
            sessionUserCache.set(dbSession.sessionToken, userData);
            await prisma.session.update({
              where: { sessionToken: dbSession.sessionToken },
              data: { userLastFetched: new Date() },
            });
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          if (cached) userData = cached;
        }
      }

      if (userData?.user && session.user) {
        session.user.id = userData.user.id;
        session.user.name = userData.user.name;
        session.user.email = userData.user.email!;
        session.user.emailVerified = userData.user.emailVerified || null;
        session.user.role = userData.user.role;
        session.user.totpEnabled = userData.user.totpEnabled;
        session.user.hasPassword = Boolean(userData.user.passwordHash);
        session.user.onboardingCompletedAt = userData.user.onboardingCompletedAt ?? null;
        session.user.termsAcceptedAt = userData.user.termsAcceptedAt ?? null;
        session.user.termsAcceptedVersion = userData.user.termsAcceptedVersion ?? null;
        session.user.changelogVersionSeen = userData.user.changelogVersionSeen ?? 'v0';
        session.user.settings = userData.settings;
      }

      return session;
    },
  },
};
