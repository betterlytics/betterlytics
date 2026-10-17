import { describe, expect, it } from 'vitest';
import { DashboardSettingsUpdateSchema, DataRetentionDaysSchema } from './dashboardSettings.entities';

describe('DataRetentionDaysSchema', () => {
  it.each([-1, 180, 365, 1825])('accepts %d', (input) => {
    expect(DataRetentionDaysSchema.safeParse(input).success).toBe(true);
  });

  it.each([0, -2, 179, 364.5])('rejects %d', (input) => {
    expect(DataRetentionDaysSchema.safeParse(input).success).toBe(false);
  });
});

describe('DashboardSettingsUpdateSchema', () => {
  it('strips the internal retention grace fields', () => {
    const parsed = DashboardSettingsUpdateSchema.parse({
      dataRetentionDays: 365,
      retentionGraceUntil: new Date(),
      retentionGraceRestoreDays: 1825,
    });
    expect(parsed).toEqual({ dataRetentionDays: 365 });
  });
});
