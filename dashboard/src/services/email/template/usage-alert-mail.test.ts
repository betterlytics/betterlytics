import { describe, expect, it } from 'vitest';
import { createUsageAlertEmailTemplate, type UsageAlertEmailData } from '@/services/email/template/usage-alert-mail';

const base: UsageAlertEmailData = {
  to: 'user@example.com',
  userName: 'Jane',
  currentUsage: 10_500,
  usageLimit: 10_000,
  usagePercentage: 105,
  planName: 'Growth',
  currentPeriodStart: new Date('2026-04-01T00:00:00.000Z'),
  currentPeriodEnd: new Date('2026-05-01T00:00:00.000Z'),
  upgradeUrl: 'https://betterlytics.io/billing',
};

describe('usage alert email', () => {
  it('keeps the event copy when no quota is given', async () => {
    const exceeded = await createUsageAlertEmailTemplate(base);
    expect(exceeded.subject).toBe('Usage alert: Growth plan event limit exceeded');
    expect(exceeded.text).toContain('10,500 events');
    expect(exceeded.text).toContain('may not be retained');

    const approaching = await createUsageAlertEmailTemplate({ ...base, currentUsage: 8_500, usagePercentage: 85 });
    expect(approaching.subject).toBe('Usage alert: 85% of your Growth plan event limit used');
  });

  it('names the session replay quota and says recording continues at 100%', async () => {
    const exceeded = await createUsageAlertEmailTemplate({
      ...base,
      quota: 'replays',
      currentUsage: 520,
      usageLimit: 500,
      usagePercentage: 104,
    });
    expect(exceeded.subject).toBe('Usage alert: Growth plan session replay limit reached');
    expect(exceeded.text).toContain('520 recorded sessions');
    expect(exceeded.text).toContain('Session recording continues as normal');
    expect(exceeded.text).toContain('Review plan options');
    expect(exceeded.text).not.toContain('may not be retained');
    expect(exceeded.text).not.toContain('events');

    const approaching = await createUsageAlertEmailTemplate({
      ...base,
      quota: 'replays',
      currentUsage: 400,
      usageLimit: 500,
      usagePercentage: 80,
    });
    expect(approaching.subject).toBe('Usage alert: 80% of your Growth plan session replay limit used');
  });
});
