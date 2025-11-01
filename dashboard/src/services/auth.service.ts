import * as bcrypt from 'bcrypt';
import { findUserByEmail, createUser, registerUser } from '@/repositories/postgres/user';
import {
  findDashboardById,
  findUserDashboard,
  findUserDashboardOrNull,
  findUserDashboardWithDashboardOrNull,
} from '@/repositories/postgres/dashboard';
import { env } from '@/lib/env';
import { getServerSession, type Session, type User } from 'next-auth';
import { CreateUserData, LoginUserData, RegisterUserData, UserSchema } from '@/entities/user';
import { DEFAULT_USER_SETTINGS } from '@/entities/userSettings';
import { createUserSettings } from '@/repositories/postgres/userSettings';
import { v4 as uuidv4 } from 'uuid';
import { AuthContext, AuthContextSchema } from '@/entities/authContext';
import { UserException } from '@/lib/exceptions';
import { isValidTotp } from '@/services/totp.service';
import { authOptions } from '@/lib/auth';
import { cache } from 'react';
import { notFound } from 'next/navigation';

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

export async function isUserAuthorizedForDashboard(userId: string, dashboardId: string): Promise<boolean> {
  const userDashboard = await findUserDashboardOrNull({ userId, dashboardId });
  return userDashboard !== null;
}

export async function getAuthorizedDashboardContextOrNull(
  userId: string,
  dashboardId: string,
): Promise<AuthContext | null> {
  const rel = await findUserDashboardWithDashboardOrNull({ userId, dashboardId });
  if (!rel) return null;
  return AuthContextSchema.parse({
    role: rel.userDashboard.role,
    userId: rel.userDashboard.userId,
    dashboardId: rel.dashboard.id,
    siteId: rel.dashboard.siteId,
  });
}

export const getAuthorizedDashboardContextOrNullCached = cache(
  async (userId: string, dashboardId: string): Promise<AuthContext | null> => {
    return getAuthorizedDashboardContextOrNull(userId, dashboardId);
  },
);

export type DashboardAccess = {
  session: Session | null;
  isAuthorized: boolean;
  isDemo: boolean;
};

export async function getDashboardAccess(dashboardId: string): Promise<DashboardAccess> {
  const session = await getServerSession(authOptions);

  const isAuthorized = session?.user
    ? (await getAuthorizedDashboardContextOrNullCached(session.user.id, dashboardId)) !== null
    : false;

  const isDemo = !isAuthorized && Boolean(env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID);

  return { session, isAuthorized, isDemo };
}

export const getDashboardAccessCached = cache(async (dashboardId: string): Promise<DashboardAccess> => {
  return getDashboardAccess(dashboardId);
});

export async function assertPublicDashboardAccess(dashboardId: string): Promise<void> {
  if (env.DEMO_DASHBOARD_ID && dashboardId === env.DEMO_DASHBOARD_ID) return;

  try {
    const dash = await findDashboardById(dashboardId);
    if (!dash) notFound();
  } catch (_e) {
    notFound();
  }

  notFound();
}
