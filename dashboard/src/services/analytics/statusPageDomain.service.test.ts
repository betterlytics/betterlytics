import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTlsAuthorization } from './statusPageDomain.service';

const findStatusPageByCustomDomain = vi.fn();
const canUseStatusPageCustomDomain = vi.fn();

vi.mock('@/repositories/postgres/statusPage.repository', () => ({
  findStatusPageByCustomDomain: (domain: string) => findStatusPageByCustomDomain(domain),
}));

vi.mock('@/lib/billing/capabilityAccess', () => ({
  canUseStatusPageCustomDomain: (dashboardId: string) => canUseStatusPageCustomDomain(dashboardId),
}));

vi.mock('@/lib/feature-flags', () => ({
  isFeatureEnabled: () => true,
}));

vi.mock('@/lib/env', () => ({
  env: { STATUS_PAGE_DOMAIN: 'status.example.com' },
}));

vi.mock('@/lib/env/shared.env', () => ({
  sharedEmailEnv: { publicBaseUrl: 'https://app.example.com', isCloud: true },
}));

const PAGE = { id: 'sp1', dashboardId: 'd1', slug: 'acme', isPublished: true, isDashboardDeleted: false };

describe('getTlsAuthorization', () => {
  beforeEach(() => {
    findStatusPageByCustomDomain.mockReset();
    canUseStatusPageCustomDomain.mockReset().mockResolvedValue(true);
  });

  it('authorizes a published page of a live dashboard', async () => {
    findStatusPageByCustomDomain.mockResolvedValueOnce(PAGE);
    expect(await getTlsAuthorization('status.acme.com')).toBe('authorized');
  });

  it('refuses a deleted dashboard the same way as an unpublished page', async () => {
    findStatusPageByCustomDomain.mockResolvedValueOnce({ ...PAGE, isDashboardDeleted: true });
    expect(await getTlsAuthorization('status.acme.com')).toBe('unauthorized');

    findStatusPageByCustomDomain.mockResolvedValueOnce({ ...PAGE, isPublished: false });
    expect(await getTlsAuthorization('status.acme.com')).toBe('unauthorized');

    expect(canUseStatusPageCustomDomain).not.toHaveBeenCalled();
  });
});
