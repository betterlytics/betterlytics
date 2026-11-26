import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteAllPersonalMcpTokens,
  deletePersonalMcpToken,
  findDashboardMcpTokens,
  findMcpTokenByHash,
  removeDashboardFromMcpToken,
  replaceMcpTokenDashboards,
} from '@/repositories/postgres/mcpToken.repository';

const prismaMock = vi.hoisted(() => {
  const mock = {
    mcpToken: { findFirst: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
    mcpTokenDashboard: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (fn: (tx: typeof mock) => unknown) => fn(mock));
  return mock;
});

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteAllPersonalMcpTokens', () => {
  it("soft-deletes every live token of the user's, and nobody else's", async () => {
    prismaMock.mcpToken.updateMany.mockResolvedValue({ count: 2 });

    expect(await deleteAllPersonalMcpTokens('user-1')).toBe(2);
    expect(prismaMock.mcpToken.updateMany).toHaveBeenCalledWith({
      where: { createdBy: 'user-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});

describe('findMcpTokenByHash', () => {
  it('only resolves live tokens whose creator is neither disabled nor deleted', async () => {
    prismaMock.mcpToken.findFirst.mockResolvedValue(null);

    expect(await findMcpTokenByHash('hash-1')).toBeNull();
    expect(prismaMock.mcpToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: 'hash-1',
        deletedAt: null,
        user: { deletedAt: null, disabledAt: null },
      },
      select: { id: true, createdBy: true, expiresAt: true, dashboards: { select: { dashboardId: true } } },
    });
  });

  it('returns the picked dashboard ids', async () => {
    prismaMock.mcpToken.findFirst.mockResolvedValue({
      id: 'token-1',
      createdBy: 'user-1',
      expiresAt: null,
      dashboards: [{ dashboardId: 'dash-1' }, { dashboardId: 'dash-2' }],
    });

    expect(await findMcpTokenByHash('hash-1')).toEqual({
      id: 'token-1',
      createdBy: 'user-1',
      expiresAt: null,
      dashboardIds: ['dash-1', 'dash-2'],
    });
  });
});

describe('findDashboardMcpTokens', () => {
  it('lists only tokens covering the dashboard whose creator is enabled and still a member of it', async () => {
    prismaMock.mcpToken.findMany.mockResolvedValue([]);

    await findDashboardMcpTokens('dash-1');

    expect(prismaMock.mcpToken.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          deletedAt: null,
          dashboards: { some: { dashboardId: 'dash-1' } },
          user: {
            deletedAt: null,
            disabledAt: null,
            dashboardAccess: { some: { dashboardId: 'dash-1', deletedAt: null } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });
});

describe('replaceMcpTokenDashboards', () => {
  it("replaces the picks of the user's own token", async () => {
    prismaMock.mcpToken.findFirst.mockResolvedValue({ id: 'token-1' });

    expect(await replaceMcpTokenDashboards('token-1', 'user-1', ['dash-2', 'dash-2', 'dash-3'])).toBe(true);
    expect(prismaMock.mcpToken.findFirst).toHaveBeenCalledWith({
      where: { id: 'token-1', createdBy: 'user-1', deletedAt: null },
      select: { id: true },
    });
    expect(prismaMock.mcpTokenDashboard.deleteMany).toHaveBeenCalledWith({ where: { tokenId: 'token-1' } });
    expect(prismaMock.mcpTokenDashboard.createMany).toHaveBeenCalledWith({
      data: [
        { tokenId: 'token-1', dashboardId: 'dash-2' },
        { tokenId: 'token-1', dashboardId: 'dash-3' },
      ],
    });
  });

  it("leaves another user's token alone", async () => {
    prismaMock.mcpToken.findFirst.mockResolvedValue(null);

    expect(await replaceMcpTokenDashboards('token-1', 'user-2', ['dash-2'])).toBe(false);
    expect(prismaMock.mcpTokenDashboard.deleteMany).not.toHaveBeenCalled();
  });

  it('refuses an empty pick', async () => {
    await expect(replaceMcpTokenDashboards('token-1', 'user-1', [])).rejects.toThrow();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe('deletePersonalMcpToken', () => {
  it("only deletes the user's own live token", async () => {
    prismaMock.mcpToken.updateMany.mockResolvedValue({ count: 0 });

    expect(await deletePersonalMcpToken('token-1', 'user-2')).toBe(0);
    expect(prismaMock.mcpToken.updateMany).toHaveBeenCalledWith({
      where: { id: 'token-1', createdBy: 'user-2', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});

describe('removeDashboardFromMcpToken', () => {
  it('removes only that dashboard from the token', async () => {
    prismaMock.mcpTokenDashboard.deleteMany.mockResolvedValue({ count: 1 });

    expect(await removeDashboardFromMcpToken('token-1', 'dash-1')).toBe(1);
    expect(prismaMock.mcpTokenDashboard.deleteMany).toHaveBeenCalledWith({
      where: { tokenId: 'token-1', dashboardId: 'dash-1', token: { deletedAt: null } },
    });
  });
});
