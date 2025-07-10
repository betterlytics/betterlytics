import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      image?: string | null;
      role: string | null;
      emailVerified: Date | null;
    };
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    role: string | null;
    emailVerified: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    name: string | null;
    email: string;
    role: string | null;
    emailVerified: Date | null;
  }
}
