import 'server-only';

import type { Session } from '@/entities/auth/session.entities';
import type { AdminActor } from '@/entities/admin/adminAccess.entities';
import { getCachedSession } from '@/auth/api-auth';
import { env } from '@/lib/env';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { ForbiddenError } from '@/lib/exceptions';

export function isSuperAdmin(userId: string | undefined): boolean {
  return !!userId && env.SUPER_ADMIN_USER_IDS.has(userId);
}

export function resolveAdminActor(session: Session | null): AdminActor | null {
  const user = session?.user;
  if (!user?.id) return null;

  const twoFactorEnabled = Boolean(user.twoFactorEnabled);

  if (isFeatureEnabled('isCloud')) {
    if (!isSuperAdmin(user.id)) return null;
    if (!env.IS_DEVELOPMENT && !twoFactorEnabled) return null;
    return { userId: user.id, email: user.email, kind: 'super_admin', edition: 'cloud', twoFactorEnabled };
  }

  if (user.role !== 'admin') return null;
  return { userId: user.id, email: user.email, kind: 'instance_admin', edition: 'selfhost', twoFactorEnabled };
}

export async function getCurrentAdminActor(): Promise<AdminActor | null> {
  return resolveAdminActor(await getCachedSession());
}

export async function requireAdminActor(): Promise<AdminActor> {
  const actor = await getCurrentAdminActor();
  if (!actor) throw new ForbiddenError();
  return actor;
}
