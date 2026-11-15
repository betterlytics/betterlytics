import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteMonitorCheck,
  getMonitorDeletionImpact,
  updateMonitorCheck,
} from '@/repositories/postgres/monitoring.repository';

const prismaMock = vi.hoisted(() => ({
  monitorCheck: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  monitorPausePeriod: {
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  statusPageMonitor: {
    deleteMany: vi.fn(),
  },
  statusPage: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({
  default: prismaMock,
}));

const DASHBOARD_ID = 'dash-1';
const MONITOR_ID = 'mon-1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteMonitorCheck', () => {
  it('detaches the monitor and soft-deletes it in one transaction, detachment first', async () => {
    const detach = { op: 'detach' };
    const softDelete = { op: 'softDelete' };
    prismaMock.statusPageMonitor.deleteMany.mockReturnValue(detach);
    prismaMock.monitorCheck.update.mockReturnValue(softDelete);
    prismaMock.$transaction.mockResolvedValue([{ count: 2 }, {}]);

    await deleteMonitorCheck(DASHBOARD_ID, MONITOR_ID);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(prismaMock.$transaction).toHaveBeenCalledWith([detach, softDelete]);
    expect(prismaMock.statusPageMonitor.deleteMany).toHaveBeenCalledWith({
      where: { dashboardId: DASHBOARD_ID, monitorCheckId: MONITOR_ID },
    });
    expect(prismaMock.monitorCheck.update).toHaveBeenCalledWith({
      where: { id_dashboardId: { id: MONITOR_ID, dashboardId: DASHBOARD_ID } },
      data: { deletedAt: expect.any(Date) },
    });
  });

  it('rejects when the transaction fails', async () => {
    prismaMock.$transaction.mockRejectedValue(new Error('rollback'));

    await expect(deleteMonitorCheck(DASHBOARD_ID, MONITOR_ID)).rejects.toThrow('rollback');
  });
});

describe('getMonitorDeletionImpact', () => {
  const row = (id: string, isPublished: boolean, remaining: number) => ({
    id,
    name: `Page ${id}`,
    isPublished,
    _count: { monitors: remaining },
  });

  it('scopes the lookup to live pages of the dashboard that contain the monitor', async () => {
    prismaMock.statusPage.findMany.mockResolvedValue([]);

    await getMonitorDeletionImpact(DASHBOARD_ID, MONITOR_ID);

    const args = prismaMock.statusPage.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      dashboardId: DASHBOARD_ID,
      deletedAt: null,
      monitors: { some: { monitorCheckId: MONITOR_ID } },
    });
    expect(args.select._count.select.monitors.where).toEqual({
      monitorCheckId: { not: MONITOR_ID },
      monitorCheck: { deletedAt: null },
    });
  });

  it.each([
    { name: 'published page losing its last monitor', isPublished: true, remaining: 0, willBeEmpty: true },
    { name: 'published page keeping another monitor', isPublished: true, remaining: 1, willBeEmpty: false },
    { name: 'draft page losing its last monitor', isPublished: false, remaining: 0, willBeEmpty: false },
    { name: 'draft page keeping another monitor', isPublished: false, remaining: 2, willBeEmpty: false },
  ])('$name: willBeEmpty is $willBeEmpty', async ({ isPublished, remaining, willBeEmpty }) => {
    prismaMock.statusPage.findMany.mockResolvedValue([row('p1', isPublished, remaining)]);

    expect(await getMonitorDeletionImpact(DASHBOARD_ID, MONITOR_ID)).toEqual([
      { id: 'p1', name: 'Page p1', willBeEmpty },
    ]);
  });

  it('returns every affected page in query order', async () => {
    prismaMock.statusPage.findMany.mockResolvedValue([row('a', true, 0), row('b', true, 1), row('c', false, 0)]);

    const result = await getMonitorDeletionImpact(DASHBOARD_ID, MONITOR_ID);

    expect(result.map((page) => page.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty list when no page contains the monitor', async () => {
    prismaMock.statusPage.findMany.mockResolvedValue([]);

    expect(await getMonitorDeletionImpact(DASHBOARD_ID, MONITOR_ID)).toEqual([]);
  });

  it('rejects when the lookup fails', async () => {
    prismaMock.statusPage.findMany.mockRejectedValue(new Error('db down'));

    await expect(getMonitorDeletionImpact(DASHBOARD_ID, MONITOR_ID)).rejects.toThrow('db down');
  });
});

describe('updateMonitorCheck pause recording', () => {
  const UNRECORDED_PAUSED_AT = new Date('2026-11-01T10:00:00Z');

  beforeEach(() => {
    prismaMock.$transaction.mockImplementation(async (run) => run(prismaMock));
    prismaMock.monitorCheck.update.mockImplementation(async ({ data }) => ({
      id: MONITOR_ID,
      dashboardId: DASHBOARD_ID,
      url: 'https://example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }));
    prismaMock.monitorPausePeriod.updateMany.mockResolvedValue({ count: 0 });
  });

  it('opens a pause period when pausing', async () => {
    prismaMock.monitorCheck.updateMany.mockResolvedValue({ count: 1 });

    await updateMonitorCheck(DASHBOARD_ID, { id: MONITOR_ID, isEnabled: false });

    expect(prismaMock.monitorCheck.updateMany).toHaveBeenCalledWith({
      where: { id: MONITOR_ID, dashboardId: DASHBOARD_ID, isEnabled: true },
      data: { isEnabled: false },
    });
    expect(prismaMock.monitorPausePeriod.create).toHaveBeenCalledWith({
      data: { monitorCheckId: MONITOR_ID, pausedAt: expect.any(Date) },
    });
    expect(prismaMock.monitorPausePeriod.updateMany).not.toHaveBeenCalled();
  });

  it('closes the open pause period when resuming', async () => {
    prismaMock.monitorCheck.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.monitorPausePeriod.updateMany.mockResolvedValue({ count: 1 });

    await updateMonitorCheck(
      DASHBOARD_ID,
      { id: MONITOR_ID, isEnabled: true },
      { unrecordedPausedAt: UNRECORDED_PAUSED_AT },
    );

    expect(prismaMock.monitorCheck.updateMany).toHaveBeenCalledWith({
      where: { id: MONITOR_ID, dashboardId: DASHBOARD_ID, isEnabled: false },
      data: { isEnabled: true },
    });
    expect(prismaMock.monitorPausePeriod.updateMany).toHaveBeenCalledWith({
      where: { monitorCheckId: MONITOR_ID, resumedAt: null },
      data: { resumedAt: expect.any(Date) },
    });
    expect(prismaMock.monitorPausePeriod.create).not.toHaveBeenCalled();
  });

  it('records a closed period from the last check when resuming a monitor paused before pauses were recorded', async () => {
    prismaMock.monitorCheck.updateMany.mockResolvedValue({ count: 1 });

    await updateMonitorCheck(
      DASHBOARD_ID,
      { id: MONITOR_ID, isEnabled: true },
      { unrecordedPausedAt: UNRECORDED_PAUSED_AT },
    );

    expect(prismaMock.monitorPausePeriod.create).toHaveBeenCalledWith({
      data: { monitorCheckId: MONITOR_ID, pausedAt: UNRECORDED_PAUSED_AT, resumedAt: expect.any(Date) },
    });
  });

  it.each([
    { name: 'pausing an already paused monitor', isEnabled: false },
    { name: 'resuming an already running monitor', isEnabled: true },
  ])('records nothing when $name', async ({ isEnabled }) => {
    prismaMock.monitorCheck.updateMany.mockResolvedValue({ count: 0 });

    await updateMonitorCheck(
      DASHBOARD_ID,
      { id: MONITOR_ID, isEnabled },
      { unrecordedPausedAt: UNRECORDED_PAUSED_AT },
    );

    expect(prismaMock.monitorPausePeriod.create).not.toHaveBeenCalled();
    expect(prismaMock.monitorPausePeriod.updateMany).not.toHaveBeenCalled();
  });

  it('leaves pause state alone for an edit that does not touch isEnabled', async () => {
    await updateMonitorCheck(DASHBOARD_ID, { id: MONITOR_ID, name: 'Renamed' });

    expect(prismaMock.monitorCheck.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.monitorPausePeriod.create).not.toHaveBeenCalled();
    expect(prismaMock.monitorPausePeriod.updateMany).not.toHaveBeenCalled();
    expect(prismaMock.monitorCheck.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ name: 'Renamed' }) }),
    );
  });
});
