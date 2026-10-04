import { describe, expect, it } from 'vitest';
import { createIncidentEntryFormatter } from './incidentEntryTimestamp';

const labels = { today: 'Today', yesterday: 'Yesterday' };

describe('createIncidentEntryFormatter', () => {
  it('formats in the given zone', () => {
    const format = createIncidentEntryFormatter({ locale: 'en', timeZone: 'Asia/Tokyo', hour12: false, labels });

    expect(format(new Date('2026-09-21T16:00:00Z'), new Date('2026-09-21T18:00:00Z'))).toBe('Today, 01:00');
  });

  it('does not throw on a zone Intl rejects', () => {
    expect(() =>
      createIncidentEntryFormatter({ locale: 'en', timeZone: 'Foo/Bar', labels })(new Date(), new Date()),
    ).not.toThrow();
  });
});
