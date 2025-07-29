import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';
import { UserException } from '@/lib/exceptions';
import { env } from '@/lib/env';
import { lazyProxyCache } from './lazy-cache';

export const authOptions: NextAuthOptions = lazyProxyCache(() => {
  return {
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
    },
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60,
    },
    callbacks: {
      async jwt({ token, user, trigger }) {
        if (user) {
          token.uid = user.id;
          token.name = user.name;
          token.email = user.email;
          token.emailVerified = user.emailVerified;
          token.role = user.role;
          token.totpEnabled = user.totpEnabled;
        } else if (trigger === 'update' && token.email) {
          try {
            const freshUser = await findUserByEmail(token.email as string);
            if (freshUser) {
              token.uid = freshUser.id;
              token.name = freshUser.name;
              token.email = freshUser.email;
              token.emailVerified = freshUser.emailVerified || null;
              token.role = freshUser.role;
              token.totpEnabled = freshUser.totpEnabled;
            }
          } catch (error) {
            console.error('Error refreshing user data in JWT callback:', error);
            // We keep existing token data if refresh fails
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
        }
        return session;
      },
    },
  };

  function isUserException(error: unknown): error is UserException {
    return error instanceof UserException;
  }
});
