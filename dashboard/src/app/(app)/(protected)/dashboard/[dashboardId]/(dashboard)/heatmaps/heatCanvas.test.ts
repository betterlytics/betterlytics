import { describe, expect, it } from 'vitest';
import { colorizeAlpha, heatAlpha } from './heatCanvas';

describe('heatAlpha', () => {
  it('is full strength for the busiest point', () => {
    expect(heatAlpha(50, 50)).toBe(1);
  });

  it('keeps a single click visible next to a busy point', () => {
    const alpha = heatAlpha(1, 10000);
    expect(alpha).toBeGreaterThan(0.05);
    expect(alpha).toBeLessThan(0.2);
  });

  it('grows with the count', () => {
    expect(heatAlpha(10, 100)).toBeLessThan(heatAlpha(50, 100));
  });

  it('is zero without clicks', () => {
    expect(heatAlpha(0, 10)).toBe(0);
    expect(heatAlpha(3, 0)).toBe(0);
  });
});

describe('colorizeAlpha', () => {
  it('maps each pixel alpha to its palette color and leaves empty pixels alone', () => {
    const palette = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) palette.set([i, 255 - i, 7, 255], i * 4);

    const pixels = new Uint8ClampedArray([0, 0, 0, 0, 0, 0, 0, 200, 0, 0, 0, 255]);
    colorizeAlpha(pixels, palette);

    expect(Array.from(pixels)).toEqual([0, 0, 0, 0, 200, 55, 7, 200, 255, 0, 7, 255]);
  });
});
