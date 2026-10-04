import 'server-only';

import prisma from '@/lib/postgres';
import { GithubStarPromptState, Prisma } from '@prisma/client';
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
  DEFAULT_USER_SETTINGS,
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

export async function countActiveAdmins(): Promise<number> {
  try {
    // Rows anonymized before role was cleared still carry admin, so filter on deletedAt too
    return await prisma.user.count({ where: { role: 'admin', deletedAt: null } });
  } catch (error) {
    console.error('Error counting active admins:', error);
    throw new Error('Failed to count active admins.');
  }
}

export async function countActiveUsers(): Promise<number> {
  try {
    return await prisma.user.count({ where: { deletedAt: null } });
  } catch (error) {
    console.error('Error counting active users:', error);
    throw new Error('Failed to count active users.');
  }
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

// Arbitrary app-wide key; serializes guarded deletions so two concurrent requests cannot both pass the check
const ACCOUNT_DELETION_LOCK_KEY = 271_000_001;

export async function anonymizeUser(userId: string): Promise<void> {
  try {
    await prisma.$transaction((tx) => anonymizeUserWith(tx, userId));
  } catch (error) {
    console.error(`Error anonymizing user ${userId}:`, error);
    throw new Error(`Failed to anonymize user ${userId}.`);
  }
}

/**
 * Re-checks the deletion blocker under an advisory lock and anonymizes only when nothing blocks.
 * Returns the blocker when refused, null when the user was anonymized.
 */
export async function anonymizeUserUnlessBlocked(userId: string): Promise<AccountDeletionBlocker | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ACCOUNT_DELETION_LOCK_KEY}::bigint)`;

      const target = await tx.user.findUnique({ where: { id: userId }, select: { role: true, deletedAt: true } });
      if (target) {
        const activeAdmins = await tx.user.count({ where: { role: 'admin', deletedAt: null } });
        const activeUsers = await tx.user.count({ where: { deletedAt: null } });
        const blocker = resolveAccountDeletionBlocker(target, { activeAdmins, activeUsers });
        if (blocker) return blocker;
      }

      await anonymizeUserWith(tx, userId);
      return null;
    });
  } catch (error) {
    console.error(`Error anonymizing user ${userId}:`, error);
    throw new Error(`Failed to anonymize user ${userId}.`);
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
        createdAt: { gt: window.signedUpAfter, lt: window.signedUpBefore },
        dashboardAccess: { none: {} },
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
