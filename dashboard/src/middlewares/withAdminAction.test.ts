import { describe, it, expect, vi, beforeEach } from 'vitest';
import { withAdminAction, withAdminQuery } from '@/middlewares/withAdminAction';
import { requireAdminActor } from '@/auth/admin-auth';
import { recordAdminAction } from '@/services/admin/auditLog.service';
import { ForbiddenError, UserException } from '@/lib/exceptions';
import type { AdminActor } from '@/entities/admin/adminAccess.entities';

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ unstable_rethrow: vi.fn() }));
vi.mock('@/auth/admin-auth', () => ({ requireAdminActor: vi.fn() }));
vi.mock('@/services/admin/auditLog.service', () => ({ recordAdminAction: vi.fn() }));

const selfHostAdmin: AdminActor = {
  userId: 'admin-1',
  email: 'admin@example.com',
  edition: 'selfhost',
  twoFactorEnabled: false,
  sessionToken: 'token',
};

const audit = async (userId: string) => ({ targetId: userId, targetLabel: 'user@example.com' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.mocked(requireAdminActor).mockResolvedValue(selfHostAdmin);
});

describe('withAdminAction', () => {
  it('runs the action and records a successful audit entry', async () => {
    const action = withAdminAction({ section: 'users', action: 'disable_user', targetType: 'user', audit }, async () => 'ok');

    expect(await action('user-1')).toEqual({ success: true, data: 'ok' });
    expect(recordAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ actor: selfHostAdmin, action: 'disable_user', targetId: 'user-1', status: 'success' }),
    );
  });

  it('records a failed audit entry and passes user-safe messages through', async () => {
    const action = withAdminAction({ section: 'users', action: 'disable_user', targetType: 'user', audit }, async () => {
      throw new UserException('This is the last admin.');
    });

    expect(await action('user-1')).toMatchObject({ success: false, error: { message: 'This is the last admin.' } });
    expect(recordAdminAction).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });

  it('masks unexpected errors', async () => {
    const action = withAdminAction({ section: 'users', action: 'disable_user', targetType: 'user', audit }, async () => {
      throw new Error('db down');
    });

    expect(await action('user-1')).toMatchObject({ success: false, error: { message: 'An error occurred' } });
  });

  it('refuses a section the edition does not have, without running or auditing', async () => {
    const fn = vi.fn();
    const action = withAdminAction(
      { section: 'bug-reports', action: 'update_bug_report_status', targetType: 'bug_report', audit },
      fn,
    );

    expect(await action('report-1')).toMatchObject({ success: false, error: { name: 'ForbiddenError' } });
    expect(fn).not.toHaveBeenCalled();
    expect(recordAdminAction).not.toHaveBeenCalled();
  });

  it('refuses non-admins without running or auditing', async () => {
    vi.mocked(requireAdminActor).mockRejectedValue(new ForbiddenError());
    const fn = vi.fn();
    const action = withAdminAction({ section: 'users', action: 'disable_user', targetType: 'user', audit }, fn);

    expect(await action('user-1')).toMatchObject({ success: false, error: { name: 'ForbiddenError' } });
    expect(fn).not.toHaveBeenCalled();
    expect(recordAdminAction).not.toHaveBeenCalled();
  });
});

describe('withAdminQuery', () => {
  it('gates cloud-only sections on self-host', async () => {
    const query = withAdminQuery('bug-reports', async () => []);

    expect(await query()).toMatchObject({ success: false, error: { name: 'ForbiddenError' } });
  });

  it('passes the actor to sections the edition has', async () => {
    const query = withAdminQuery('users', async (ctx) => ctx.actor.userId);

    expect(await query()).toEqual({ success: true, data: 'admin-1' });
  });
});
