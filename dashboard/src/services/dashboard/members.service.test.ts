import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaveDashboard, removeMemberFromDashboard } from '@/services/dashboard/members.service';
import {
  findDashboardById,
  findUserDashboardOrNull,
  removeMember,
} from '@/repositories/postgres/dashboard.repository';
import { findUserById } from '@/repositories/postgres/user.repository';
import { enqueueEmail } from '@/services/email/email.service';
import type { DashboardRole } from '@prisma/client';

vi.mock('@/repositories/postgres/dashboard.repository', () => ({
  findDashboardById: vi.fn(),
  findDashboardMembers: vi.fn(),
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  findUserDashboardOrNull: vi.fn(),
  findMemberDashboardsCount: vi.fn(),
}));
vi.mock('@/repositories/postgres/user.repository', () => ({ findUserById: vi.fn() }));
vi.mock('@/services/email/email.service', () => ({ enqueueEmail: vi.fn() }));
vi.mock('@/services/email/recipient-key.service', () => ({
  createUserRecipientKey: (id: string) => `user:${id}`,
}));

function access(userId: string, role: DashboardRole) {
  return { id: `ud-${userId}`, userId, dashboardId: 'dash-1', role, isDefault: false };
}

function mockRoles(roles: Record<string, DashboardRole>) {
  vi.mocked(findUserDashboardOrNull).mockImplementation(async ({ userId }) =>
    roles[userId] ? (access(userId, roles[userId]) as never) : null,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(findUserById).mockResolvedValue({
    id: 'user-2',
    email: 'member@example.com',
    name: 'Member',
  } as never);
  vi.mocked(findDashboardById).mockResolvedValue({ id: 'dash-1', domain: 'example.com' } as never);
});

describe('removeMemberFromDashboard', () => {
  it('ends the membership with the requester as remover and notifies the removed member', async () => {
    mockRoles({ 'user-1': 'owner', 'user-2': 'editor' });

    await removeMemberFromDashboard('dash-1', 'user-2', 'user-1');

    expect(removeMember).toHaveBeenCalledWith('dash-1', 'user-2', 'user-1');
    expect(enqueueEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'member-removed',
        data: expect.objectContaining({ to: 'member@example.com', dashboardDomain: 'example.com' }),
      }),
    );
  });

  it('refuses to remove the owner', async () => {
    mockRoles({ 'user-1': 'admin', 'user-2': 'owner' });

    await expect(removeMemberFromDashboard('dash-1', 'user-2', 'user-1')).rejects.toThrow(
      'Cannot remove owner from dashboard',
    );
    expect(removeMember).not.toHaveBeenCalled();
  });
});

describe('leaveDashboard', () => {
  it('ends the membership with the member as remover and sends no email', async () => {
    mockRoles({ 'user-2': 'viewer' });

    await leaveDashboard('dash-1', 'user-2');

    expect(removeMember).toHaveBeenCalledWith('dash-1', 'user-2', 'user-2');
    expect(enqueueEmail).not.toHaveBeenCalled();
  });
});
