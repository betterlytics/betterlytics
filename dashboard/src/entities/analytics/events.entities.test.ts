import { describe, it, expect } from 'vitest';
import {
  computeNextEventLogCursor,
  flattenEventLogPages,
  subtractHeldBoundaryEvents,
  MAX_EVENT_LOG_CURSOR_SKIP,
  type EventLogEntry,
} from '@/entities/analytics/events.entities';

function event(timestamp: Date, event_name = 'click'): EventLogEntry {
  return {
    timestamp,
    event_name,
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
    const events = Array.from({ length: 8 }, () => event(ts(7)));
    const cursor = { timestamp: ts(7), skip: 4 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toEqual({ timestamp: ts(7), skip: 12 });
  });

  it('does not accumulate the cursor skip when the last timestamp differs from the cursor', () => {
    const events = [event(ts(7)), event(ts(6)), event(ts(6)), event(ts(5)), event(ts(5))];
    const cursor = { timestamp: ts(7), skip: 1 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toEqual({ timestamp: ts(5), skip: 2 });
  });

  it('returns null when the raw page is shorter than the limit plus the cursor skip', () => {
    const events = [event(ts(7)), event(ts(7)), event(ts(7)), event(ts(7)), event(ts(7))];
    const cursor = { timestamp: ts(7), skip: 4 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toBeNull();
  });

  it('ends the log when the accumulated skip exceeds the cap', () => {
    const events = Array.from({ length: MAX_EVENT_LOG_CURSOR_SKIP + 1 }, () => event(ts(7)));
    const cursor = { timestamp: ts(7), skip: MAX_EVENT_LOG_CURSOR_SKIP - 3 };
    expect(computeNextEventLogCursor(events, cursor, 4)).toBeNull();
  });
});

describe('flattenEventLogPages', () => {
  it('passes a single page through untouched', () => {
    const events = [event(ts(7)), event(ts(6))];
    expect(flattenEventLogPages([{ events, nextCursor: null }])).toEqual(events);
  });

  it('subtracts redelivered boundary rows from the next page by content count', () => {
    const pages = [
      { events: [event(ts(6)), event(ts(5))], nextCursor: { timestamp: ts(5), skip: 1 } },
      { events: [event(ts(5)), event(ts(4))], nextCursor: null },
    ];
    expect(flattenEventLogPages(pages)).toEqual([event(ts(6)), event(ts(5)), event(ts(4))]);
  });

  it('keeps boundary-second rows whose content is not held', () => {
    const pages = [
      { events: [event(ts(6)), event(ts(5), 'click')], nextCursor: { timestamp: ts(5), skip: 1 } },
      { events: [event(ts(5), 'purchase'), event(ts(4))], nextCursor: null },
    ];
    expect(flattenEventLogPages(pages)).toEqual([
      event(ts(6)),
      event(ts(5), 'click'),
      event(ts(5), 'purchase'),
      event(ts(4)),
    ]);
  });

  it('subtracts held rows accumulated across earlier pages within the boundary second', () => {
    const pages = [
      { events: [event(ts(5)), event(ts(5))], nextCursor: { timestamp: ts(5), skip: 2 } },
      { events: [event(ts(5)), event(ts(5)), event(ts(5), 'purchase')], nextCursor: { timestamp: ts(5), skip: 5 } },
      { events: [event(ts(5)), event(ts(5)), event(ts(5), 'purchase'), event(ts(4))], nextCursor: null },
    ];
    expect(flattenEventLogPages(pages)).toEqual([
      event(ts(5)),
      event(ts(5)),
      event(ts(5), 'purchase'),
      event(ts(4)),
    ]);
  });
});

describe('subtractHeldBoundaryEvents', () => {
  it('passes rows newer than the boundary second through untouched', () => {
    const held = [event(ts(5))];
    const fetched = [event(ts(7)), event(ts(6)), event(ts(5))];
    expect(subtractHeldBoundaryEvents(fetched, held, ts(5))).toEqual([event(ts(7)), event(ts(6))]);
  });

  it('keeps boundary-second rows whose content is not held', () => {
    const held = [event(ts(5), 'click')];
    const fetched = [event(ts(5), 'purchase'), event(ts(5), 'click')];
    expect(subtractHeldBoundaryEvents(fetched, held, ts(5))).toEqual([event(ts(5), 'purchase')]);
  });

  it('subtracts identical duplicates by count', () => {
    const held = [event(ts(5)), event(ts(5))];
    const fetched = [event(ts(5)), event(ts(5)), event(ts(5))];
    expect(subtractHeldBoundaryEvents(fetched, held, ts(5))).toEqual([event(ts(5))]);
  });

  it('returns nothing when the fetch holds no new rows', () => {
    const held = [event(ts(5), 'click'), event(ts(5), 'purchase')];
    const fetched = [event(ts(5), 'purchase'), event(ts(5), 'click')];
    expect(subtractHeldBoundaryEvents(fetched, held, ts(5))).toEqual([]);
  });

  it('ignores held rows outside the boundary second', () => {
    const held = [event(ts(5)), event(ts(4))];
    const fetched = [event(ts(5)), event(ts(5))];
    expect(subtractHeldBoundaryEvents(fetched, held, ts(5))).toEqual([event(ts(5))]);
  });
});
