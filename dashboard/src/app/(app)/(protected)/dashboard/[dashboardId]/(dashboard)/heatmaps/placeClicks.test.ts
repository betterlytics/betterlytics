import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventType, type eventWithTime } from '@rrweb/types';
import { SNAPSHOT_SETTLE_MS, type HeatmapClickAnchor } from '@/entities/analytics/clickHeatmap.entities';
import { placeClicks, type ElementBox } from './placeClicks';
import { snapshotEvents } from './snapshotEvents';

function anchor(selector: string, overrides: Partial<HeatmapClickAnchor> = {}): HeatmapClickAnchor {
  return { selector, offsetX: 0.5, offsetY: 0.5, x: 100, y: 200, fixed: false, count: 1, ...overrides };
}

describe('placeClicks', () => {
  const boxes: Record<string, ElementBox> = {
    'button#buy': { left: 300, top: 1000, width: 120, height: 40 },
  };
  const locate = vi.fn((selector: string) => boxes[selector] ?? null);

  beforeEach(() => locate.mockClear());

  it('puts a click on its element by its offset inside it', () => {
    const { points } = placeClicks([anchor('button#buy', { offsetX: 0.25, offsetY: 1, count: 3 })], locate);
    expect(points).toEqual([{ x: 330, y: 1040, count: 3 }]);
  });

  it('falls back to the page position when the element is missing', () => {
    const { points } = placeClicks([anchor('a.renamed', { x: 100, y: 200 })], locate);
    expect(points).toEqual([{ x: 100, y: 200, count: 1 }]);
  });

  it('only counts fixed clicks whose element is missing', () => {
    const result = placeClicks(
      [anchor('nav.sticky', { fixed: true, count: 4 }), anchor('button#buy', { fixed: true, count: 2 })],
      locate,
    );
    expect(result.unplacedFixed).toBe(4);
    expect(result.points).toEqual([{ x: 360, y: 1020, count: 2 }]);
  });

  it('looks each selector up once', () => {
    placeClicks([anchor('button#buy'), anchor('button#buy', { offsetX: 0.1 }), anchor('a.renamed')], locate);
    expect(locate).toHaveBeenCalledTimes(2);
  });
});

describe('snapshotEvents', () => {
  const T = 1_755_600_000_000;
  const event = (type: EventType, timestamp: number) => ({ type, timestamp, data: {} }) as unknown as eventWithTime;

  it('starts at the snapshot and keeps the changes made shortly after it', () => {
    const events = [
      event(EventType.IncrementalSnapshot, T - 500),
      event(EventType.Meta, T),
      event(EventType.FullSnapshot, T),
      event(EventType.IncrementalSnapshot, T + 1000),
      event(EventType.IncrementalSnapshot, T + SNAPSHOT_SETTLE_MS + 1),
    ];
    expect(snapshotEvents(events, T)?.map((e) => e.timestamp)).toEqual([T, T, T + 1000]);
  });

  it('stops at the next page', () => {
    const events = [
      event(EventType.Meta, T),
      event(EventType.FullSnapshot, T),
      event(EventType.Meta, T + 100),
      event(EventType.FullSnapshot, T + 100),
    ];
    expect(snapshotEvents(events, T)).toHaveLength(2);
    expect(snapshotEvents(events, T + 100)?.[0].timestamp).toBe(T + 100);
  });

  it('refuses a segment without a full snapshot', () => {
    expect(snapshotEvents([event(EventType.Meta, T), event(EventType.IncrementalSnapshot, T)], T)).toBeNull();
    expect(snapshotEvents([event(EventType.IncrementalSnapshot, T)], T)).toBeNull();
  });
});
