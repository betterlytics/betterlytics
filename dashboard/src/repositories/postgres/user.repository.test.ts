import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findUserById,
  findUserByEmail,
  findCredentialAccount,
  createUser,
  anonymizeUser,
} from '@/repositories/postgres/user.repository';
import { makeUser } from '@/test/auth-fixtures';

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
    verification: {
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

describe('createUser', () => {
  const creation = {
    email: 'new@example.com',
    name: 'New User',
    passwordHash: '$2b$10$fixture-hash',
  };

  beforeEach(() => {
    prismaMock.user.create.mockResolvedValue(makeUser({ email: creation.email }));
  });

  it('stores the hash on the credential account — never on the user', async () => {
    await createUser(creation);

    const userData = prismaMock.user.create.mock.calls[0][0].data;
    expect(userData.passwordHash).toBeUndefined();
    expect(userData.password).toBeUndefined();

    const accountData = prismaMock.account.create.mock.calls[0][0].data;
    expect(accountData.providerId).toBe('credential');
    expect(accountData.password).toBe(creation.passwordHash);
  });

  it('links the credential account to the created user with accountId = user id', async () => {
    await createUser(creation);

    const accountData = prismaMock.account.create.mock.calls[0][0].data;
    expect(accountData.userId).toBe('user-1');
    expect(accountData.accountId).toBe('user-1');
  });

  it('creates the user and credential account in one transaction', async () => {
    await createUser(creation);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(typeof prismaMock.$transaction.mock.calls[0][0]).toBe('function');
  });

  it('provisions a starter subscription and settings with the given language alongside the user', async () => {
    await createUser(creation, { language: 'da' });

    const createData = prismaMock.user.create.mock.calls[0][0].data;
    expect(createData.subscription.create).toBeDefined();
    expect(createData.settings.create).toMatchObject({ language: 'da' });
  });

  it('wraps validation failures in a generic error', async () => {
    await expect(createUser({ email: 'not-an-email', passwordHash: 'hash' })).rejects.toThrow(
      'Failed to create user.',
    );
    expect(prismaMock.user.create).not.toHaveBeenCalled();
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
    expect(prismaMock.verification.deleteMany).toHaveBeenCalledWith({ where: { value: 'user-1' } });
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
