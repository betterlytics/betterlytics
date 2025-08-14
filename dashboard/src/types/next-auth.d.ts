import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string;
      emailVerified?: Date | null;
      image?: string | null;
      role: string | null;
      totpEnabled: boolean;
      hasPassword?: boolean;
    };
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified?: Date | null;
    image?: string | null;
    role: string | null;
    totpEnabled: boolean;
    hasPassword?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid: string;
    name: string | null;
    email: string;
    emailVerified?: Date | null;
    role: string | null;
    totpEnabled: boolean;
    hasPassword?: boolean;
  }
}
