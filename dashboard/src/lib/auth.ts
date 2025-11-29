import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { encode, decode } from 'next-auth/jwt';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { generateSessionToken } from '@/services/session.service';
import { getUserSettings } from '@/services/userSettings';
import { cookies } from 'next/headers';
import { sessionUserCache, USER_CACHE_TTL_MS, type CachedUserData } from '@/lib/session-cache';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

// Session cookie name used by NextAuth
const SESSION_COOKIE = 'next-auth.session-token';
// For secure cookies in production
const SESSION_COOKIE_SECURE = '__Secure-next-auth.session-token';

/**
 * Calculate session expiry date from maxAge
 */
function fromDate(time: number, date = Date.now()) {
  return new Date(date + time * 1000);
}

/**
 * Get the adapter instance for manual session creation
 */
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
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    // With database sessions, we override JWT handling to work with credentials provider
    // For credentials: return the session token we created
    // For OAuth: NextAuth handles this via the adapter automatically
    encode: async (params) => {
      // If we have a session token (from credentials signIn), return it directly
      const sessionToken = params.token?.sessionToken as string | undefined;
      if (sessionToken) {
        return sessionToken;
      }
      // For OAuth providers, encode normally (though with database strategy this is rarely called)
      return encode(params);
    },
    decode: async () => {
      // Always return null to force NextAuth to use database session lookup
      // This is safe because with strategy: 'database', the adapter handles session retrieval
      return null;
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // For credentials provider, manually create the database session
      // since NextAuth doesn't do this automatically
      if (account?.provider === 'credentials') {
        try {
          const sessionToken = generateSessionToken();
          const sessionExpiry = fromDate(SESSION_MAX_AGE);

          // Create session in database
          await adapter.createSession!({
            sessionToken,
            userId: user.id,
            expires: sessionExpiry,
          });

          // Store the session token to be used by the jwt.encode callback
          // We use a workaround by attaching it to the user object temporarily
          (user as User & { sessionToken?: string }).sessionToken = sessionToken;

          // Set the session cookie
          const cookieStore = await cookies();
          const isSecure = process.env.NODE_ENV === 'production';
          const cookieName = isSecure ? SESSION_COOKIE_SECURE : SESSION_COOKIE;

          cookieStore.set(cookieName, sessionToken, {
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

      // Handle Google OAuth email verification
      if (account?.provider === 'google') {
        const profile = (user as unknown as { email_verified?: boolean });
        const emailVerifiedByGoogle = Boolean(profile?.email_verified);
        const userIsUnverified = !user.emailVerified;

        if (emailVerifiedByGoogle && userIsUnverified) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() },
            });
          } catch (e) {
            console.error('Failed to update verified email from Google:', e);
          }
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      // For credentials provider, pass through the session token
      if (user) {
        const sessionToken = (user as User & { sessionToken?: string }).sessionToken;
        if (sessionToken) {
          // Return minimal token with session reference for credentials
          // Note: With database sessions, this token is only used to pass the sessionToken
          // to jwt.encode, the actual session data comes from the database
          return { ...token, sessionToken };
        }
        // For OAuth, populate the token normally
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, user }) {
      // Get current session from database to check cache TTL
      const dbSession = await prisma.session.findFirst({
        where: { userId: user.id, expires: { gt: new Date() } },
        select: { sessionToken: true, userLastFetched: true },
      });

      if (!dbSession) {
        // No valid session found, return basic session
        return session;
      }

      const sessionToken = dbSession.sessionToken;

      // Check in-memory cache first
      const cached = sessionUserCache.get(sessionToken);

      // Determine if cache is stale based on DB timestamp (5-minute TTL)
      const isStale = !dbSession.userLastFetched ||
        Date.now() - dbSession.userLastFetched.getTime() > USER_CACHE_TTL_MS;

      let userData: CachedUserData | null = null;

      if (cached && !isStale) {
        // Use in-memory cached data (cache hit)
        userData = cached;
      } else {
        // Cache miss or stale - fetch fresh data from database
        try {
          const freshUser = await findUserByEmail(user.email!);
          if (freshUser) {
            const freshSettings = await getUserSettings(freshUser.id);
            userData = { user: freshUser, settings: freshSettings };

            // Update in-memory cache
            sessionUserCache.set(sessionToken, userData);

            // Update cache TTL timestamp in database
            await prisma.session.update({
              where: { sessionToken },
              data: { userLastFetched: new Date() },
            });
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          // If fetch fails and we have stale cache, use it as fallback
          if (cached) {
            userData = cached;
          }
        }
      }

      // Populate session with user data
      if (userData?.user && session.user) {
        const { user: freshUser, settings: freshSettings } = userData;
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
        session.user.settings = freshSettings;
      }

      return session;
    },
  },
};

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
