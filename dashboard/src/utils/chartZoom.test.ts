import { describe, expect, it } from 'vitest';
import { getZoomWindow } from './chartZoom';

const HOUR = 60 * 60 * 1000;
const at = (hour: number) => Date.UTC(2026, 9, 24) + hour * HOUR;
const today = { start: at(0), endExclusive: at(24) };

describe('getZoomWindow', () => {
  it('ends where the bucket after the last selected one starts', () => {
    const buckets = [0, 1, 2, 3, 4, 5].map(at);
    expect(getZoomWindow(buckets, [at(3), at(1)], today)).toEqual({ start: at(1), end: at(4) });
  });

  it('finds the next bucket among the incomplete series too', () => {
    // Today at 14:30: the solid series stops at 13:00, the 14:00 bucket and later are drawn separately
    const solid = [9, 10, 11, 12, 13].map(at);
    const incomplete = [13, 14, 15].map(at);
    expect(getZoomWindow([...solid, ...incomplete], [at(9), at(13)], today)).toEqual({
      start: at(9),
      end: at(14),
    });
  });

  it('ends at the range end when the last bucket is selected', () => {
    expect(getZoomWindow([22, 23].map(at), [at(22), at(23)], today)).toEqual({ start: at(22), end: at(24) });
  });

  it('keeps the window inside the current range', () => {
    const range = { start: at(2), endExclusive: at(5) };
    expect(getZoomWindow([0, 24].map(at), [at(0), at(0)], range)).toEqual({ start: at(2), end: at(5) });
  });

  it('widens a window under 15 minutes, backwards at the range end', () => {
    const minute = 60 * 1000;
    const buckets = [0, 1, 2, 3].map((m) => at(23) + m * minute);
    expect(getZoomWindow(buckets, [at(23), at(23) + minute], today)).toEqual({
      start: at(23),
      end: at(23) + 15 * minute,
    });
    expect(getZoomWindow(buckets, [at(24) - minute, at(24) - minute], today)).toEqual({
      start: at(24) - 15 * minute,
      end: at(24),
    });
  });
});
