import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  findAllUserDashboards,
  findDashboardMembers,
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
  },
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

const memberUser = { id: 'user-2', name: 'Member', email: 'member@example.com', image: null };
const memberRow = {
  id: 'ud-2',
  userId: 'user-2',
  dashboardId: 'dash-1',
  role: 'editor',
  isDefault: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  deletedById: null,
  user: memberUser,
};

beforeEach(() => {
  vi.clearAllMocks();
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
  it('updates the role on the live membership only', async () => {
    prismaMock.userDashboard.findFirstOrThrow.mockResolvedValue({ id: 'ud-2' });
    prismaMock.userDashboard.update.mockResolvedValue({ ...memberRow, role: 'viewer' });

    const member = await updateMemberRole('dash-1', 'user-2', 'viewer');

    expect(prismaMock.userDashboard.findFirstOrThrow).toHaveBeenCalledWith({
      where: { userId: 'user-2', dashboardId: 'dash-1', deletedAt: null },
      select: { id: true },
    });
    expect(prismaMock.userDashboard.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'ud-2' }, data: { role: 'viewer' } }),
    );
    expect(member.role).toBe('viewer');
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
