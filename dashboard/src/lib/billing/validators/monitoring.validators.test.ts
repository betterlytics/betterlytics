import { describe, expect, it, vi } from 'vitest';
import { getPlan } from '@/lib/billing/catalog';
import { monitoringValidator } from './monitoring.validators';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string, values?: { plan?: string }) => `${key}:${values?.plan ?? ''}`),
}));

vi.mock('@/lib/billing/capabilityAccess', () => ({
  requireCapability: (allowed: boolean, message: string) => {
    if (!allowed) throw new Error(message);
  },
}));

describe('monitoring upgrade messages', () => {
  it('names the cheapest plan with faster checks', async () => {
    const validator = await monitoringValidator(getPlan('free').capabilities.monitoring);
    await expect(validator.minInterval(60).validate()).rejects.toThrow('capabilities.minInterval:Plus');
  });

  it('names the next plan up when the monitor limit is reached', async () => {
    const validator = await monitoringValidator(getPlan('plus').capabilities.monitoring);
    await expect(validator.monitorLimit(5).validate()).rejects.toThrow('capabilities.monitorLimit:Business');
  });

  it('passes within the plan', async () => {
    const validator = await monitoringValidator(getPlan('business').capabilities.monitoring);
    await expect(validator.minInterval(60).monitorLimit(10).validate()).resolves.toBeUndefined();
  });
});
