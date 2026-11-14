import { describe, expect, it } from 'vitest';
import { createGammaScale } from '@/hooks/use-color-scale';

const LOW = '#8cc9f9';
const HIGH = '#1d5fae';
const LOW_RGB = 'rgb(140, 201, 249)';
const HIGH_RGB = 'rgb(29, 95, 174)';

describe('createGammaScale', () => {
  it('colors the top value with the high color when the max is 1', () => {
    expect(createGammaScale([LOW, HIGH], 1)(1)).toBe(HIGH_RGB);
  });

  it('spans low to high between 1 and the max', () => {
    const scale = createGammaScale([LOW, HIGH], 50);
    expect(scale(1)).toBe(LOW_RGB);
    expect(scale(50)).toBe(HIGH_RGB);
  });

  it('clamps values above the max to the high color', () => {
    expect(createGammaScale([LOW, HIGH], 10)(500)).toBe(HIGH_RGB);
  });

  it.each([0, 1, 2, 10])('always returns a color for max %i', (maxValue) => {
    const scale = createGammaScale([LOW, HIGH], maxValue);
    for (const value of [0, 1, 2, 5, 10, 1000]) {
      expect(scale(value)).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
    }
  });
});
