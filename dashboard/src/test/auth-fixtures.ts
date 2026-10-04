import * as bcrypt from 'bcrypt';
import type { User } from '@/entities/auth/user.entities';

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
    role: 'admin',
    emailVerified: true,
    image: null,
    twoFactorEnabled: false,
    termsAcceptedVersion: 1,
    termsAcceptedAt: new Date('2024-01-01T00:00:00Z'),
    changelogVersionSeen: 'v0',
    onboardingCompletedAt: new Date('2024-01-02T00:00:00Z'),
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

/** Low cost factor to keep tests fast. */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 4);
}
