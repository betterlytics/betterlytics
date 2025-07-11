import prisma from '@/lib/postgres';
import * as bcrypt from 'bcrypt';
import {
  User,
  UserSchema,
  CreateUserData,
  CreateUserSchema,
  RegisterUserSchema,
  RegisterUserData,
} from '@/entities/user';

const SALT_ROUNDS = 10;

export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const prismaUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!prismaUser) return null;

    return UserSchema.parse(prismaUser);
  } catch (error) {
    console.error(`Error finding user by email ${email}:`, error);
    throw new Error(`Failed to find user by email ${email}.`);
  }
}

export async function createUser(data: CreateUserData): Promise<User> {
  try {
    const validatedData = CreateUserSchema.parse(data);

    const prismaUser = await prisma.user.create({
      data: validatedData,
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

    const existingUser = await findUserByEmail(validatedData.email);

    if (existingUser) {
      throw new Error(`User with email ${validatedData.email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(validatedData.password, SALT_ROUNDS);

    return await createUser({
      email: validatedData.email,
      name: validatedData.name,
      passwordHash,
      role: validatedData.role || 'admin',
    });
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
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
