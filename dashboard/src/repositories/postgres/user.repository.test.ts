import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as bcrypt from 'bcrypt';
import {
  findUserById,
  findUserByEmail,
  findCredentialAccount,
  createUser,
  registerUser,
  updateUserPassword,
  verifyUserPassword,
  anonymizeUser,
} from '@/repositories/postgres/user.repository';
import { CURRENT_TERMS_VERSION } from '@/constants/legal';
import { makeUser, hashPassword } from '@/test/auth-fixtures';

const prismaMock = vi.hoisted(() => {
  const mock = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    twoFactor: {
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
    },
    mcpToken: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return mock;
});

vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_DEFAULT_LANGUAGE: 'en',
  },
}));
vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Supports both forms: an array of operations, or an interactive callback receiving tx.
  prismaMock.$transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === 'function' ? (arg as (tx: typeof prismaMock) => unknown)(prismaMock) : arg,
  );
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

  beforeEach(() => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: registration.email }));
  });

  it('stores a bcrypt hash on the credential account — never the plaintext, never on the user', async () => {
    await registerUser(registration);

    const userData = prismaMock.user.create.mock.calls[0][0].data;
    expect(userData.passwordHash).toBeUndefined();
    expect(userData.password).toBeUndefined();

    const accountData = prismaMock.account.create.mock.calls[0][0].data;
    expect(accountData.providerId).toBe('credential');
    expect(accountData.password).not.toBe(registration.password);
    expect(await bcrypt.compare(registration.password, accountData.password)).toBe(true);
  });

  it('links the credential account to the created user with accountId = user id', async () => {
    await registerUser(registration);

    const accountData = prismaMock.account.create.mock.calls[0][0].data;
    expect(accountData.userId).toBe('user-1');
    expect(accountData.accountId).toBe('user-1');
  });

  it('creates the user and credential account in one transaction', async () => {
    await registerUser(registration);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(typeof prismaMock.$transaction.mock.calls[0][0]).toBe('function');
  });

  it('records terms acceptance with the current terms version', async () => {
    await registerUser(registration);

    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.termsAcceptedVersion).toBe(CURRENT_TERMS_VERSION);
    expect(createData.termsAcceptedAt).toBeInstanceOf(Date);
  });

  it('defaults the role to admin', async () => {
    await registerUser(registration);

    expect(prismaMock.user.create.mock.calls[0][0].data.role).toBe('admin');
  });

  it('provisions a starter subscription and default settings alongside the user', async () => {
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
    await expect(createUser({ email: 'not-an-email', passwordHash: 'hash' })).rejects.toThrow(
      'Failed to create user.',
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });
});

describe('updateUserPassword', () => {
  it('stores a bcrypt hash of the new password on the credential account', async () => {
    prismaMock.account.update.mockResolvedValue({});

    await updateUserPassword('user-1', 'New-password-1');

    const updateCall = prismaMock.account.update.mock.calls[0][0];
    expect(updateCall.where).toEqual({
      providerId_accountId: { providerId: 'credential', accountId: 'user-1' },
    });
    expect(await bcrypt.compare('New-password-1', updateCall.data.password)).toBe(true);
  });

  it('throws when the user has no credential account row', async () => {
    prismaMock.account.update.mockRejectedValue(new Error('Record to update not found.'));

    await expect(updateUserPassword('user-1', 'New-password-1')).rejects.toThrow(
      'Failed to update password',
    );
  });
});

describe('verifyUserPassword', () => {
  it('returns true for the correct password', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ password: hashPassword('Correct-password-1') });

    expect(await verifyUserPassword('user-1', 'Correct-password-1')).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ password: hashPassword('Correct-password-1') });

    expect(await verifyUserPassword('user-1', 'Wrong-password-1')).toBe(false);
  });

  it('is case-sensitive on the password', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ password: hashPassword('Correct-password-1') });

    expect(await verifyUserPassword('user-1', 'CORRECT-PASSWORD-1')).toBe(false);
  });

  it('returns false for an OAuth-only account (no credential row)', async () => {
    prismaMock.account.findFirst.mockResolvedValue(null);

    expect(await verifyUserPassword('user-1', 'Any-password-1')).toBe(false);
  });
});

describe('findCredentialAccount', () => {
  it('looks up only the credential provider row with a password set', async () => {
    prismaMock.account.findFirst.mockResolvedValue({ id: 'account-1' });

    expect(await findCredentialAccount('user-1')).toEqual({ id: 'account-1' });
    expect(prismaMock.account.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1', providerId: 'credential', password: { not: null } },
      select: { id: true },
    });
  });
});

describe('anonymizeUser', () => {
  it('runs the full cleanup inside a single transaction', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction.mock.calls[0][0]).toHaveLength(6);
  });

  it('scrubs identity and credentials and marks the user deleted', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        email: 'deleted_user-1@deleted.invalid',
        name: null,
        image: null,
        twoFactorEnabled: false,
        totpSecret: null,
        emailVerified: false,
        deletedAt: expect.any(Date),
      },
    });
  });

  it('removes accounts (incl. credential), sessions, 2FA rows, and reset tokens, and soft-deletes MCP tokens', async () => {
    await anonymizeUser('user-1');

    expect(prismaMock.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.twoFactor.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
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
