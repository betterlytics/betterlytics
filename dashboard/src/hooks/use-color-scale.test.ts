import { describe, expect, it } from 'vitest';
import { createGammaScale } from './use-color-scale';

const LOW = '#aaccff';
const HIGH = '#1133aa';

describe('createGammaScale', () => {
  it('maps the only value to the top color when the maximum is one', () => {
    const scale = createGammaScale([LOW, HIGH], 1);
    expect(scale(1)).toBe(HIGH);
    expect(scale(0)).toBe(LOW);
  });

  it('never returns an undefined color across the range', () => {
    const scale = createGammaScale([LOW, HIGH], 50);
    for (const v of [0, 1, 2, 25, 50, 500]) expect(typeof scale(v)).toBe('string');
  });

  it('keeps the ends anchored and grows monotonically', () => {
    const scale = createGammaScale([LOW, HIGH], 100);
    expect(scale(1)).toBe(scale(0));
    expect(scale(100)).toBe(scale(1000));
    const ramp = [1, 2, 10, 50, 100].map((v) => scale(v));
    expect(new Set(ramp).size).toBe(ramp.length);
  });
});
