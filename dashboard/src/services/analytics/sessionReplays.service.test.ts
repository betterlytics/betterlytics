import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSessionReplayForSite } from '@/services/analytics/sessionReplays.service';
import { getSessionReplayById } from '@/repositories/clickhouse/sessionReplays.repository';
import { DEMO_SESSION_REPLAYS } from '@/constants/demoSessionReplays';
import type { AuthContext } from '@/entities/auth/authContext.entities';

vi.mock('@/repositories/clickhouse/index.repository', () => ({}));
vi.mock('@/repositories/clickhouse/sessionReplays.repository', () => ({
  getReplaySessionMeta: vi.fn(),
  getSessionReplayById: vi.fn(async () => null),
}));
vi.mock('@/repositories/replaySegments.repository', () => ({}));
vi.mock('@/lib/env', () => ({ replayStorage: 'clickhouse' }));

const authContext: AuthContext = {
  dashboardId: 'dashboard-1',
  userId: 'user-1',
  siteId: 'site-1',
  role: 'viewer',
  isDemo: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSessionReplayForSite', () => {
  it('looks the session up within the dashboard site', async () => {
    await getSessionReplayForSite(authContext, '16968594901253342157');

    expect(getSessionReplayById).toHaveBeenCalledWith('site-1', '16968594901253342157');
  });

  it.each(['', 'abc', '12a', '-1', '1.5', ' 1', '18446744073709551616', '1'.repeat(21)])(
    'treats the malformed id %j as not found without querying',
    async (sessionId) => {
      await expect(getSessionReplayForSite(authContext, sessionId)).resolves.toBeNull();
      expect(getSessionReplayById).not.toHaveBeenCalled();
    },
  );

  it('serves the demo dashboard from its fixtures', async () => {
    const demo = { ...authContext, isDemo: true };
    const fixtureId = DEMO_SESSION_REPLAYS[0].session_id;

    await expect(getSessionReplayForSite(demo, fixtureId)).resolves.toMatchObject({
      session_id: fixtureId,
      site_id: 'site-1',
    });
    await expect(getSessionReplayForSite(demo, '1')).resolves.toBeNull();
    expect(getSessionReplayById).not.toHaveBeenCalled();
  });
});
