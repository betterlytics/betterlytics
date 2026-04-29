'server-only';

import type { Session } from 'next-auth';
import { env } from '@/lib/env';
import { ForbiddenError } from '@/lib/exceptions';

export function isSuperAdmin(userId: string | undefined): boolean {
  return !!userId && env.SUPER_ADMIN_USER_IDS.has(userId);
}

export function assertSuperAdmin(session: Session | null): asserts session is Session {
  if (!session?.user?.id || !isSuperAdmin(session.user.id)) {
    throw new ForbiddenError();
  }

  if (!env.IS_DEVELOPMENT && !session.user.totpEnabled) {
    throw new ForbiddenError('Super admin requires 2FA to be enabled');
  }
}
