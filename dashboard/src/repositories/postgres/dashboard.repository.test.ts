import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findAllUserDashboards,
  findDashboardMembers,
  findOwnedDashboards,
  findUserDashboardOrNull,
  removeMember,
  updateMemberRole,
} from '@/repositories/postgres/dashboard.repository';

const prismaMock = vi.hoisted(() => ({
  userDashboard: {
    findFirst: vi.fn(),
    findFirstOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

const memberUser = { id: 'user-2', name: 'Member', email: 'member@example.com', image: null };
const memberRow = {
  id: 'ud-2',
  userId: 'user-2',
  dashboardId: 'dash-1',
  role: 'editor',
  isDefault: false,
  joinedAt: new Date('2026-01-01T00:00:00Z'),
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deletedById: null,
  user: memberUser,
};

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock));
});

describe('removeMember', () => {
  it('ends the live membership with the remover set instead of deleting it', async () => {
    prismaMock.userDashboard.updateMany.mockResolvedValue({ count: 1 });

    await removeMember('dash-1', 'user-2', 'user-1');

    expect(prismaMock.userDashboard.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-2', dashboardId: 'dash-1', deletedAt: null },
      data: { deletedAt: expect.any(Date), deletedById: 'user-1' },
    });
  });

  it('fails when there is no live membership to end', async () => {
    prismaMock.userDashboard.updateMany.mockResolvedValue({ count: 0 });

    await expect(removeMember('dash-1', 'user-2', 'user-1')).rejects.toThrow('Failed to remove member');
  });
});

describe('updateMemberRole', () => {
  const joinedAt = new Date('2026-01-01T00:00:00Z');

  beforeEach(() => {
    prismaMock.userDashboard.findFirstOrThrow.mockResolvedValue({ id: 'ud-2', joinedAt, isDefault: true });
    prismaMock.userDashboard.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.userDashboard.create.mockResolvedValue({ ...memberRow, id: 'ud-3', role: 'viewer' });
  });

  it('ends the live row and opens one with the new role at the same moment', async () => {
    const member = await updateMemberRole('dash-1', 'user-2', 'viewer', 'user-1');

    expect(prismaMock.userDashboard.findFirstOrThrow).toHaveBeenCalledWith({
      where: { userId: 'user-2', dashboardId: 'dash-1', deletedAt: null },
      select: { id: true, joinedAt: true, isDefault: true },
    });
    const ended = prismaMock.userDashboard.updateMany.mock.calls[0][0];
    const opened = prismaMock.userDashboard.create.mock.calls[0][0];
    expect(ended).toEqual({
      where: { id: 'ud-2', deletedAt: null },
      data: { deletedAt: expect.any(Date), deletedById: 'user-1' },
    });
    expect(opened.data).toEqual({
      userId: 'user-2',
      dashboardId: 'dash-1',
      role: 'viewer',
      isDefault: true,
      joinedAt,
      createdAt: ended.data.deletedAt,
    });
    expect(member.role).toBe('viewer');
    expect(member.joinedAt).toEqual(joinedAt);
  });

  it('ends the old row before opening the new one, so one row stays live', async () => {
    await updateMemberRole('dash-1', 'user-2', 'viewer', 'user-1');

    expect(prismaMock.userDashboard.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      prismaMock.userDashboard.create.mock.invocationCallOrder[0],
    );
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('fails as a whole when opening the new row fails', async () => {
    prismaMock.userDashboard.create.mockRejectedValue(new Error('unique violation'));

    await expect(updateMemberRole('dash-1', 'user-2', 'viewer', 'user-1')).rejects.toThrow(
      'Failed to update member role',
    );
    // Both writes ran inside the one transaction, which Prisma rolls back on the rejection
    expect(prismaMock.userDashboard.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it('fails without opening a row when the membership ended in the meantime', async () => {
    prismaMock.userDashboard.updateMany.mockResolvedValue({ count: 0 });

    await expect(updateMemberRole('dash-1', 'user-2', 'viewer', 'user-1')).rejects.toThrow(
      'Failed to update member role',
    );
    expect(prismaMock.userDashboard.create).not.toHaveBeenCalled();
  });
});

describe('membership date ordering', () => {
  it('orders members by their joined date', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([memberRow]);

    const [member] = await findDashboardMembers('dash-1');

    expect(prismaMock.userDashboard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }] }),
    );
    expect(member.joinedAt).toEqual(memberRow.joinedAt);
  });

  it('orders the dashboard list and owned dashboards by joined date', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([]);

    await findAllUserDashboards('user-1');
    await findOwnedDashboards('user-1');

    expect(prismaMock.userDashboard.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ orderBy: { joinedAt: 'desc' } }),
    );
    expect(prismaMock.userDashboard.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ orderBy: { joinedAt: 'desc' } }),
    );
  });
});

describe('membership reads skip ended memberships', () => {
  it('only grants access through a live membership', async () => {
    prismaMock.userDashboard.findFirst.mockResolvedValue(null);

    expect(await findUserDashboardOrNull({ userId: 'user-2', dashboardId: 'dash-1' })).toBeNull();
    expect(prismaMock.userDashboard.findFirst).toHaveBeenCalledWith({
      where: { dashboardId: 'dash-1', userId: 'user-2', deletedAt: null, dashboard: { deletedAt: null } },
    });
  });

  it('lists only live members', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([memberRow]);

    await findDashboardMembers('dash-1');

    expect(prismaMock.userDashboard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { dashboardId: 'dash-1', deletedAt: null } }),
    );
  });

  it('lists live dashboards with a member count of live members', async () => {
    prismaMock.userDashboard.findMany.mockResolvedValue([]);

    await findAllUserDashboards('user-1');

    expect(prismaMock.userDashboard.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', deletedAt: null, dashboard: { deletedAt: null } },
        include: {
          dashboard: { include: { _count: { select: { userAccess: { where: { deletedAt: null } } } } } },
        },
      }),
    );
  });
});
