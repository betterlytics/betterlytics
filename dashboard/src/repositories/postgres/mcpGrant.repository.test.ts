import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteAllMcpConnections,
  deleteMcpConnection,
  findMcpConnections,
} from '@/repositories/postgres/mcpGrant.repository';

const tx = vi.hoisted(() => ({
  oauthAccessToken: { deleteMany: vi.fn() },
  oauthRefreshToken: { deleteMany: vi.fn() },
  oauthConsent: { deleteMany: vi.fn() },
}));
const prismaMock = vi.hoisted(() => ({
  oauthConsent: { findMany: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

beforeEach(() => {
  vi.clearAllMocks();
  prismaMock.$transaction.mockImplementation((run) => run(tx));
  tx.oauthConsent.deleteMany.mockResolvedValue({ count: 1 });
});

describe('deleteMcpConnection', () => {
  it("deletes only the user's consents and tokens for that client", async () => {
    expect(await deleteMcpConnection('user-1', 'client-1')).toBe(1);

    const where = { userId: 'user-1', clientId: 'client-1' };
    expect(tx.oauthAccessToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthRefreshToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthConsent.deleteMany).toHaveBeenCalledWith({ where });
  });
});

describe('deleteAllMcpConnections', () => {
  it("deletes every consent and token of the user's, and nobody else's", async () => {
    await deleteAllMcpConnections('user-1');

    const where = { userId: 'user-1' };
    expect(tx.oauthAccessToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthRefreshToken.deleteMany).toHaveBeenCalledWith({ where });
    expect(tx.oauthConsent.deleteMany).toHaveBeenCalledWith({ where });
  });
});

describe('findMcpConnections', () => {
  const consent = (id: string, clientId: string, updatedAt: string) => ({
    id,
    scopes: ['dashboards:read'],
    createdAt: new Date('2026-11-01T10:00:00Z'),
    updatedAt: new Date(updatedAt),
    client: { clientId, name: clientId, redirectUris: ['https://agent.example/cb'], clientDiscoveryId: null },
    grant: { allDashboards: true, lastUsedAt: null, dashboards: [] },
  });

  it("keeps the user's latest consent per enabled client, newest first", async () => {
    prismaMock.oauthConsent.findMany.mockResolvedValue([
      consent('consent-a2', 'client-a', '2026-11-20T10:00:00Z'),
      consent('consent-b', 'client-b', '2026-11-10T10:00:00Z'),
      consent('consent-a1', 'client-a', '2026-11-05T10:00:00Z'),
    ]);

    const connections = await findMcpConnections('user-1');

    expect(connections.map((connection) => connection.consentId)).toEqual(['consent-a2', 'consent-b']);
    expect(prismaMock.oauthConsent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1', client: { OR: [{ disabled: false }, { disabled: null }] } },
        orderBy: { updatedAt: 'desc' },
      }),
    );
  });
});
