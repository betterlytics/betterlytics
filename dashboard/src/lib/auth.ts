import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyCredentials, attemptAdminInitialization } from '@/services/auth.service';
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id;
        token.name = user.name;
        token.email = user.email;
        token.emailVerified = user.emailVerified;
        token.role = user.role;
      }
      if (trigger === 'update' && session) {
        token.name = session.name;
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
      }
      return session;
    },
  },
};
