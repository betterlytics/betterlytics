import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
import { findUserByEmail } from '@/repositories/postgres/user';
import type { User } from 'next-auth';
import type { LoginUserData } from '@/entities/user';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const { email, password } = credentials;

        try {
          const user = await verifyCredentials({ email, password } as LoginUserData);
          if (user) {
            return user;
          }

          return await attemptAdminInitialization(email, password);
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }
      },
    }),
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
        token.role = user.role;
        token.emailVerified = user.emailVerified;
      } else if (trigger === 'update' && token.email) {
        try {
          const freshUser = await findUserByEmail(token.email as string);
          if (freshUser) {
            token.uid = freshUser.id;
            token.name = freshUser.name;
            token.email = freshUser.email;
            token.role = freshUser.role;
            token.emailVerified = freshUser.emailVerified || null;
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
        session.user.role = token.role;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
};
