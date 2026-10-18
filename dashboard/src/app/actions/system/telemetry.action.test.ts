import { describe, it, expect, vi, beforeEach } from 'vitest';

const { getCachedSession, isFeatureEnabled, getTelemetryStatus } = vi.hoisted(() => ({
  getCachedSession: vi.fn(),
  isFeatureEnabled: vi.fn(),
  getTelemetryStatus: vi.fn(),
}));

vi.mock('@/auth/api-auth', () => ({ getCachedSession, getFnSignature: () => 'sig' }));
vi.mock('@/lib/feature-flags', () => ({ isFeatureEnabled }));
vi.mock('@/services/system/telemetry.service', () => ({ getTelemetryStatus }));

import { getTelemetryStatusAction } from './telemetry.action';

function sessionWithRole(role: string | null) {
  return {
    user: { id: 'user-1', email: 'admin@example.com', role },
    session: { token: 'token', expiresAt: new Date(Date.now() + 60_000) },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  isFeatureEnabled.mockReturnValue(false);
  getTelemetryStatus.mockResolvedValue({ policy: { enabled: true } });
});

describe('getTelemetryStatusAction', () => {
  it.each([null, 'user'])('denies a user whose role is %s', async (role) => {
    getCachedSession.mockResolvedValue(sessionWithRole(role));

    const result = await getTelemetryStatusAction();

    expect(result.success).toBe(false);
    expect(!result.success && result.error.name).toBe('UserException');
    expect(getTelemetryStatus).not.toHaveBeenCalled();
  });

  it('denies the admin on cloud', async () => {
    getCachedSession.mockResolvedValue(sessionWithRole('admin'));
    isFeatureEnabled.mockImplementation((flag: string) => flag === 'isCloud');

    const result = await getTelemetryStatusAction();

    expect(result.success).toBe(false);
    expect(!result.success && result.error.name).toBe('UserException');
    expect(getTelemetryStatus).not.toHaveBeenCalled();
  });

  it('returns the status to the instance admin on self-host', async () => {
    getCachedSession.mockResolvedValue(sessionWithRole('admin'));

    const result = await getTelemetryStatusAction();

    expect(result).toEqual({ success: true, data: { policy: { enabled: true } } });
  });
});
