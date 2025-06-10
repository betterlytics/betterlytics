import * as bcrypt from 'bcrypt';
import { findUserByEmail, createUser, registerUser } from '@/repositories/postgres/user';
import { findDashboardById, findUserDashboard } from '@/repositories/postgres/dashboard';
import { env } from '@/lib/env';
import type { User } from 'next-auth';
import { CreateUserData, LoginUserData, RegisterUserData, UserSchema } from '@/entities/user';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext, AuthContextSchema } from '@/entities/authContext';
import { isFeatureEnabled } from '@/lib/feature-flags';

const SALT_ROUNDS = 10;

/**
 * Verifies user credentials against stored password hash
 * @returns User object or null if verification fails
 */
export async function verifyCredentials(loginData: LoginUserData): Promise<User | null> {
  const { email, password } = loginData;
  const dbUser = await findUserByEmail(email);

  if (!dbUser || !dbUser.passwordHash) {
    return null;
  }

  const passwordIsValid = await bcrypt.compare(password, dbUser.passwordHash);
  if (!passwordIsValid) {
    return null;
  }

  try {
    return UserSchema.parse({
      ...dbUser,
    });
  } catch (error) {
    console.error('Error validating authenticated user data:', error);
    return null;
  }
}

/**
 * Attempts to initialize an admin account if no users exist with admin email
 * Only proceeds when credentials match environment variables
 */
export async function attemptAdminInitialization(email: string, password: string): Promise<User | null> {
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    return null;
  }

  const existingAdmin = await findUserByEmail(email);
  if (existingAdmin) {
    return null;
  }

  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const adminUserData: CreateUserData = {
      email,
      name: 'Admin',
      passwordHash: hashedPassword,
      role: 'admin',
    };

    const newAdminUser = await createUser(adminUserData);

    const siteId = uuidv4();

    return UserSchema.parse({
      ...newAdminUser,
      siteId,
    });
  } catch (error) {
    console.error('Error during initial admin setup:', error);
    return null;
  }
}

export async function registerNewUser(registrationData: RegisterUserData): Promise<User> {
  if (!isFeatureEnabled('enableRegistration')) {
    throw new Error('Registration is disabled');
  }

  try {
    const newUser = await registerUser(registrationData);
    return UserSchema.parse(newUser);
  } catch (error) {
    console.error('Error during user registration:', error);
    throw error;
  }
}

export async function authorizeUserDashboard(userId: string, dashboardId: string): Promise<AuthContext> {
  const userDashboard = await findUserDashboard({ userId, dashboardId });
  const dashboard = await findDashboardById(userDashboard.dashboardId);

  const context: AuthContext = {
    role: userDashboard.role,
    userId: userDashboard.userId,
    dashboardId: dashboard.id,
    siteId: dashboard.siteId,
  };

  return AuthContextSchema.parse(context);
}
