import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leaveDashboard, removeMemberFromDashboard, updateMemberRole } from '@/services/dashboard/members.service';
import {
  findDashboardById,
  findUserDashboardOrNull,
  removeMember,
  updateMemberRole as updateMemberRoleRepo,
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

describe('updateMemberRole', () => {
  it('changes the role with the requester recorded as the changer', async () => {
    mockRoles({ 'user-1': 'owner', 'user-2': 'editor' });

    await updateMemberRole('dash-1', 'user-2', 'viewer', 'user-1');

    expect(updateMemberRoleRepo).toHaveBeenCalledWith('dash-1', 'user-2', 'viewer', 'user-1');
  });

  it('changes nothing when the member already has the role', async () => {
    mockRoles({ 'user-1': 'owner', 'user-2': 'editor' });

    await updateMemberRole('dash-1', 'user-2', 'editor', 'user-1');

    expect(updateMemberRoleRepo).not.toHaveBeenCalled();
  });

  it('still refuses a same-role request the requester may not make', async () => {
    mockRoles({ 'user-1': 'viewer', 'user-2': 'editor' });

    await expect(updateMemberRole('dash-1', 'user-2', 'editor', 'user-1')).rejects.toThrow(
      'Requester cannot modify this member role',
    );
    expect(updateMemberRoleRepo).not.toHaveBeenCalled();
  });
});
