import type { NextAuthOptions } from 'next-auth';
import type { Adapter } from 'next-auth/adapters';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { encode, decode } from 'next-auth/jwt';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import prisma from '@/lib/postgres';
import { generateSessionToken } from '@/services/session.service';
import { cookies } from 'next/headers';

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
    // Custom encode: for credentials provider, return the session token directly
    // For other providers, use the default JWT encoding
    encode: async (params) => {
      // Check if this is a credentials callback by looking at the token
      // When credentials provider is used, we store the session token in the token object
      const sessionToken = params.token?.sessionToken as string | undefined;
      if (sessionToken) {
        return sessionToken;
      }
      // Default JWT encode for OAuth providers
      return encode(params);
    },
    decode: async (params) => {
      // For database sessions, the token is actually a session token, not a JWT
      // Return null to force NextAuth to look up the session in the database
      // We detect this by checking if the token doesn't look like a JWT
      const token = params.token;
      if (token && !token.includes('.')) {
        // This is a session token (UUID-like), not a JWT
        // Return null so NextAuth uses the database adapter
        return null;
      }
      // Default JWT decode for OAuth providers
      return decode(params);
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
          return { sessionToken };
        }
        // For OAuth, populate the token normally
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, user }) {
      // With database sessions, we get the user directly from the database
      // Fetch fresh user data including custom fields
      const freshUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { settings: true },
      });

      if (freshUser && session.user) {
        session.user.id = freshUser.id;
        session.user.name = freshUser.name;
        session.user.email = freshUser.email!;
        session.user.emailVerified = freshUser.emailVerified;
        session.user.role = freshUser.role;
        session.user.totpEnabled = freshUser.totpEnabled;
        session.user.hasPassword = Boolean(freshUser.passwordHash);
        session.user.onboardingCompletedAt = freshUser.onboardingCompletedAt;
        session.user.termsAcceptedAt = freshUser.termsAcceptedAt;
        session.user.termsAcceptedVersion = freshUser.termsAcceptedVersion;
        session.user.changelogVersionSeen = freshUser.changelogVersionSeen ?? 'v0';

        // Include user settings
        if (freshUser.settings) {
          session.user.settings = {
            theme: freshUser.settings.theme,
            language: freshUser.settings.language,
            avatar: freshUser.settings.avatar,
            emailNotifications: freshUser.settings.emailNotifications,
            marketingEmails: freshUser.settings.marketingEmails,
          };
        }
      }

      return session;
    },
  },
};

function isUserException(error: unknown): error is UserException {
  return error instanceof UserException;
}
