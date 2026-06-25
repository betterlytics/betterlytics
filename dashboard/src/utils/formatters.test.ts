import { describe, expect, it } from 'vitest';
import { formatString } from './formatters';
import { getStringWidth } from './stringWidth';

describe('formatString', () => {
  it('returns short strings unchanged', () => {
    expect(formatString('short', 50)).toBe('short');
    expect(formatString('exactly-ten', 50)).toBe('exactly-ten');
  });

  it('middle-truncates long Latin strings identically to the legacy slice formula', () => {
    const url = 'https://example.com/some/very/long/path/that/keeps/going/forever';
    const half = 10;
    const legacy = `${url.slice(0, half)}...${url.slice(-half)}`;
    expect(formatString(url, 20)).toBe(legacy);
  });

  it('keeps Japanese output within the column budget rather than the character count', () => {
    const jp = 'これは非常に長い日本語のフィルター値の例です';
    const result = formatString(jp, 20);

    expect(result).toContain('...');
    const ellipsisColumns = 3;
    expect(getStringWidth(result)).toBeLessThanOrEqual(20 + ellipsisColumns);
  });

  it('truncates far fewer wide characters than the raw maxLength', () => {
    const jp = '東'.repeat(40);
    const result = formatString(jp, 20);
    const kept = result.replace('...', '');

    expect([...kept].length).toBeLessThan(20);
    expect(getStringWidth(kept)).toBeLessThanOrEqual(20);
  });

  it('never emits a broken surrogate pair when truncating emoji', () => {
    const emoji = '🎉'.repeat(40);
    const result = formatString(emoji, 20);
    expect(result.includes('�')).toBe(false);
  });
});
