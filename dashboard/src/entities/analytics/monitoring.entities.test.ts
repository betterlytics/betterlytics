import { describe, it, expect } from 'vitest';
import {
  MONITOR_LIMITS,
  MonitorCheckCreateSchema,
  MonitorCheckSchema,
  MonitorCheckUpdateSchema,
} from '@/entities/analytics/monitoring.entities';

const MONITOR_URL = 'https://example.com';

describe('accepted status codes on monitor writes', () => {
  it('rejects an explicitly empty list on create', () => {
    const result = MonitorCheckCreateSchema.safeParse({ url: MONITOR_URL, acceptedStatusCodes: [] });
    expect(result.success).toBe(false);
  });

  it('rejects an explicitly empty list on update', () => {
    const result = MonitorCheckUpdateSchema.safeParse({ id: 'm1', acceptedStatusCodes: [] });
    expect(result.success).toBe(false);
  });

  it('accepts individual codes and ranges within the limit', () => {
    const codes = ['2xx', '3xx', 200, 404, 503];
    expect(codes).toHaveLength(MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX);

    const created = MonitorCheckCreateSchema.safeParse({ url: MONITOR_URL, acceptedStatusCodes: codes });
    const updated = MonitorCheckUpdateSchema.safeParse({ id: 'm1', acceptedStatusCodes: codes });

    expect(created.success && created.data.acceptedStatusCodes).toEqual(codes);
    expect(updated.success && updated.data.acceptedStatusCodes).toEqual(codes);
  });

  it('still rejects more codes than the limit', () => {
    const codes = ['2xx', '3xx', 200, 404, 503, 500];
    expect(MonitorCheckCreateSchema.safeParse({ url: MONITOR_URL, acceptedStatusCodes: codes }).success).toBe(
      false,
    );
    expect(MonitorCheckUpdateSchema.safeParse({ id: 'm1', acceptedStatusCodes: codes }).success).toBe(false);
  });

  it('defaults to 2xx when create omits the list', () => {
    const result = MonitorCheckCreateSchema.parse({ url: MONITOR_URL });
    expect(result.acceptedStatusCodes).toEqual(['2xx']);
  });

  it('leaves the list out of a partial update that omits it', () => {
    const result = MonitorCheckUpdateSchema.parse({ id: 'm1', name: 'Renamed' });
    expect(result).not.toHaveProperty('acceptedStatusCodes');
  });
});

describe('stored monitors', () => {
  it('parses a legacy row with an empty list', () => {
    const result = MonitorCheckSchema.safeParse({
      id: 'm1',
      dashboardId: 'd1',
      url: MONITOR_URL,
      createdAt: new Date(),
      updatedAt: new Date(),
      acceptedStatusCodes: [],
    });
    expect(result.success && result.data.acceptedStatusCodes).toEqual([]);
  });
});
