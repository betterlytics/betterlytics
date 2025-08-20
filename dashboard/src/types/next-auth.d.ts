import 'next-auth';
import 'next-auth/jwt';
import type { UserSettings } from '@/entities/userSettings';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string;
    emailVerified?: Date | null;
    image?: string | null;
    role: string | null;
    totpEnabled: boolean;
    hasPassword?: boolean;
    settings?: UserSettings;
  }

  interface Session {
    user: User;
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
    settings?: UserSettings;
    settingsLastFetched?: number;
  }
}
