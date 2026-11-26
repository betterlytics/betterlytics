import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AuthContext } from '@/entities/auth/authContext.entities';

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock('@/lib/env', () => ({
  env: { DEMO_DASHBOARD_ID: 'demo-dash' },
  replayStorage: 'clickhouse',
  s3Env: { enabled: false, bucket: undefined },
}));
vi.mock('@/repositories/postgres/heatmapCaptures.repository', () => ({
  createHeatmapCaptureLink: vi.fn(),
  deleteHeatmapCaptureRow: vi.fn(),
  findHeatmapCaptureLocation: vi.fn(),
  findHeatmapCaptures: vi.fn(),
}));
vi.mock('@/repositories/heatmapCaptureSnapshots.repository', () => ({ captureSnapshotStoreFor: vi.fn() }));
vi.mock('@/repositories/postgres/dashboard.repository', () => ({ findUserDashboardWithDashboardOrNull: vi.fn() }));

import { createHeatmapCaptureLink } from '@/repositories/postgres/heatmapCaptures.repository';
import { createCaptureLink, HeatmapCapturesForbiddenError } from '@/services/analytics/heatmapCaptures.service';

const createLinkRow = vi.mocked(createHeatmapCaptureLink);

const ctx: AuthContext = {
  dashboardId: 'dash-1',
  siteId: 'site-1',
  userId: 'user-1',
  role: 'editor',
  isDemo: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  createLinkRow.mockResolvedValue({ expiresAt: new Date('2030-01-01T00:15:00Z') });
});

describe('createCaptureLink', () => {
  it.each(['/pricing', '/profile/*/posts'])('stores a link for %s, storing only the token hash', async (path) => {
    const { token } = await createCaptureLink(ctx, { path, device: 'desktop' });

    expect(token).toMatch(/^bhc_site-1\.[\w-]{43}$/);
    expect(createLinkRow).toHaveBeenCalledWith('dash-1', 'user-1', { path, device: 'desktop' }, expect.any(String));
    expect(createLinkRow.mock.calls[0][3]).not.toBe(token);
  });

  it.each([
    ['a public demo view', { userId: 'demo', role: 'viewer', isDemo: true }],
    ['an editor who is a member of the demo dashboard', {}],
  ] as const)('refuses %s', async (_, overrides) => {
    const demoCtx: AuthContext = { ...ctx, dashboardId: 'demo-dash', ...overrides };

    await expect(createCaptureLink(demoCtx, { path: '/pricing', device: 'desktop' })).rejects.toThrow(
      HeatmapCapturesForbiddenError,
    );
    expect(createLinkRow).not.toHaveBeenCalled();
  });
});
