import * as bcrypt from 'bcrypt';
import { findUserByEmail, createUser, registerUser } from '@/repositories/postgres/user';
import { findDashboardById, findUserDashboardWithDashboardOrNull } from '@/repositories/postgres/dashboard';
import { env } from '@/lib/env';
import { type User } from 'next-auth';
import { CreateUserData, LoginUserData, RegisterUserData, UserSchema } from '@/entities/user';
import { DEFAULT_USER_SETTINGS } from '@/entities/userSettings';
import { createUserSettings } from '@/repositories/postgres/userSettings';
import { v4 as uuidv4 } from 'uuid';
import { AuthContextSchema } from '@/entities/authContext';
import { UserException } from '@/lib/exceptions';
import { isValidTotp } from '@/services/totp.service';
import { notFound } from 'next/navigation';
import { DashboardFindByUserData } from '@/entities/dashboard';

const SALT_ROUNDS = 10;

/**
 * Verifies user credentials against stored password hash
 * @returns User object or null if verification fails
 */
export async function verifyCredentials(loginData: LoginUserData): Promise<User | null> {
  const { email, password, totp } = loginData;
  const dbUser = await findUserByEmail(email);

  if (!dbUser || !dbUser.passwordHash) {
    return null;
  }

  const passwordIsValid = await bcrypt.compare(password, dbUser.passwordHash);
  if (!passwordIsValid) {
    return null;
  }

  let validatedUser;
  try {
    validatedUser = UserSchema.parse({ ...dbUser });
  } catch (error) {
    console.error('Error validating authenticated user data:', error);
    return null;
  }

  if (!validatedUser.totpEnabled) {
    return validatedUser;
  }

  if (!totp) {
    throw new UserException('missing_otp');
  }

  const totpIsValid = isValidTotp(totp, validatedUser.totpSecret!);
  if (!totpIsValid) {
    throw new UserException('invalid_otp');
  }

  return validatedUser;
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
  const existingUser = await findUserByEmail(registrationData.email);

  if (existingUser) {
    throw new UserException(`User with that email already exists.`);
  }

  const newUser = await registerUser(registrationData);

  try {
    await createUserSettings(newUser.id, {
      ...DEFAULT_USER_SETTINGS,
      language: registrationData.language,
    });
  } catch (e) {
    console.error('Failed to create initial user settings with language:', e);
  }

  return UserSchema.parse(newUser);
}

export async function getAuthorizedDashboardContextOrNull(data: DashboardFindByUserData) {
  const result = await findUserDashboardWithDashboardOrNull(data);

  if (!result) return null;

  const { dashboardUser, dashboard } = result;

  return AuthContextSchema.parse({
    role: dashboardUser.role,
    userId: dashboardUser.userId,
    dashboardId: dashboard.id,
    siteId: dashboard.siteId,
    isDemo: false,
  });
}

export async function assertPublicDashboardAccess(dashboardId: string): Promise<void> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) return;
  notFound();
}
