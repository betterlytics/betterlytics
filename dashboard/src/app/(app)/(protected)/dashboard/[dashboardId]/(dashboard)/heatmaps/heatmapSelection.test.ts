import { describe, expect, it } from 'vitest';
import { defaultHeatmapDevice, selectHeatmapPage } from './heatmapSelection';

const pages = [
  { url: '/blog', devices: [] },
  { url: '/', devices: ['mobile' as const] },
  { url: '/pricing', devices: ['desktop' as const, 'mobile' as const] },
];

describe('selectHeatmapPage', () => {
  it('opens the most visited page with heatmap data', () => {
    expect(selectHeatmapPage(pages, undefined, false)).toEqual({ path: '/', devices: ['mobile'], options: pages });
  });

  it('falls back to the most visited page when none has data', () => {
    const noData = [
      { url: '/blog', devices: [] },
      { url: '/', devices: [] },
    ];
    expect(selectHeatmapPage(noData, undefined, false).path).toBe('/blog');
  });

  it('keeps the chosen page', () => {
    expect(selectHeatmapPage(pages, '/pricing', false)).toEqual({
      path: '/pricing',
      devices: ['desktop', 'mobile'],
      options: pages,
    });
  });

  it('lists a chosen page without visits in the period first, with no data', () => {
    const selection = selectHeatmapPage(pages, '/old', false);
    expect(selection.devices).toEqual([]);
    expect(selection.options[0]).toEqual({ url: '/old', devices: [] });
  });

  it("doesn't claim a chosen page has no data when the list was cut off", () => {
    const selection = selectHeatmapPage(pages, '/rare', true);
    expect(selection.devices).toBeNull();
    expect(selection.options[0]).toEqual({ url: '/rare', devices: null });
  });

  it('has no page without pages', () => {
    expect(selectHeatmapPage([], undefined, false)).toEqual({ path: undefined, devices: null, options: [] });
  });
});

describe('defaultHeatmapDevice', () => {
  it('opens desktop when it has data, or when nothing does', () => {
    expect(defaultHeatmapDevice(['mobile', 'desktop'])).toBe('desktop');
    expect(defaultHeatmapDevice([])).toBe('desktop');
    expect(defaultHeatmapDevice(null)).toBe('desktop');
  });

  it('opens the first device with data otherwise', () => {
    expect(defaultHeatmapDevice(['mobile', 'tablet'])).toBe('tablet');
    expect(defaultHeatmapDevice(['mobile'])).toBe('mobile');
  });
});
