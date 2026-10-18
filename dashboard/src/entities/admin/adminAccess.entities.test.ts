import { describe, it, expect } from 'vitest';
import {
  getAvailableAdminSections,
  isAdminSectionAvailable,
  resolveAdminTargetBlocker,
  type AdminTargetAction,
} from '@/entities/admin/adminAccess.entities';

const other: { id: string; deletedAt: Date | null; isSuperAdmin: boolean } = {
  id: 'user-2',
  deletedAt: null,
  isSuperAdmin: false,
};

function blocker(
  action: AdminTargetAction,
  overrides: { edition?: 'cloud' | 'selfhost'; target?: Partial<typeof other> } = {},
) {
  return resolveAdminTargetBlocker({
    action,
    edition: overrides.edition ?? 'selfhost',
    actorUserId: 'user-1',
    target: { ...other, ...overrides.target },
  });
}

describe('admin sections per edition', () => {
  it('shows bug reports on cloud only', () => {
    expect(isAdminSectionAvailable('bug-reports', 'cloud')).toBe(true);
    expect(isAdminSectionAvailable('bug-reports', 'selfhost')).toBe(false);
  });

  it('shows users and the audit log in both editions', () => {
    expect(getAvailableAdminSections('selfhost')).toEqual(['users', 'audit-log']);
    expect(getAvailableAdminSections('cloud')).toEqual(['users', 'audit-log', 'bug-reports']);
  });
});

describe('resolveAdminTargetBlocker', () => {
  it('allows every action on another user on self-host', () => {
    for (const action of ['disable', 'enable', 'change_role', 'reset_password', 'reset_two_factor', 'delete'] as const) {
      expect(blocker(action)).toBeNull();
    }
  });

  it('never lets admins disable, demote, reset or delete themselves', () => {
    for (const action of ['disable', 'change_role', 'reset_password', 'reset_two_factor', 'delete'] as const) {
      expect(blocker(action, { target: { id: 'user-1' } })).toBe('self');
    }
  });

  it('lets admins sign out their own other sessions', () => {
    expect(blocker('revoke_sessions', { target: { id: 'user-1' } })).toBeNull();
  });

  it('hides role changes on cloud, where the role grants nothing', () => {
    expect(blocker('change_role', { edition: 'cloud' })).toBe('not_available');
  });

  it('protects other super admins on cloud', () => {
    expect(blocker('disable', { edition: 'cloud', target: { isSuperAdmin: true } })).toBe('super_admin');
    expect(blocker('revoke_sessions', { edition: 'cloud', target: { isSuperAdmin: true } })).toBe('super_admin');
  });

  it('ignores the super admin allowlist on self-host', () => {
    expect(blocker('disable', { target: { isSuperAdmin: true } })).toBeNull();
  });

  it('blocks every action on a deleted user', () => {
    expect(blocker('enable', { target: { deletedAt: new Date() } })).toBe('deleted');
    expect(blocker('revoke_sessions', { target: { deletedAt: new Date() } })).toBe('deleted');
  });
});
