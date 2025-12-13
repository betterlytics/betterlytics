import type { User } from 'next-auth';
import { withUserAuth } from '@/auth/auth-actions';
import { env } from '@/lib/env';

export const isRootAdminUserAction = withUserAuth(async (user: User): Promise<boolean> => {
  return user.email === env.ADMIN_EMAIL;
});
