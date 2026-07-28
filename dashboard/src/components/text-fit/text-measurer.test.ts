import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FontsListener = () => void;

function stubBrowser(measureImpl?: (text: string) => number) {
  const fontListeners: FontsListener[] = [];
  const ctx = {
    font: '',
    measureText: (text: string) => ({ width: measureImpl ? measureImpl(text) : text.length * 7 }),
  };
  vi.stubGlobal('document', {
    createElement: () => ({ getContext: () => ctx }),
    fonts: {
      ready: new Promise<void>(() => {}),
      addEventListener: (_: string, cb: FontsListener) => fontListeners.push(cb),
    },
  });
  vi.stubGlobal('window', {
    devicePixelRatio: 1,
    matchMedia: () => ({ addEventListener: () => {}, removeEventListener: () => {} }),
  });
  return { ctx, fireLoadingdone: () => fontListeners.forEach((cb) => cb()) };
}

async function freshMeasurer() {
  vi.resetModules();
  return import('./text-measurer');
}

describe('text-measurer', () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it('measures and caches per font and text', async () => {
    stubBrowser();
    const m = await freshMeasurer();
    expect(m.measureText('abc', '14px sans-serif')).toBe(21);
    expect(m.measureText('abc', '14px sans-serif')).toBe(21);
    expect(m.getStats().measures).toBe(1);
    expect(m.getStats().cacheHits).toBe(1);
  });

  it('assigns ctx.font only when the font changes', async () => {
    const { ctx } = stubBrowser();
    const m = await freshMeasurer();
    let assignments = 0;
    let stored = '';
    Object.defineProperty(ctx, 'font', {
      get: () => stored,
      set: (v: string) => {
        assignments += 1;
        stored = v;
      },
    });
    m.measureText('a', '14px sans-serif');
    m.measureText('b', '14px sans-serif');
    m.measureText('c', '16px sans-serif');
    expect(assignments).toBe(2);
  });

  it('clears caches and notifies on loadingdone', async () => {
    const { fireLoadingdone } = stubBrowser();
    const m = await freshMeasurer();
    m.measureText('abc', '14px sans-serif');
    let notified = 0;
    m.subscribeInvalidation(() => {
      notified += 1;
    });
    fireLoadingdone();
    expect(notified).toBe(1);
    m.measureText('abc', '14px sans-serif');
    expect(m.getStats().measures).toBe(2);
  });

  it('resolveFont composes longhands and validates via read-back', async () => {
    const { ctx } = stubBrowser();
    vi.stubGlobal('getComputedStyle', () => ({
      fontStyle: 'normal',
      fontWeight: '400',
      fontSize: '14px',
      fontFamily: 'Inter, sans-serif',
    }));
    let stored = '';
    Object.defineProperty(ctx, 'font', {
      get: () => stored,
      set: (v: string) => {
        if (v.includes('px')) stored = v;
      },
    });
    const m = await freshMeasurer();
    expect(m.resolveFont({} as Element)).toBe('normal 400 14px Inter, sans-serif');
  });

  it('is import-safe without browser globals', async () => {
    await expect(freshMeasurer()).resolves.toBeDefined();
  });
});
