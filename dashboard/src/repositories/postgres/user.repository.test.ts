import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findUserById,
  findUserByEmail,
  findCredentialAccount,
  createUser,
  countActiveAdmins,
  countActiveUsers,
  deleteUserAccount,
  setUserDisabledUnlessBlocked,
  setUserRoleUnlessBlocked,
  resetUserTwoFactor,
} from '@/repositories/postgres/user.repository';
import { makeUser } from '@/test/auth-fixtures';

const prismaMock = vi.hoisted(() => {
  const mock = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    userDashboard: {
      findMany: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    dashboard: {
      updateMany: vi.fn(),
    },
    dashboardInvitation: {
      updateMany: vi.fn(),
    },
    statusPage: {
      updateManyAndReturn: vi.fn(),
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
    adminAuditLog: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
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


function mockCounts(activeAdmins: number, activeUsers: number) {
  prismaMock.user.count.mockImplementation(async ({ where }: { where: { role?: string } }) =>
    where.role === 'admin' ? activeAdmins : activeUsers,
  );
}

const enabledAdmin = { role: 'admin', deletedAt: null, disabledAt: null };

describe('countActiveAdmins', () => {
  it('counts admins that are neither deleted nor disabled', async () => {
    prismaMock.user.count.mockResolvedValue(1);

    expect(await countActiveAdmins()).toBe(1);
    expect(prismaMock.user.count).toHaveBeenCalledWith({
      where: { role: 'admin', deletedAt: null, disabledAt: null },
    });
  });

  it('wraps database failures', async () => {
    prismaMock.user.count.mockRejectedValue(new Error('db down'));

    await expect(countActiveAdmins()).rejects.toThrow(/Failed to count active admins/);
  });
});

describe('countActiveUsers', () => {
  it('counts users that are neither deleted nor disabled', async () => {
    prismaMock.user.count.mockResolvedValue(3);

    expect(await countActiveUsers()).toBe(3);
    expect(prismaMock.user.count).toHaveBeenCalledWith({ where: { deletedAt: null, disabledAt: null } });
  });
});

describe('deleteUserAccount', () => {
  const deleteOwned = { guard: false, ownedDashboards: { mode: 'delete' as const } };

  beforeEach(() => {
    prismaMock.userDashboard.findMany.mockResolvedValue([]);
    prismaMock.statusPage.updateManyAndReturn.mockResolvedValue([]);
  });

  it('runs the full cleanup inside a single locked transaction', async () => {
    await deleteUserAccount('user-1', deleteOwned);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$executeRaw.mock.calls[0][0].join('')).toContain('pg_advisory_xact_lock');
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(prismaMock.mcpToken.updateMany).toHaveBeenCalledTimes(1);
  });

  it('scrubs identity and credentials and marks the user deleted', async () => {
    await deleteUserAccount('user-1', deleteOwned);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        email: 'deleted_user-1@deleted.invalid',
        name: null,
        image: null,
        role: null,
        twoFactorEnabled: false,
        totpSecret: null,
        emailVerified: false,
        deletedAt: expect.any(Date),
      },
    });
  });

  it('removes accounts (incl. credential), sessions, 2FA rows, and reset tokens, and soft-deletes MCP tokens', async () => {
    await deleteUserAccount('user-1', deleteOwned);

    expect(prismaMock.account.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.twoFactor.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.verification.deleteMany).toHaveBeenCalledWith({ where: { value: 'user-1' } });
    expect(prismaMock.mcpToken.updateMany).toHaveBeenCalledWith({
      where: { createdBy: 'user-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('scrubs their email from audit log entries they appear in', async () => {
    await deleteUserAccount('user-1', deleteOwned);

    expect(prismaMock.adminAuditLog.updateMany).toHaveBeenCalledWith({
      where: { targetType: 'user', targetId: 'user-1' },
      data: { targetLabel: null },
    });
    expect(prismaMock.adminAuditLog.updateMany).toHaveBeenCalledWith({
      where: { actorUserId: 'user-1' },
      data: { actorLabel: null },
    });
  });

  it('soft-deletes owned dashboards and cancels their pending invitations', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([{ id: 'ud-1', dashboardId: 'dash-1' }]);

    await deleteUserAccount('user-1', deleteOwned);

    expect(prismaMock.dashboard.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['dash-1'] } },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.dashboardInvitation.updateMany).toHaveBeenCalledWith({
      where: { dashboardId: { in: ['dash-1'] }, status: 'pending' },
      data: { status: 'cancelled' },
    });
  });

  it("releases the deleted dashboards' live status pages with the dashboards' deletion time", async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([
      { id: 'ud-1', dashboardId: 'dash-1' },
      { id: 'ud-2', dashboardId: 'dash-2' },
    ]);

    await deleteUserAccount('user-1', deleteOwned);

    const dashboardDeletedAt = prismaMock.dashboard.updateMany.mock.calls[0][0].data.deletedAt;
    expect(prismaMock.statusPage.updateManyAndReturn).toHaveBeenCalledWith({
      where: { dashboardId: { in: ['dash-1', 'dash-2'] }, deletedAt: null },
      data: { deletedAt: dashboardDeletedAt },
      select: { slug: true },
    });
  });

  it('hands owned dashboards to the recipient instead of deleting them', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([{ id: 'ud-1', dashboardId: 'dash-1' }]);
    prismaMock.user.findFirst.mockResolvedValue({ id: 'user-2' });

    const outcome = await deleteUserAccount('user-1', {
      guard: false,
      ownedDashboards: { mode: 'transfer', toUserId: 'user-2' },
    });

    expect(outcome).toBeNull();
    expect(prismaMock.dashboard.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.statusPage.updateManyAndReturn).not.toHaveBeenCalled();
    expect(prismaMock.userDashboard.delete).toHaveBeenCalledWith({ where: { id: 'ud-1' } });
    expect(prismaMock.userDashboard.upsert).toHaveBeenCalledWith({
      where: { userId_dashboardId: { userId: 'user-2', dashboardId: 'dash-1' } },
      create: { userId: 'user-2', dashboardId: 'dash-1', role: 'owner' },
      update: { role: 'owner' },
    });
  });

  it('refuses a recipient that is not an enabled user, without writing', async () => {
    prismaMock.user.findFirst.mockResolvedValue(null);

    const outcome = await deleteUserAccount('user-1', {
      guard: false,
      ownedDashboards: { mode: 'transfer', toUserId: 'user-2' },
    });

    expect(outcome).toBe('invalid_recipient');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.userDashboard.upsert).not.toHaveBeenCalled();
  });

  it('refuses the last enabled admin without writing when guarded', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(1, 2);

    expect(await deleteUserAccount('user-1', { ...deleteOwned, guard: true })).toBe('last_admin');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.dashboard.updateMany).not.toHaveBeenCalled();
  });

  it('takes the advisory lock before reading the counts', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(2, 2);

    await deleteUserAccount('user-1', { ...deleteOwned, guard: true });

    expect(prismaMock.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMock.user.count.mock.invocationCallOrder[0],
    );
  });

  it('wraps transaction failures', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('db down'));

    await expect(deleteUserAccount('user-1', deleteOwned)).rejects.toThrow('Failed to delete user user-1.');
  });
});

describe('setUserDisabledUnlessBlocked', () => {
  it('disables the user, ends their sessions and voids their reset links', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: null, deletedAt: null, disabledAt: null });
    mockCounts(1, 2);

    expect(await setUserDisabledUnlessBlocked('user-1', true, { guard: true })).toBeNull();
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { disabledAt: expect.any(Date) },
    });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.verification.deleteMany).toHaveBeenCalledWith({
      where: { value: 'user-1', identifier: { startsWith: 'reset-password:' } },
    });
  });

  it('refuses to disable the last enabled admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(1, 3);

    expect(await setUserDisabledUnlessBlocked('user-1', true, { guard: true })).toBe('last_admin');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
    expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
  });

  it('skips the last-admin check when unguarded (cloud)', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(1, 3);

    expect(await setUserDisabledUnlessBlocked('user-1', true, { guard: false })).toBeNull();
    expect(prismaMock.user.count).not.toHaveBeenCalled();
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('re-enables without touching sessions', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: null, deletedAt: null, disabledAt: new Date() });

    expect(await setUserDisabledUnlessBlocked('user-1', false, { guard: true })).toBeNull();
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { disabledAt: null } });
    expect(prismaMock.session.deleteMany).not.toHaveBeenCalled();
  });

  it('leaves deleted users alone', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: null, deletedAt: new Date(), disabledAt: null });

    expect(await setUserDisabledUnlessBlocked('user-1', true, { guard: true })).toBeNull();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });
});

describe('setUserRoleUnlessBlocked', () => {
  it('refuses to demote the last enabled admin', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(1, 3);

    expect(await setUserRoleUnlessBlocked('user-1', null)).toBe('last_admin');
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it('demotes when another enabled admin remains', async () => {
    prismaMock.user.findUnique.mockResolvedValue(enabledAdmin);
    mockCounts(2, 3);

    expect(await setUserRoleUnlessBlocked('user-1', null)).toBeNull();
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { role: null } });
  });

  it('demotes a disabled admin even when no other admin is enabled', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ ...enabledAdmin, disabledAt: new Date() });
    mockCounts(1, 3);

    expect(await setUserRoleUnlessBlocked('user-1', null)).toBeNull();
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it('promotes without counting', async () => {
    prismaMock.user.findUnique.mockResolvedValue({ role: null, deletedAt: null, disabledAt: null });

    expect(await setUserRoleUnlessBlocked('user-1', 'admin')).toBeNull();
    expect(prismaMock.user.count).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalledWith({ where: { id: 'user-1' }, data: { role: 'admin' } });
  });
});

describe('resetUserTwoFactor', () => {
  it('removes 2FA, trusted devices and pending challenges, and ends sessions', async () => {
    await resetUserTwoFactor('user-1');

    expect(prismaMock.twoFactor.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { twoFactorEnabled: false, totpSecret: null },
    });
    expect(prismaMock.verification.deleteMany).toHaveBeenCalledWith({
      where: {
        value: 'user-1',
        OR: [{ identifier: { startsWith: 'trust-device-' } }, { identifier: { startsWith: '2fa-' } }],
      },
    });
    expect(prismaMock.session.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });
});
