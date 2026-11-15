import { describe, expect, it } from 'vitest';
import {
  limitCenter,
  parseCssLength,
  popupPanOffset,
  roomBand,
  sidebarOverlay,
  type Box,
  type Overlay,
  type Rect,
} from '@/components/map/popup-pan';

const rect = (left: number, top: number, right: number, bottom: number): Rect => ({ left, top, right, bottom });
const container = rect(0, 56, 1800, 1000);
const filtersCard: Overlay = { edge: 'top', rect: rect(1200, 64, 1790, 120) };
const legend: Overlay = { edge: 'bottom', rect: rect(1600, 920, 1790, 990) };

describe('popupPanOffset', () => {
  it('is zero when the popup fits', () => {
    expect(popupPanOffset(rect(800, 400, 1000, 500), container, [filtersCard, legend])).toEqual({ x: 0, y: 0 });
  });

  it('keeps a gap from the map edge even without overlays', () => {
    expect(popupPanOffset(rect(800, 58, 1000, 158), container, [])).toEqual({ x: 0, y: 2 - 8 });
  });

  it('pans down past a top overlay the popup would run into', () => {
    expect(popupPanOffset(rect(1300, 76, 1500, 176), container, [filtersCard])).toEqual({ x: 0, y: 20 - 72 });
  });

  it('ignores a top overlay the popup is not under', () => {
    expect(popupPanOffset(rect(300, 60, 500, 160), container, [filtersCard])).toEqual({ x: 0, y: 4 - 8 });
  });

  it('pans up off a bottom overlay the popup overlaps', () => {
    expect(popupPanOffset(rect(1500, 850, 1700, 950), container, [legend])).toEqual({ x: 0, y: 950 - 920 + 8 });
    expect(popupPanOffset(rect(300, 850, 500, 950), container, [legend])).toEqual({ x: 0, y: 0 });
  });

  it('pans right from under the sidebar', () => {
    expect(popupPanOffset(rect(100, 400, 300, 500), container, [sidebarOverlay(256)])).toEqual({
      x: 100 - 264,
      y: 0,
    });
  });

  it('pans right from a marked left overlay only where it reaches', () => {
    const drawer: Overlay = { edge: 'left', rect: rect(0, 600, 200, 1000) };
    expect(popupPanOffset(rect(100, 700, 300, 800), container, [drawer])).toEqual({ x: 100 - 208, y: 0 });
    expect(popupPanOffset(rect(100, 300, 300, 400), container, [drawer])).toEqual({ x: 0, y: 0 });
  });

  it('pans left from a right overlay', () => {
    const panel: Overlay = { edge: 'right', rect: rect(1384, 300, 1784, 984) };
    expect(popupPanOffset(rect(1500, 400, 1700, 500), container, [panel])).toEqual({ x: 1700 - 1800 + 424, y: 0 });
  });

  it('ignores overlays outside the map and empty ones', () => {
    const topBar: Overlay = { edge: 'top', rect: rect(0, 0, 1800, 40) };
    const hidden: Overlay = { edge: 'top', rect: rect(500, 100, 500, 100) };
    expect(popupPanOffset(rect(800, 400, 1000, 500), container, [topBar, hidden])).toEqual({ x: 0, y: 0 });
  });

  it('favours the top-left edges when the popup cannot fit', () => {
    expect(popupPanOffset(rect(-50, 0, 1900, 1100), container, [])).toEqual({ x: -50 - 8, y: -56 - 8 });
  });

  it('settles when the first pan moves the popup under another overlay', () => {
    const wideCard: Overlay = { edge: 'top', rect: rect(200, 64, 1790, 120) };
    const popup = rect(100, 100, 180, 200);
    expect(popupPanOffset(popup, container, [sidebarOverlay(256), wideCard])).toEqual({
      x: 100 - 264,
      y: 44 - 72,
    });
  });
});

const box = (minX: number, minY: number, maxX: number, maxY: number): Box => ({
  min: { x: minX, y: minY },
  max: { x: maxX, y: maxY },
});
const view = { x: 1000, y: 800 };

describe('limitCenter', () => {
  it('leaves a view that sits inside a wider band alone', () => {
    expect(limitCenter({ x: 2000, y: 1000 }, view, box(0, 0, 4000, 2000))).toEqual({ x: 2000, y: 1000 });
  });

  it('pushes a view back by the amount it pokes out of a wider band', () => {
    expect(limitCenter({ x: 450, y: 1700 }, view, box(0, 0, 4000, 2000))).toEqual({ x: 500, y: 1600 });
  });

  it('pins a view wider than the band to its middle', () => {
    expect(limitCenter({ x: 300, y: 100 }, view, box(0, 0, 800, 500))).toEqual({ x: 400, y: 250 });
  });

  it('ignores offsets of a pixel or less like Leaflet does', () => {
    expect(limitCenter({ x: 499.5, y: 1000 }, view, box(0, 0, 4000, 2000))).toEqual({ x: 499.5, y: 1000 });
  });
});

describe('roomBand', () => {
  it('moves a band narrower than the view by the room, so the pinned view moves with it', () => {
    expect(roomBand(box(0, 0, 800, 500), view, { x: 400, y: 250 }, { x: -30, y: -120 })).toEqual(
      box(-30, -120, 770, 380),
    );
  });

  it('grows a band wider than the view just enough to hold the view the popup needs', () => {
    expect(roomBand(box(0, 0, 4000, 2000), view, { x: 2000, y: 500 }, { x: 50, y: -120 })).toEqual(
      box(0, -20, 4000, 2000),
    );
  });

  it('handles the axes independently', () => {
    expect(roomBand(box(0, 0, 800, 2000), view, { x: 400, y: 500 }, { x: -30, y: -120 })).toEqual(
      box(-30, -20, 770, 2000),
    );
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
