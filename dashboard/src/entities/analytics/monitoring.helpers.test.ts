import { describe, expect, it } from 'vitest';
import { summarizeUptime, uptimeRatio } from './monitoring.helpers';

describe('summarizeUptime', () => {
  it('pools up time over monitored time', () => {
    const summary = summarizeUptime([
      { upSeconds: 86_400, monitoredSeconds: 86_400 },
      { upSeconds: 0, monitoredSeconds: 3_600 },
    ]);

    expect(summary).toEqual({ upSeconds: 86_400, monitoredSeconds: 90_000, percent: 96 });
  });

  it('weights a short monitored span by its length, not as a whole bucket', () => {
    // A day paused after one hour of downtime is one hour down, not one day down
    const percent = summarizeUptime([
      { upSeconds: 86_400 * 6, monitoredSeconds: 86_400 * 6 },
      { upSeconds: 0, monitoredSeconds: 3_600 },
    ]).percent;

    expect(percent).toBeCloseTo((86_400 * 6 * 100) / (86_400 * 6 + 3_600), 10);
  });

  it('has no percentage when nothing was monitored', () => {
    expect(summarizeUptime([]).percent).toBeNull();
    expect(summarizeUptime([{ upSeconds: 0, monitoredSeconds: 0 }]).percent).toBeNull();
  });
});

describe('uptimeRatio', () => {
  it('is null for an unmonitored bucket and the share of monitored time otherwise', () => {
    expect(uptimeRatio({ upSeconds: 0, monitoredSeconds: 0 })).toBeNull();
    expect(uptimeRatio({ upSeconds: 900, monitoredSeconds: 3_600 })).toBe(0.25);
  });
});
