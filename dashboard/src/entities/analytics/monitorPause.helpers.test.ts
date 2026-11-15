import { describe, expect, it } from 'vitest';
import {
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
