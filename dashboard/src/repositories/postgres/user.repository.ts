import 'server-only';

import prisma from '@/lib/postgres';
import { GithubStarPromptState, Prisma, type UserRole } from '@prisma/client';
import {
  User,
  UserSchema,
  CreateUserData,
  CreateUserSchema,
  UpdateUserData,
  UserWithoutDashboardCandidate,
  UserWithoutDashboardCandidateSchema,
} from '@/entities/auth/user.entities';
import { buildStarterSubscription } from '@/entities/billing/billing.entities';
import {
  AccountDeletionBlocker,
  AccountDeletionOutcome,
  DEFAULT_USER_SETTINGS,
  OwnedDashboardsDisposal,
  resolveAccountDeletionBlocker,
} from '@/entities/account/userSettings.entities';
import type { SupportedLanguages } from '@/constants/i18n';

// better-auth's providerId for email+password accounts; accountId is the user id by its convention.
const CREDENTIAL_PROVIDER_ID = 'credential';

export async function findUserById(userId: string): Promise<User | null> {
  return await findUserBy({ id: userId });
}

export async function findUserOAuthProviders(userId: string): Promise<string[]> {
  const accounts = await prisma.account.findMany({
    where: { userId, providerId: { not: CREDENTIAL_PROVIDER_ID } },
    select: { providerId: true },
  });
  return accounts.map((a) => a.providerId);
}

export async function findCredentialAccount(userId: string): Promise<{ id: string } | null> {
  return prisma.account.findFirst({
    where: { userId, providerId: CREDENTIAL_PROVIDER_ID, password: { not: null } },
    select: { id: true },
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return await findUserBy({ email: email.toLowerCase() });
}

export async function countUsers(): Promise<number> {
  try {
    return await prisma.user.count();
  } catch (error) {
    console.error('Error counting users:', error);
    throw new Error('Failed to count users.');
  }
}

// Rows anonymized before role was cleared still carry admin, so filter on deletedAt too
const ENABLED_ADMIN_WHERE = { role: 'admin', deletedAt: null, disabledAt: null } as const;
const ENABLED_USER_WHERE = { deletedAt: null, disabledAt: null } as const;

export async function countActiveAdmins(): Promise<number> {
  try {
    return await prisma.user.count({ where: ENABLED_ADMIN_WHERE });
  } catch (error) {
    console.error('Error counting active admins:', error);
    throw new Error('Failed to count active admins.');
  }
}

export async function countActiveUsers(): Promise<number> {
  try {
    return await prisma.user.count({ where: ENABLED_USER_WHERE });
  } catch (error) {
    console.error('Error counting active users:', error);
    throw new Error('Failed to count active users.');
  }
}

export async function touchUserLastActive(userId: string): Promise<void> {
  await prisma.user.updateMany({ where: { id: userId }, data: { lastActiveAt: new Date() } });
}

async function findUserBy(where: Prisma.UserWhereUniqueInput): Promise<User | null> {
  try {
    const prismaUser = await prisma.user.findUnique({ where });

    if (!prismaUser) return null;

    return UserSchema.parse(prismaUser);
  } catch (error) {
    console.error(`Error finding user by ${where}:`, error);
    throw new Error(`Failed to find user by ${where}.`);
  }
}

export async function setGithubStarPromptState(
  userId: string,
  state: GithubStarPromptState,
): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { githubStarPromptState: state },
    });
  } catch (error) {
    console.error('Error updating github star prompt state:', error);
    throw new Error('Failed to update github star prompt state');
  }
}

export async function createUser(
  data: CreateUserData,
  options?: { language?: SupportedLanguages },
): Promise<User> {
  try {
    const { passwordHash, ...userData } = CreateUserSchema.parse(data);

    const subscriptionData = buildStarterSubscription();

    const settingsData = {
      ...DEFAULT_USER_SETTINGS,
      ...(options?.language && { language: options.language }),
    };

    const prismaUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          ...userData,
          subscription: { create: subscriptionData },
          settings: { create: settingsData },
        },
      });

      await tx.account.create({
        data: {
          userId: user.id,
          accountId: user.id,
          providerId: CREDENTIAL_PROVIDER_ID,
          password: passwordHash,
        },
      });

      return user;
    });

    return UserSchema.parse(prismaUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user.');
  }
}

export async function updateUser(userId: string, data: UpdateUserData): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    throw new Error(`Failed to update user ${userId}.`);
  }
}

export async function findLegacyTwoFactorUsers(): Promise<
  Array<{ id: string; email: string | null; name: string | null; twoFactorEnabled: boolean }>
> {
  return prisma.user.findMany({
    where: { totpSecret: { not: null } },
    select: { id: true, email: true, name: true, twoFactorEnabled: true },
  });
}

export async function clearLegacyTwoFactor(): Promise<void> {
  await prisma.user.updateMany({
    where: { totpSecret: { not: null } },
    data: { twoFactorEnabled: false, totpSecret: null },
  });
}

export async function markOnboardingCompleted(userId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId, onboardingCompletedAt: null },
      data: { onboardingCompletedAt: new Date() },
    });
  } catch (error) {
    console.error(`Error marking onboarding completed for user ${userId}:`, error);
    throw new Error(`Failed to mark onboarding completed for user ${userId}.`);
  }
}

// Arbitrary app-wide key; serializes guarded access removals (delete, disable, demote) so two
// concurrent requests cannot both pass the last-admin check
const ACCOUNT_DELETION_LOCK_KEY = 271_000_001;

async function lockAccountRemovals(tx: Prisma.TransactionClient): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ACCOUNT_DELETION_LOCK_KEY}::bigint)`;
}

async function resolveRemovalBlockerWith(
  tx: Prisma.TransactionClient,
  target: { role: string | null; deletedAt: Date | null; disabledAt: Date | null },
): Promise<AccountDeletionBlocker | null> {
  const [activeAdmins, activeUsers] = await Promise.all([
    tx.user.count({ where: ENABLED_ADMIN_WHERE }),
    tx.user.count({ where: ENABLED_USER_WHERE }),
  ]);
  return resolveAccountDeletionBlocker(target, { activeAdmins, activeUsers });
}

const REMOVAL_TARGET_SELECT = { role: true, deletedAt: true, disabledAt: true } as const;

/**
 * Deletes (anonymizes) a user and disposes of the dashboards they own in one locked transaction, so a
 * refused deletion never leaves dashboards half-deleted. With `guard`, the last enabled admin or user is
 * refused. Every live membership of the user is ended with `removedById` as the remover. Returns the
 * refusal reason, or null when the user was deleted.
 */
export async function deleteUserAccount(
  userId: string,
  options: { guard: boolean; ownedDashboards: OwnedDashboardsDisposal; removedById: string },
): Promise<AccountDeletionOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      await lockAccountRemovals(tx);

      if (options.guard) {
        const target = await tx.user.findUnique({ where: { id: userId }, select: REMOVAL_TARGET_SELECT });
        if (target) {
          const blocker = await resolveRemovalBlockerWith(tx, target);
          if (blocker) return blocker;
        }
      }

      const owned = await tx.userDashboard.findMany({
        where: { userId, role: 'owner', deletedAt: null, dashboard: { deletedAt: null } },
        select: { dashboardId: true },
      });
      const dashboardIds = owned.map((row) => row.dashboardId);

      if (options.ownedDashboards.mode === 'transfer') {
        const toUserId = options.ownedDashboards.toUserId;
        const recipient = await tx.user.findFirst({
          where: { id: toUserId, ...ENABLED_USER_WHERE },
          select: { id: true },
        });
        if (!recipient || recipient.id === userId) return 'invalid_recipient';

        for (const dashboardId of dashboardIds) {
          const recipientAccess = await tx.userDashboard.findFirst({
            where: { userId: toUserId, dashboardId, deletedAt: null },
            select: { id: true },
          });
          if (recipientAccess) {
            await tx.userDashboard.update({ where: { id: recipientAccess.id }, data: { role: 'owner' } });
          } else {
            await tx.userDashboard.create({ data: { userId: toUserId, dashboardId, role: 'owner' } });
          }
        }
      } else if (dashboardIds.length > 0) {
        await tx.dashboard.updateMany({ where: { id: { in: dashboardIds } }, data: { deletedAt: new Date() } });
        await tx.dashboardInvitation.updateMany({
          where: { dashboardId: { in: dashboardIds }, status: 'pending' },
          data: { status: 'cancelled' },
        });
      }

      // Ends the owner rows too, so a transferred dashboard keeps the old owner's access period
      await tx.userDashboard.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date(), deletedById: options.removedById },
      });

      await anonymizeUserWith(tx, userId);
      return null;
    });
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error(`Failed to delete user ${userId}.`);
  }
}

/**
 * Disabling removes access, so with `guard` it is refused for the last enabled admin or user. Disabling also
 * ends every session and voids pending reset links; re-enabling restores access without touching anything else.
 */
export async function setUserDisabledUnlessBlocked(
  userId: string,
  disabled: boolean,
  options: { guard: boolean },
): Promise<AccountDeletionBlocker | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      await lockAccountRemovals(tx);

      const target = await tx.user.findUnique({ where: { id: userId }, select: REMOVAL_TARGET_SELECT });
      if (!target || target.deletedAt) return null;

      if (!disabled) {
        await tx.user.update({ where: { id: userId }, data: { disabledAt: null } });
        return null;
      }

      if (target.disabledAt) return null;

      if (options.guard) {
        const blocker = await resolveRemovalBlockerWith(tx, target);
        if (blocker) return blocker;
      }

      await tx.user.update({ where: { id: userId }, data: { disabledAt: new Date() } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.verification.deleteMany({ where: { value: userId, identifier: { startsWith: 'reset-password:' } } });
      return null;
    });
  } catch (error) {
    console.error(`Error updating disabled state for user ${userId}:`, error);
    throw new Error(`Failed to update user ${userId}.`);
  }
}

export async function setUserRoleUnlessBlocked(
  userId: string,
  role: UserRole | null,
): Promise<AccountDeletionBlocker | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      await lockAccountRemovals(tx);

      const target = await tx.user.findUnique({ where: { id: userId }, select: REMOVAL_TARGET_SELECT });
      if (!target || target.deletedAt) return null;

      if (role !== 'admin' && target.role === 'admin' && !target.disabledAt) {
        const activeAdmins = await tx.user.count({ where: ENABLED_ADMIN_WHERE });
        if (activeAdmins <= 1) return 'last_admin';
      }

      await tx.user.update({ where: { id: userId }, data: { role } });
      return null;
    });
  } catch (error) {
    console.error(`Error updating role for user ${userId}:`, error);
    throw new Error(`Failed to update role for user ${userId}.`);
  }
}

// Mirrors better-auth's /two-factor/disable, plus trusted devices and pending challenges, so the
// user signs in with only their password and enrolls again
export async function resetUserTwoFactor(userId: string): Promise<void> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.twoFactor.deleteMany({ where: { userId } });
      await tx.user.update({ where: { id: userId }, data: { twoFactorEnabled: false, totpSecret: null } });
      await tx.verification.deleteMany({
        where: {
          value: userId,
          OR: [{ identifier: { startsWith: 'trust-device-' } }, { identifier: { startsWith: '2fa-' } }],
        },
      });
      await tx.session.deleteMany({ where: { userId } });
    });
  } catch (error) {
    console.error(`Error resetting two-factor for user ${userId}:`, error);
    throw new Error(`Failed to reset two-factor for user ${userId}.`);
  }
}

async function anonymizeUserWith(tx: Prisma.TransactionClient, userId: string): Promise<void> {
  await tx.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@deleted.invalid`,
      name: null,
      image: null,
      role: null,
      twoFactorEnabled: false,
      totpSecret: null,
      emailVerified: false,
      deletedAt: new Date(),
    },
  });
  await tx.account.deleteMany({ where: { userId } });
  await tx.session.deleteMany({ where: { userId } });
  await tx.twoFactor.deleteMany({ where: { userId } });
  await tx.verification.deleteMany({ where: { value: userId } });
  await tx.mcpToken.updateMany({
    where: { createdBy: userId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  await tx.adminAuditLog.updateMany({ where: { targetType: 'user', targetId: userId }, data: { targetLabel: null } });
  await tx.adminAuditLog.updateMany({ where: { actorUserId: userId }, data: { actorLabel: null } });
}

export async function acceptTermsForUser(userId: string, version: number): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { termsAcceptedVersion: version, termsAcceptedAt: new Date() },
    });
  } catch (error) {
    console.error(`Error accepting terms for user ${userId}:`, error);
    throw new Error(`Failed to accept terms for user ${userId}.`);
  }
}

export async function findUsersWithoutDashboardsInWindow(
  window: { signedUpAfter: Date; signedUpBefore: Date },
  limit: number,
): Promise<UserWithoutDashboardCandidate[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        disabledAt: null,
        createdAt: { gt: window.signedUpAfter, lt: window.signedUpBefore },
        dashboardAccess: { none: { deletedAt: null } },
      },
      select: { id: true, email: true, name: true },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    return users.map((u) =>
      UserWithoutDashboardCandidateSchema.parse({ userId: u.id, email: u.email, name: u.name }),
    );
  } catch (error) {
    console.error('Error finding users without dashboards in window:', error);
    throw new Error('Failed to find users without dashboards in window');
  }
}

export async function setChangelogVersionSeen(userId: string, version: string): Promise<void> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { changelogVersionSeen: version },
    });
  } catch (error) {
    console.error(`Error updating changelog version for user ${userId}:`, error);
    throw new Error(`Failed to update changelog version for user ${userId}.`);
  }
}
