import { describe, it, expect } from 'vitest';
import { computeNextEventLogCursor, type EventLogEntry } from '@/entities/analytics/events.entities';

function event(timestamp: Date): EventLogEntry {
  return {
    timestamp,
    event_name: 'click',
    visitor_id: '1',
    url: '/page',
    custom_event_json: '{}',
    country_code: 'DK',
    device_type: 'desktop',
    browser: 'Firefox',
  };
}

const ts = (second: number) => new Date(Date.UTC(2026, 0, 1, 12, 0, second));

describe('computeNextEventLogCursor', () => {
  it('returns null for a short page (fewer rows than the limit)', () => {
    const events = [event(ts(3)), event(ts(2)), event(ts(1))];
    expect(computeNextEventLogCursor(events, null, 4)).toBeNull();
  });

  it('counts only the rows sharing the last timestamp on a full page', () => {
    const events = [event(ts(5)), event(ts(4)), event(ts(2)), event(ts(2))];
    expect(computeNextEventLogCursor(events, null, 4)).toEqual({ timestamp: ts(2), skip: 2 });
  });

  it('accumulates the cursor skip when the whole page shares the cursor timestamp', () => {
    const events = [event(ts(7)), event(ts(7)), event(ts(7)), event(ts(7))];
    const cursor = { timestamp: ts(7), skip: 4 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toEqual({ timestamp: ts(7), skip: 8 });
  });

  it('does not accumulate the cursor skip when the last timestamp differs from the cursor', () => {
    const events = [event(ts(7)), event(ts(6)), event(ts(5)), event(ts(5))];
    const cursor = { timestamp: ts(7), skip: 1 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toEqual({ timestamp: ts(5), skip: 2 });
  });
});
