import prisma from '@/lib/postgres';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserSchema,
  CreateUserData,
  CreateUserSchema,
  RegisterUserSchema,
  RegisterUserData,
  UpdateUserData,
} from '@/entities/user';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { buildStarterSubscription } from '@/entities/billing';
import { DEFAULT_USER_SETTINGS } from '@/entities/userSettings';
import type { SupportedLanguages } from '@/constants/i18n';

const SALT_ROUNDS = 10;

export async function findUserById(userId: string): Promise<User | null> {
  return await findUserBy({ id: userId });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return await findUserBy({ email });
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

export async function createUser(
  data: CreateUserData,
  options?: { language?: SupportedLanguages },
): Promise<User> {
  try {
    const validatedData = CreateUserSchema.parse(data);

    const subscriptionData = buildStarterSubscription();

    const settingsData = {
      ...DEFAULT_USER_SETTINGS,
      ...(options?.language && { language: options.language }),
    };

    const prismaUser = await prisma.user.create({
      data: {
        ...validatedData,
        subscription: { create: subscriptionData },
        settings: { create: settingsData },
      },
    });

    return UserSchema.parse(prismaUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user.');
  }
}

export async function registerUser(data: RegisterUserData): Promise<User> {
  try {
    const validatedData = RegisterUserSchema.parse(data);

    const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

    return await createUser(
      {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        role: validatedData.role || 'admin',
        termsAcceptedVersion: CURRENT_TERMS_VERSION,
        termsAcceptedAt: data.acceptedTerms ? new Date() : null,
      },
      { language: validatedData.language },
    );
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
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

export async function deleteUser(userId: string): Promise<void> {
  try {
    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    throw new Error(`Failed to delete user ${userId}.`);
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  try {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  } catch (error) {
    console.error(`Error updating password for user ${userId}:`, error);
    throw new Error(`Failed to update password for user ${userId}.`);
  }
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      return false;
    }

    return await bcrypt.compare(password, user.passwordHash);
  } catch (error) {
    console.error(`Error verifying password for user ${userId}:`, error);
    throw new Error(`Failed to verify password for user ${userId}.`);
  }
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
