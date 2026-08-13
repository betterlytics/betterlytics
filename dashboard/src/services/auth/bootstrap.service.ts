'server-only';

import * as bcrypt from 'bcrypt';
import { env } from '@/lib/env';
import {
  findUserByEmail,
  createUser,
  findLegacyTwoFactorUsers,
  clearLegacyTwoFactor,
  verifyUserPassword,
  updateUserPassword,
} from '@/repositories/postgres/user.repository';
import { enqueueEmail } from '@/services/email/email.service';
import { createUserRecipientKey } from '@/services/email/recipient-key.service';

const SALT_ROUNDS = 10;

export async function ensureAdminAccount(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;

  const existing = await findUserByEmail(env.ADMIN_EMAIL);
  if (existing) {
    await syncAdminPassword(existing.id, env.ADMIN_PASSWORD);
    return;
  }

  await createUser({
    email: env.ADMIN_EMAIL,
    name: 'Admin',
    passwordHash: await bcrypt.hash(env.ADMIN_PASSWORD, SALT_ROUNDS),
    role: 'admin',
  });
  console.info(`[bootstrap] Created admin account for ${env.ADMIN_EMAIL}`);
}

/**
 * ADMIN_PASSWORD stays authoritative so a locked-out operator can recover by
 * setting a new value and restarting. The flip side is deliberate: changing the
 * admin password in-app reverts on next boot.
 */
async function syncAdminPassword(userId: string, password: string): Promise<void> {
  try {
    if (await verifyUserPassword(userId, password)) return;

    await updateUserPassword(userId, password);
    console.info('[bootstrap] Admin password rotated to match ADMIN_PASSWORD');
  } catch (error) {
    console.error('[bootstrap] Failed to sync admin password:', error);
  }
}

/**
 * One-time cutover cleanup: the twoFactor plugin cannot verify legacy TOTP
 * secrets (incompatible HMAC key derivation), so affected users get 2FA disabled
 * and an email asking them to re-enroll. Delete once the release has run everywhere.
 */
export async function resetLegacyTwoFactor(): Promise<void> {
  const legacyUsers = await findLegacyTwoFactorUsers();
  if (legacyUsers.length === 0) return;

  await clearLegacyTwoFactor();

  for (const user of legacyUsers) {
    if (!user.twoFactorEnabled || !user.email) continue;
    try {
      await enqueueEmail({
        type: 'two-factor-disabled',
        recipientKey: createUserRecipientKey(user.id),
        campaignKey: `two-factor-reset-migration:${user.id}`,
        data: { to: user.email, userName: user.name },
      });
    } catch (err) {
      console.error('Failed to enqueue 2FA reset notification:', { userId: user.id, err });
    }
  }

  console.info(`[bootstrap] Reset ${legacyUsers.length} legacy TOTP enrollment(s); re-enrollment required.`);
}
