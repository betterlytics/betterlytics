import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findMcpTokenByHash } from '@/repositories/postgres/mcpToken.repository';

const prismaMock = vi.hoisted(() => ({
  mcpToken: { findFirst: vi.fn() },
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findMcpTokenByHash', () => {
  it('only resolves live tokens on live dashboards whose creator is neither disabled nor deleted', async () => {
    prismaMock.mcpToken.findFirst.mockResolvedValue(null);

    expect(await findMcpTokenByHash('hash-1')).toBeNull();
    expect(prismaMock.mcpToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: 'hash-1',
        deletedAt: null,
        dashboard: { deletedAt: null },
        user: { deletedAt: null, disabledAt: null },
      },
      include: { dashboard: true },
    });
  });
});
