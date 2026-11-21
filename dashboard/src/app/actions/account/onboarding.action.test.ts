import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPlan, selfHostedPlan } from '@/lib/billing/catalog';
import { UserException } from '@/lib/exceptions';
import { ONBOARDING_ALREADY_COMPLETE } from '@/constants/onboarding';

type Db = { onboardingCompletedAt: Date | null; ownedDashboards: number; createdDomains: string[] };

const { db, prismaMock } = vi.hoisted(() => {
  const db: Db = { onboardingCompletedAt: null, ownedDashboards: 0, createdDomains: [] };

  // The user row lock is taken by the claiming update and held until the transaction ends, like Postgres
  let userRowLock: Promise<void> = Promise.resolve();

  const createDashboardRow = async ({ data }: { data: { domain: string; siteId: string } }) => {
    db.ownedDashboards += 1;
    db.createdDomains.push(data.domain);
    return { id: `dash-${db.createdDomains.length}`, siteId: data.siteId, domain: data.domain };
  };

  const prismaMock = {
    userDashboard: {
      findMany: vi.fn(async () =>
        Array.from({ length: db.ownedDashboards }, (_, i) => ({
          dashboard: { id: `d${i}`, siteId: 's', domain: 'a.com' },
        })),
      ),
    },
    dashboard: { create: vi.fn(createDashboardRow) },
    $transaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
      const snapshot = { ...db, createdDomains: [...db.createdDomains] };
      let releaseRow: (() => void) | undefined;
      const tx = {
        user: {
          updateMany: async ({ data }: { data: { onboardingCompletedAt: Date } }) => {
            const held = userRowLock;
            userRowLock = new Promise((resolve) => (releaseRow = resolve));
            await held;
            if (db.onboardingCompletedAt !== null) return { count: 0 };
            db.onboardingCompletedAt = data.onboardingCompletedAt;
            return { count: 1 };
          },
        },
        userDashboard: { count: async () => db.ownedDashboards },
        dashboard: { create: createDashboardRow },
      };
      try {
        return await fn(tx);
      } catch (error) {
        Object.assign(db, snapshot);
        throw error;
      } finally {
        releaseRow?.();
      }
    }),
  };
  return { db, prismaMock };
});

vi.mock('@/lib/postgres', () => ({ default: prismaMock }));

vi.mock('@/lib/env', () => ({ env: { IS_CLOUD: true } }));

vi.mock('@/auth/api-auth', () => ({
  getCachedSession: vi.fn(async () => ({
    user: { id: 'user-1', termsAcceptedAt: new Date('2024-01-01') },
    session: { token: 'session-token', expiresAt: new Date('2030-01-01') },
  })),
  getCachedAuthorizedContext: vi.fn(),
  resolveDashboardAuthResult: vi.fn(),
  executeWithDemoCache: vi.fn(),
  getFnSignature: vi.fn(() => 'onboarding.action'),
}));

vi.mock('next/navigation', () => ({ redirect: vi.fn(), unstable_rethrow: vi.fn() }));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, values?: { plan?: string }) => `${key}:${values?.plan ?? ''}`),
}));

vi.mock('@/lib/billing/capabilityAccess', async () => {
  const { UserException } = await import('@/lib/exceptions');
  return {
    getUserCapabilities: vi.fn(),
    requireCapability: (allowed: boolean, message: string) => {
      if (!allowed) throw new UserException(message);
    },
  };
});

vi.mock('@/services/auth/user.service', () => ({
  acceptUserTerms: vi.fn(),
  ensureTermsAccepted: vi.fn(),
  setOnboardingCompleted: vi.fn(),
}));

vi.mock('@/services/account/userSettings.service', () => ({ updateUserSettings: vi.fn(async () => undefined) }));

vi.mock('@/lib/statusPageRevalidation', () => ({ revalidateReleasedStatusPages: vi.fn() }));

import { getUserCapabilities } from '@/lib/billing/capabilityAccess';
import { updateUserSettings } from '@/services/account/userSettings.service';
import { completeOnboardingAndCreateDashboardAction } from '@/app/actions/account/onboarding.action';
import { createDashboardAction } from '@/app/actions/dashboard/dashboard.action';

const capabilities = vi.mocked(getUserCapabilities);

function onboard(domain = 'example.com') {
  return completeOnboardingAndCreateDashboardAction({ domain, language: 'da' });
}

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(db, { onboardingCompletedAt: null, ownedDashboards: 0, createdDomains: [] });
  capabilities.mockResolvedValue(getPlan('free').capabilities);
});

describe('completeOnboardingAndCreateDashboardAction', () => {
  it('creates the first dashboard, completes onboarding and sets the language', async () => {
    const result = await onboard();

    expect(result).toEqual({ success: true, data: expect.objectContaining({ domain: 'example.com' }) });
    expect(db.createdDomains).toEqual(['example.com']);
    expect(db.onboardingCompletedAt).toBeInstanceOf(Date);
    expect(updateUserSettings).toHaveBeenCalledWith('user-1', { language: 'da' });
  });

  it('refuses a Free user who already owns a dashboard with the Create dashboard upgrade message', async () => {
    db.ownedDashboards = 1;

    const onboarding = await onboard();
    const createButton = await createDashboardAction('other.com');

    expect(onboarding.success).toBe(false);
    expect(createButton.success).toBe(false);
    if (onboarding.success || createButton.success) return;
    expect(onboarding.error.message).toMatch(/^capabilities\.dashboardLimit:/);
    expect(onboarding.error.message).toBe(createButton.error.message);
    expect(db.createdDomains).toEqual([]);
    expect(db.onboardingCompletedAt).toBeNull();
  });

  it('lets the user retry after a refused attempt', async () => {
    db.ownedDashboards = 1;
    await onboard();

    capabilities.mockResolvedValue(getPlan('plus').capabilities);
    const retry = await onboard();

    expect(retry.success).toBe(true);
    expect(db.onboardingCompletedAt).toBeInstanceOf(Date);
  });

  it('creates nothing once onboarding is complete, even for a Free user at the limit', async () => {
    db.onboardingCompletedAt = new Date('2024-01-02');
    db.ownedDashboards = 1;

    const result = await onboard();

    expect(result).toEqual({
      success: false,
      error: expect.objectContaining({ code: ONBOARDING_ALREADY_COMPLETE, name: UserException.name }),
    });
    expect(db.createdDomains).toEqual([]);
    expect(updateUserSettings).not.toHaveBeenCalled();
  });

  it('creates one dashboard when two tabs submit at once', async () => {
    const results = await Promise.all([onboard('first.com'), onboard('second.com')]);

    expect(db.createdDomains).toHaveLength(1);
    expect(results.filter((r) => r.success)).toHaveLength(1);
    expect(results.filter((r) => !r.success && r.error.code === ONBOARDING_ALREADY_COMPLETE)).toHaveLength(1);
  });

  it('has no dashboard limit on self-hosted', async () => {
    capabilities.mockResolvedValue(selfHostedPlan().capabilities);
    db.ownedDashboards = 30;

    const result = await onboard();

    expect(result.success).toBe(true);
  });
});
