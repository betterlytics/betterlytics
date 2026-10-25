import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteDashboard } from '@/repositories/postgres/dashboard.repository';

const prismaMock = vi.hoisted(() => ({
  dashboard: { update: vi.fn() },
  statusPage: { updateManyAndReturn: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof prismaMock) => unknown) => fn(prismaMock));
});

describe('deleteDashboard', () => {
  it('soft-deletes the dashboard and releases its live status pages with the same timestamp', async () => {
    prismaMock.statusPage.updateManyAndReturn.mockResolvedValue([{ slug: 'acme' }]);

    expect(await deleteDashboard('d1')).toEqual(['acme']);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const { deletedAt } = prismaMock.dashboard.update.mock.calls[0][0].data;
    expect(prismaMock.dashboard.update).toHaveBeenCalledWith({ where: { id: 'd1' }, data: { deletedAt } });
    expect(deletedAt).toBeInstanceOf(Date);
    expect(prismaMock.statusPage.updateManyAndReturn).toHaveBeenCalledWith({
      where: { dashboardId: { in: ['d1'] }, deletedAt: null },
      data: { deletedAt },
      select: { slug: true },
    });
  });

  it('wraps failures', async () => {
    prismaMock.dashboard.update.mockRejectedValue(new Error('boom'));

    await expect(deleteDashboard('d1')).rejects.toThrow('Failed to delete dashboard d1.');
  });
});
