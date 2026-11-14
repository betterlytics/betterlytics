import { describe, it, expect } from 'vitest';
import { deriveOverallUptime, isStatusPageNoindex } from './publicStatusPage.helpers';

describe('isStatusPageNoindex', () => {
  it('noindexes a self-hosted public page unless the instance allows crawling', () => {
    expect(isStatusPageNoindex('public', false, false)).toBe(true);
    expect(isStatusPageNoindex('public', false, true)).toBe(false);
  });

  it('indexes a Cloud public page', () => {
    expect(isStatusPageNoindex('public', true, false)).toBe(false);
    expect(isStatusPageNoindex('public', true, true)).toBe(false);
  });

  it('always noindexes an unlisted page', () => {
    expect(isStatusPageNoindex('unlisted', true, true)).toBe(true);
    expect(isStatusPageNoindex('unlisted', false, true)).toBe(true);
    expect(isStatusPageNoindex('unlisted', false, false)).toBe(true);
  });
});

describe('deriveOverallUptime', () => {
  it('pools seconds so a monitor with three days of data does not count as much as one with ninety', () => {
    const ninetyDays = { upSeconds: 90 * 86_400, monitoredSeconds: 90 * 86_400 };
    const threeDaysHalfDown = { upSeconds: 1.5 * 86_400, monitoredSeconds: 3 * 86_400 };

    expect(deriveOverallUptime([ninetyDays, threeDaysHalfDown])).toBeCloseTo((91.5 / 93) * 100, 10);
  });

  it('is null when no monitor was monitored', () => {
    expect(deriveOverallUptime([{ upSeconds: 0, monitoredSeconds: 0 }])).toBeNull();
    expect(deriveOverallUptime([])).toBeNull();
  });
});
