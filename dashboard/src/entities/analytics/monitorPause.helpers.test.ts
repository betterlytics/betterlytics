import { describe, expect, it } from 'vitest';
import {
  excludePausedTime,
  monitorsWithUnrecordedPause,
  pausedOverlapMs,
  unpausedDurationMs,
  withUnrecordedPauses,
} from './monitorPause.helpers';
import type { MonitorPausePeriod } from './monitoring.entities';

const HOUR = 3600;
const T0 = Date.UTC(2026, 1, 21) / 1000;
const at = (hours: number) => T0 + hours * HOUR;
const date = (hours: number) => new Date(at(hours) * 1000);
const pause = (from: number, to: number | null, monitorCheckId = 'm1'): MonitorPausePeriod => ({
  monitorCheckId,
  pausedAt: date(from),
  resumedAt: to == null ? null : date(to),
});

describe('pausedOverlapMs', () => {
  it('counts only the paused part inside the range', () => {
    expect(pausedOverlapMs([pause(2, 4)], at(3) * 1000, at(10) * 1000)).toBe(HOUR * 1000);
  });

  it('counts overlapping periods once and runs an open pause to the end of the range', () => {
    const pauses = [pause(2, 4), pause(3, 5), pause(9, null)];
    expect(pausedOverlapMs(pauses, at(0) * 1000, at(10) * 1000)).toBe(4 * HOUR * 1000);
  });
});

describe('unpausedDurationMs', () => {
  it('leaves paused time out of an incident that stayed open across a pause', () => {
    // Down from 0h to 10h, paused 2h to 7h.
    expect(unpausedDurationMs([pause(2, 7)], at(0) * 1000, at(10) * 1000)).toBe(5 * HOUR * 1000);
  });
});

describe('excludePausedTime', () => {
  const day = { totalSeconds: 24 * HOUR, windowStart: at(0), windowEnd: at(24) };

  it('changes nothing without pauses', () => {
    const window = { ...day, uptimeSeconds: 20 * HOUR, downtime: [[at(1), at(5)]] as Array<[number, number]> };
    expect(excludePausedTime(window, [])).toEqual({ totalSeconds: 24 * HOUR, uptimeSeconds: 20 * HOUR });
  });

  it('leaves paused up time out of the total', () => {
    // Up all day, paused for 6 hours: 18 of 18 monitored hours up.
    const window = { ...day, uptimeSeconds: 24 * HOUR, downtime: [] };
    expect(excludePausedTime(window, [pause(6, 12)])).toEqual({
      totalSeconds: 18 * HOUR,
      uptimeSeconds: 18 * HOUR,
    });
  });

  it('counts paused time during an incident as neither up nor down', () => {
    // Down 4h to 16h (12h), paused 6h to 12h: 6h of the downtime was paused.
    const window = { ...day, uptimeSeconds: 12 * HOUR, downtime: [[at(4), at(16)]] as Array<[number, number]> };
    expect(excludePausedTime(window, [pause(6, 12)])).toEqual({
      totalSeconds: 18 * HOUR,
      uptimeSeconds: 12 * HOUR,
    });
  });

  it('gives a fully paused window no data', () => {
    const window = { ...day, uptimeSeconds: 0, downtime: [[at(0), at(24)]] as Array<[number, number]> };
    expect(excludePausedTime(window, [pause(-5, null)])).toEqual({ totalSeconds: 0, uptimeSeconds: null });
  });

  it('keeps a window without data without data', () => {
    const window = { ...day, uptimeSeconds: null, downtime: [] };
    expect(excludePausedTime(window, [pause(6, 12)])).toEqual({ totalSeconds: 18 * HOUR, uptimeSeconds: null });
  });

  it('ignores pauses outside the window', () => {
    const window = { ...day, uptimeSeconds: 24 * HOUR, downtime: [] };
    expect(excludePausedTime(window, [pause(30, 40)])).toEqual({
      totalSeconds: 24 * HOUR,
      uptimeSeconds: 24 * HOUR,
    });
  });
});

describe('unrecorded pauses', () => {
  const monitors = [
    { id: 'paused-old', isEnabled: false },
    { id: 'paused-new', isEnabled: false },
    { id: 'running', isEnabled: true },
  ];
  const recorded = [pause(5, null, 'paused-new'), pause(1, 2, 'paused-old')];

  it('finds paused monitors without an open period', () => {
    expect(monitorsWithUnrecordedPause(monitors, recorded)).toEqual(['paused-old']);
  });

  it('counts them as paused from their last recorded check', () => {
    const pauses = withUnrecordedPauses(monitors, recorded, { 'paused-old': date(3) });
    expect(pauses).toEqual([...recorded, pause(3, null, 'paused-old')]);
  });

  it('adds nothing for a paused monitor that never ran a check', () => {
    expect(withUnrecordedPauses(monitors, recorded, {})).toEqual(recorded);
  });
});
