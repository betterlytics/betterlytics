import { describe, expect, it } from 'vitest';
import { getZoomWindow } from './chartZoom';

const HOUR = 60 * 60 * 1000;
const at = (hour: number) => Date.UTC(2026, 9, 24) + hour * HOUR;
const today = { start: at(0), endExclusive: at(24) };
const hourlyEnd = (bucketStart: number) => bucketStart + HOUR;

describe('getZoomWindow', () => {
  it('ends where the last selected bucket ends', () => {
    expect(getZoomWindow([at(3), at(1)], today, hourlyEnd)).toEqual({ start: at(1), end: at(4) });
  });

  it('ends after the current bucket rather than at the range end', () => {
    // Today at 14:30 with comparison off: the chart has no points after the 14:00 bucket
    expect(getZoomWindow([at(10), at(14)], today, hourlyEnd)).toEqual({ start: at(10), end: at(15) });
  });

  it('ends at the range end when the last bucket is selected', () => {
    expect(getZoomWindow([at(22), at(23)], today, hourlyEnd)).toEqual({ start: at(22), end: at(24) });
  });

  it('keeps the window inside the current range', () => {
    const range = { start: at(2) + HOUR / 2, endExclusive: at(5) };
    expect(getZoomWindow([at(2), at(6)], range, hourlyEnd)).toEqual({ start: at(2) + HOUR / 2, end: at(5) });
  });

  it('widens a window under 15 minutes, backwards at the range end', () => {
    const minute = 60 * 1000;
    const minutelyEnd = (bucketStart: number) => bucketStart + minute;
    expect(getZoomWindow([at(23), at(23) + minute], today, minutelyEnd)).toEqual({
      start: at(23),
      end: at(23) + 15 * minute,
    });
    expect(getZoomWindow([at(24) - minute, at(24) - minute], today, minutelyEnd)).toEqual({
      start: at(24) - 15 * minute,
      end: at(24),
    });
  });
});
