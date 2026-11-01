import { describe, expect, it } from 'vitest';
import { paddingFromOverlays, parseCssLength, popupPanOffset, type Rect } from '@/components/map/popup-pan';

const rect = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const container = rect(0, 56, 1800, 1000);
const noPadding = { top: 8, right: 8, bottom: 8, left: 8 };

describe('paddingFromOverlays', () => {
  it('pads each edge by how far its overlay reaches into the map, plus a gap', () => {
    const padding = paddingFromOverlays(
      container,
      [
        { edge: 'top', rect: rect(1200, 64, 1790, 120) },
        { edge: 'right', rect: rect(1384, 300, 1784, 984) },
      ],
      0,
    );
    expect(padding).toEqual({ top: 64 + 8, right: 416 + 8, bottom: 8, left: 8 });
  });

  it('counts the sidebar as a left overlay only where it covers the map', () => {
    expect(paddingFromOverlays(container, [], 256).left).toBe(256 + 8);
    expect(paddingFromOverlays(rect(300, 56, 1800, 1000), [], 256).left).toBe(8);
  });

  it('ignores overlays outside the map', () => {
    const padding = paddingFromOverlays(container, [{ edge: 'top', rect: rect(0, 0, 1800, 56) }], 0);
    expect(padding.top).toBe(8);
  });
});

describe('popupPanOffset', () => {
  it('is zero when the popup fits', () => {
    expect(popupPanOffset(rect(800, 400, 1000, 500), container, noPadding)).toEqual({ x: 0, y: 0 });
  });

  it('pans up by the overshoot past the top padding', () => {
    const padding = { ...noPadding, top: 72 };
    expect(popupPanOffset(rect(800, 76, 1000, 176), container, padding)).toEqual({ x: 0, y: 20 - 72 });
  });

  it('pans sideways for the left and right padding', () => {
    expect(popupPanOffset(rect(100, 400, 300, 500), container, { ...noPadding, left: 264 })).toEqual({
      x: 100 - 264,
      y: 0,
    });
    expect(popupPanOffset(rect(1500, 400, 1700, 500), container, { ...noPadding, right: 416 })).toEqual({
      x: 1700 - 1800 + 416,
      y: 0,
    });
  });
});

describe('parseCssLength', () => {
  it('reads px and rem and falls back to zero', () => {
    expect(parseCssLength('256px', 16)).toBe(256);
    expect(parseCssLength('16rem', 16)).toBe(256);
    expect(parseCssLength(' 3rem ', 16)).toBe(48);
    expect(parseCssLength('', 16)).toBe(0);
    expect(parseCssLength('var(--x)', 16)).toBe(0);
  });
});
