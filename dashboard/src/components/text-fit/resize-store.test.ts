import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  observed: Element[] = [];
  constructor(public onEntries: (entries: unknown[]) => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  unobserve(el: Element) {
    this.observed = this.observed.filter((o) => o !== el);
  }
}

async function freshStore() {
  vi.resetModules();
  return import('./resize-store');
}

describe('resize-store', () => {
  beforeEach(() => {
    FakeResizeObserver.instances = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('creates one observer for many subscriptions', async () => {
    const store = await freshStore();
    const a = { id: 'a' } as unknown as Element;
    const b = { id: 'b' } as unknown as Element;
    store.subscribeWidth(a, () => {});
    store.subscribeWidth(a, () => {});
    store.subscribeWidth(b, () => {});
    expect(FakeResizeObserver.instances).toHaveLength(1);
    expect(FakeResizeObserver.instances[0].observed).toEqual([a, b]);
  });

  it('unobserves only when the last subscriber leaves', async () => {
    const store = await freshStore();
    const a = { id: 'a' } as unknown as Element;
    const un1 = store.subscribeWidth(a, () => {});
    const un2 = store.subscribeWidth(a, () => {});
    un1();
    expect(FakeResizeObserver.instances[0].observed).toEqual([a]);
    un2();
    expect(FakeResizeObserver.instances[0].observed).toEqual([]);
  });

  it('dispatches rounded contentBoxSize inline size', async () => {
    const store = await freshStore();
    const a = { id: 'a' } as unknown as Element;
    const widths: number[] = [];
    store.subscribeWidth(a, (w) => widths.push(w));
    FakeResizeObserver.instances[0].onEntries([
      { target: a, contentBoxSize: [{ inlineSize: 101.4 }], contentRect: { width: 0 } },
      { target: a, contentBoxSize: undefined, contentRect: { width: 99.6 } },
    ]);
    expect(widths).toEqual([101, 100]);
  });
});
