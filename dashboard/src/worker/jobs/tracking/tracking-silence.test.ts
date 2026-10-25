import { describe, expect, it } from 'vitest';
import {
  classifyTrackingSilence,
  earliestNeededDay,
  findSilenceCandidates,
  hasBaseline,
  isOutage,
  isSilent,
  type DailyEventTotals,
} from '@/worker/jobs/tracking/tracking-silence';

const NOW = new Date('2026-07-26T12:00:00Z');

function days(entries: Record<string, number>): DailyEventTotals {
  return new Map(Object.entries(entries));
}

const STEADY_UNTIL_JUL_24 = days({
  '2026-07-19': 30,
  '2026-07-20': 30,
  '2026-07-21': 30,
  '2026-07-22': 30,
  '2026-07-23': 30,
  '2026-07-24': 12,
});

const ACTIVE_TODAY = days({
  '2026-07-21': 50,
  '2026-07-22': 50,
  '2026-07-23': 50,
  '2026-07-24': 50,
  '2026-07-25': 50,
  '2026-07-26': 5,
});

describe('hasBaseline', () => {
  it('needs events on each of the 5 full days before the last event, averaging at least 20', () => {
    expect(hasBaseline(STEADY_UNTIL_JUL_24, '2026-07-24')).toBe(true);
    expect(
      hasBaseline(
        days({ '2026-07-19': 20, '2026-07-20': 20, '2026-07-21': 20, '2026-07-22': 20, '2026-07-23': 20 }),
        '2026-07-24',
      ),
    ).toBe(true);
  });

  it('rejects a window with a missed day, even with high volume', () => {
    expect(
      hasBaseline(
        days({ '2026-07-19': 500, '2026-07-20': 500, '2026-07-22': 500, '2026-07-23': 500 }),
        '2026-07-24',
      ),
    ).toBe(false);
  });

  it('rejects a low-traffic site averaging under 20 a day', () => {
    expect(
      hasBaseline(
        days({ '2026-07-19': 19, '2026-07-20': 19, '2026-07-21': 19, '2026-07-22': 19, '2026-07-23': 20 }),
        '2026-07-24',
      ),
    ).toBe(false);
  });

  it('ignores the last-event day itself', () => {
    expect(
      hasBaseline(
        days({ '2026-07-20': 30, '2026-07-21': 30, '2026-07-22': 30, '2026-07-23': 30, '2026-07-24': 900 }),
        '2026-07-24',
      ),
    ).toBe(false);
  });
});

describe('isSilent', () => {
  it('turns silent once 24 hours pass with no events', () => {
    expect(isSilent(new Date('2026-07-25T12:00:01Z'), NOW)).toBe(false);
    expect(isSilent(new Date('2026-07-25T12:00:00Z'), NOW)).toBe(true);
  });
});

describe('isOutage', () => {
  it('trips only when more than 20% of baseline sites are silent', () => {
    expect(isOutage(1, 5)).toBe(false);
    expect(isOutage(2, 9)).toBe(true);
    expect(isOutage(0, 0)).toBe(false);
  });
});

describe('findSilenceCandidates', () => {
  it('picks sites with nothing today whose last active day is inside the lookback', () => {
    const dailyBySite = new Map([
      ['silent', STEADY_UNTIL_JUL_24],
      ['active', ACTIVE_TODAY],
      ['long-gone', days({ '2026-07-10': 100, '2026-07-20': 100 })],
    ]);
    expect(findSilenceCandidates(dailyBySite, NOW)).toEqual(['silent']);
  });

  it('fetches enough history for the oldest baseline window', () => {
    expect(earliestNeededDay(NOW)).toBe('2026-07-18');
  });
});

describe('classifyTrackingSilence', () => {
  it('flags a baseline site silent for 24 hours and counts active baseline sites', () => {
    const dailyBySite = new Map([
      ['silent', STEADY_UNTIL_JUL_24],
      ['a', ACTIVE_TODAY],
      ['b', ACTIVE_TODAY],
      ['c', ACTIVE_TODAY],
      ['d', ACTIVE_TODAY],
    ]);
    const lastEventAt = new Date('2026-07-24T15:30:00Z');
    const result = classifyTrackingSilence(dailyBySite, new Map([['silent', lastEventAt]]), NOW);
    expect(result).toEqual({ baselineSiteCount: 5, silent: [{ siteId: 'silent', lastEventAt }], isOutage: false });
  });

  it('does not flag a candidate whose last event is under 24 hours old', () => {
    const daily = days({
      '2026-07-20': 30,
      '2026-07-21': 30,
      '2026-07-22': 30,
      '2026-07-23': 30,
      '2026-07-24': 30,
      '2026-07-25': 30,
    });
    const result = classifyTrackingSilence(
      new Map([['quiet-night', daily]]),
      new Map([['quiet-night', new Date('2026-07-25T23:00:00Z')]]),
      NOW,
    );
    expect(result).toEqual({ baselineSiteCount: 1, silent: [], isOutage: false });
  });

  it('never flags sites without a baseline (low-traffic or seasonal)', () => {
    const seasonal = days({
      '2026-07-19': 300,
      '2026-07-21': 300,
      '2026-07-22': 300,
      '2026-07-23': 300,
      '2026-07-24': 300,
    });
    const lowTraffic = days({
      '2026-07-19': 3,
      '2026-07-20': 3,
      '2026-07-21': 3,
      '2026-07-22': 3,
      '2026-07-23': 3,
      '2026-07-24': 3,
    });
    const result = classifyTrackingSilence(
      new Map([
        ['seasonal', seasonal],
        ['low', lowTraffic],
      ]),
      new Map([
        ['seasonal', new Date('2026-07-24T10:00:00Z')],
        ['low', new Date('2026-07-24T10:00:00Z')],
      ]),
      NOW,
    );
    expect(result).toEqual({ baselineSiteCount: 0, silent: [], isOutage: false });
  });

  it('needs the baseline rebuilt after tracking resumes: a stray event after a silence never triggers', () => {
    const daily = days({
      '2026-07-19': 30,
      '2026-07-20': 30,
      '2026-07-21': 30,
      '2026-07-22': 30,
      '2026-07-23': 30,
      '2026-07-25': 1,
    });
    const result = classifyTrackingSilence(
      new Map([['resumed', daily]]),
      new Map([['resumed', new Date('2026-07-25T08:00:00Z')]]),
      new Date('2026-07-26T09:00:00Z'),
    );
    expect(result.silent).toEqual([]);
  });

  it('ignores silences older than the lookback', () => {
    const result = classifyTrackingSilence(
      new Map([['old', STEADY_UNTIL_JUL_24]]),
      new Map([['old', new Date('2026-07-24T15:30:00Z')]]),
      new Date('2026-07-27T16:00:00Z'),
    );
    expect(result).toEqual({ baselineSiteCount: 0, silent: [], isOutage: false });
  });

  it('reports an outage when more than 20% of baseline sites go silent in the same check', () => {
    const lastEventAt = new Date('2026-07-24T15:30:00Z');
    const dailyBySite = new Map([
      ['s1', STEADY_UNTIL_JUL_24],
      ['s2', STEADY_UNTIL_JUL_24],
      ['a', ACTIVE_TODAY],
      ['b', ACTIVE_TODAY],
      ['c', ACTIVE_TODAY],
    ]);
    const result = classifyTrackingSilence(
      dailyBySite,
      new Map([
        ['s1', lastEventAt],
        ['s2', lastEventAt],
      ]),
      NOW,
    );
    expect(result.baselineSiteCount).toBe(5);
    expect(result.silent).toHaveLength(2);
    expect(result.isOutage).toBe(true);
  });
});
