/**
 * Characterization tests for the user repository (internal issue #50).
 *
 * Pins the storage contract the better-auth migration must preserve: bcrypt
 * hashing (existing hashes must keep verifying), registration defaults
 * (starter subscription, default settings, terms acceptance), and account
 * anonymization running as a single transaction that scrubs credentials and
 * revokes sessions/tokens atomically. Prisma is mocked at the client boundary.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import {
  findUserById,
  findUserByEmail,
  createUser,
  registerUser,
  updateUserPassword,
  verifyUserPassword,
  anonymizeUser,
} from '@/repositories/postgres/user.repository';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { makeUser, hashPassword } from '@/test/auth-fixtures';

const prismaMock = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  account: {
    findMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  session: {
    deleteMany: vi.fn(),
  },
  passwordResetToken: {
    deleteMany: vi.fn(),
  },
  mcpToken: {
    updateMany: vi.fn(),
  },
  $transaction: vi.fn(async (ops: unknown[]) => ops),
}));

vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (ops: unknown[]) => ops);
});

describe('findUserById / findUserByEmail', () => {
  it('returns the parsed user when found', async () => {
    const user = makeUser();
    prismaMock.user.findUnique.mockResolvedValue(user);

    expect(await findUserById(user.id)).toMatchObject({ id: user.id, email: user.email });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: user.id } });
  });

  it('returns null when no user exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    expect(await findUserByEmail('nobody@example.com')).toBeNull();
  });

  it('wraps database failures', async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error('db down'));

    await expect(findUserByEmail('user@example.com')).rejects.toThrow(/Failed to find user/);
  });
});

describe('registerUser', () => {
  const registration = {
    email: 'new@example.com',
    name: 'New User',
    password: 'Valid-password-1',
    acceptedTerms: true as const,
    language: 'en' as const,
  };

  it('stores a bcrypt hash — never the plaintext password', async () => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: registration.email }));

    await registerUser(registration);

    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.passwordHash).toBeDefined();
    expect(createData.passwordHash).not.toBe(registration.password);
    expect(createData.password).toBeUndefined();
    expect(await bcrypt.compare(registration.password, createData.passwordHash)).toBe(true);
  });

  it('records terms acceptance with the current terms version', async () => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: registration.email }));

    await registerUser(registration);

    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.termsAcceptedVersion).toBe(CURRENT_TERMS_VERSION);
    expect(createData.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it('defaults the role to admin', async () => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: registration.email }));

    await registerUser(registration);

    expect(prismaMock.user.create.mock.calls[0][0].data.role).toBe('admin');
  });

  it('provisions a starter subscription and default settings alongside the user', async () => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: registration.email }));

    await registerUser(registration);

    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.subscription.create).toBeDefined();
    expect(createData.settings.create).toMatchObject({ language: 'en' });
  });

  it('rejects a password that violates the policy before touching the database', async () => {
    await expect(registerUser({ ...registration, password: 'short' })).rejects.toThrow();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('createUser', () => {
  it('wraps validation failures in a generic error', async () => {
    await expect(
      createUser({ email: 'not-an-email', passwordHash: 'hash' }),
    ).rejects.toThrow('Failed to create user.');
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('updateUserPassword', () => {
  it('stores a bcrypt hash of the new password', async () => {
    prismaMock.user.update.mockResolvedValue(makeUser());

    await updateUserPassword('user-1', 'New-password-1');

    const updateCall = prismaMock.user.update.mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: 'user-1' });
    expect(await bcrypt.compare('New-password-1', updateCall.data.passwordHash)).toBe(true);
  });
});

describe('verifyUserPassword', () => {
  it('returns true for the correct password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: hashPassword('Correct-password-1') });

    expect(await verifyUserPassword('user-1', 'Correct-password-1')).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: hashPassword('Correct-password-1') });

    expect(await verifyUserPassword('user-1', 'Wrong-password-1')).toBe(false);
  });

  it('returns false for an OAuth-only account (no hash stored)', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ passwordHash: null });

    expect(await verifyUserPassword('user-1', 'Any-password-1')).toBe(false);
  });

  it('returns false for a missing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    expect(await verifyUserPassword('missing', 'Any-password-1')).toBe(false);
  });
});

describe('anonymizeUser', () => {
  it('runs the full cleanup inside a single transaction', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(5);
  });

  it('scrubs identity and credentials and marks the user deleted', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        email: 'deleted_user-1@deleted.invalid',
        name: null,
        image: null,
        passwordHash: null,
        totpEnabled: false,
        totpSecret: null,
        emailVerified: null,
        deletedAt: expect.any(Date),
      },
    });
  });

  it('removes OAuth accounts, sessions, and reset tokens, and soft-deletes MCP tokens', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.passwordResetToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.mcpToken.updateMany).toHaveBeenCalledWith({
      where: { createdBy: 'user-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('wraps transaction failures', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('db down'));

    await expect(anonymizeUser('user-1')).rejects.toThrow('Failed to anonymize user user-1.');
  });
});
