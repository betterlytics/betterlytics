import { describe, expect, it } from 'vitest';
import { getStringWidth, sliceToWidth } from './stringWidth';

describe('getStringWidth', () => {
  it('counts Latin characters as one column each', () => {
    expect(getStringWidth('hello')).toBe(5);
    expect(getStringWidth('')).toBe(0);
  });

  it('counts CJK ideographs and kana as two columns each', () => {
    expect(getStringWidth('家')).toBe(2);
    expect(getStringWidth('日本語')).toBe(6);
    expect(getStringWidth('ひらがな')).toBe(8);
    expect(getStringWidth('カタカナ')).toBe(8);
  });

  it('counts half-width katakana as one column', () => {
    expect(getStringWidth('ｶﾀｶﾅ')).toBe(4);
  });

  it('treats emoji and flags as two columns and does not count combining marks', () => {
    expect(getStringWidth('🎉')).toBe(2);
    expect(getStringWidth('🇯🇵')).toBe(2);
    expect(getStringWidth('é')).toBe(1);
    expect(getStringWidth('é')).toBe(1);
  });

  it('mixes scripts additively', () => {
    expect(getStringWidth('A家B')).toBe(4);
  });
});

describe('sliceToWidth', () => {
  it('takes whole graphemes from the start up to the budget', () => {
    expect(sliceToWidth('hello world', 5)).toBe('hello');
    expect(sliceToWidth('日本語テスト', 6)).toBe('日本語');
  });

  it('takes whole graphemes from the end when fromEnd is set', () => {
    expect(sliceToWidth('hello world', 5, true)).toBe('world');
    expect(sliceToWidth('日本語テスト', 6, true)).toBe('テスト');
  });

  it('never splits a wide grapheme across the budget boundary', () => {
    expect(sliceToWidth('日本語', 5)).toBe('日本');
    expect(getStringWidth(sliceToWidth('日本語', 5))).toBeLessThanOrEqual(5);
  });

  it('never splits a surrogate-pair emoji', () => {
    const result = sliceToWidth('🎉🎉🎉', 5);
    expect(result).toBe('🎉🎉');
    expect([...result].every((ch) => ch.codePointAt(0) !== 0xfffd)).toBe(true);
  });
});
