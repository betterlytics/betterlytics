import { describe, expect, it } from 'vitest';
import { mountedPillValueCount } from '@/components/filters/pillValuesOverflow';

describe('mountedPillValueCount', () => {
  it('mounts every value of a short list', () => {
    expect(mountedPillValueCount(['/a', '/b', '/c'])).toBe(3);
    expect(mountedPillValueCount([])).toBe(0);
  });

  it('stops once the narrowest plausible glyphs would overflow the widest bar', () => {
    const urls = Array.from({ length: 40 }, (_, index) => `/section/page-${index}/with-a-long-slug`);
    const count = mountedPillValueCount(urls);
    expect(count).toBeGreaterThan(10);
    expect(count).toBeLessThan(40);
    const width = urls.slice(0, count).reduce((sum, url) => sum + url.length * 5 + 6, 0);
    expect(width).toBeGreaterThan(2560);
    expect(width - (urls[count - 1].length * 5 + 6)).toBeLessThanOrEqual(2560);
  });

  it('never mounts more than the hard cap, even for two-letter codes', () => {
    expect(mountedPillValueCount(Array.from({ length: 200 }, () => 'DK'))).toBe(32);
  });
});
