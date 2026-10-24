import { describe, it, expect } from 'vitest';
import { resolveTimeRange } from '@/mcp/utils/resolveTimeRange';

describe('resolveTimeRange', () => {
  it('resolves a preset time range to start/end DateTimeStrings', () => {
    const result = resolveTimeRange({ timeRange: '7d', timezone: 'UTC' });
    expect(result).toHaveProperty('startDateTime');
    expect(result).toHaveProperty('endDateTime');
    expect(typeof result.startDateTime).toBe('string');
    expect(typeof result.endDateTime).toBe('string');
    expect(result.startDateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(result.endDateTime).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('resolves a custom date range', () => {
    const result = resolveTimeRange({
      timeRange: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      timezone: 'UTC',
    });
    expect(result.startDateTime).toContain('2026-01-01');
    expect(result.endDateTime).toContain('2026-01-31');
  });

  it('defaults timezone to UTC', () => {
    const result = resolveTimeRange({ timeRange: '7d' });
    expect(result).toHaveProperty('startDateTime');
    expect(result).toHaveProperty('endDateTime');
  });

  it.each([
    ['America/Los_Angeles', '2026-09-20 07:00:00', '2026-09-23 06:59:59'],
    ['Asia/Tokyo', '2026-09-19 15:00:00', '2026-09-22 14:59:59'],
    ['UTC', '2026-09-20 00:00:00', '2026-09-22 23:59:59'],
  ])('resolves custom dates as whole days in %s', (timezone, startDateTime, endDateTime) => {
    const result = resolveTimeRange({
      timeRange: 'custom',
      startDate: '2026-09-20',
      endDate: '2026-09-22',
      timezone,
    });
    expect(result.startDateTime).toBe(startDateTime);
    expect(result.endDateTime).toBe(endDateTime);
  });

  it('reads custom dates as UTC days when timezone is omitted', () => {
    const result = resolveTimeRange({ timeRange: 'custom', startDate: '2026-09-20', endDate: '2026-09-22' });
    expect(result.startDateTime).toBe('2026-09-20 00:00:00');
    expect(result.endDateTime).toBe('2026-09-22 23:59:59');
  });
});
