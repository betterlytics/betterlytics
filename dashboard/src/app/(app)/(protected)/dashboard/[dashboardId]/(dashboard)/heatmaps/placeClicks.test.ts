import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventType, type eventWithTime } from '@rrweb/types';
import { SNAPSHOT_SETTLE_MS, type HeatmapClickAnchor } from '@/entities/analytics/clickHeatmap.entities';
import { locateInDocument, placeClicks, type ElementBox, type LocatedElement } from './placeClicks';
import { snapshotEvents } from './snapshotEvents';

function anchor(selector: string, overrides: Partial<HeatmapClickAnchor> = {}): HeatmapClickAnchor {
  return { selector, offsetX: 0.5, offsetY: 0.5, x: 100, y: 200, fixed: false, onPage: false, count: 1, ...overrides };
}

type FakeElement = {
  tagName: string;
  namespaceURI: string;
  parentElement: FakeElement | null;
  ownerDocument: { body?: FakeElement; documentElement?: FakeElement };
  computed: Record<string, string>;
  box: ElementBox;
  clientLeft: number;
  clientTop: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  scrollHeight: number;
  clientWidth: number;
  clientHeight: number;
  style: { setProperty: ReturnType<typeof vi.fn> };
  getBoundingClientRect: () => ElementBox;
};

// Just the parts of a laid out page that locating reads
function fakePage(scroll = { x: 0, y: 0 }) {
  const owner: FakeElement['ownerDocument'] = {};
  const matches = new Map<string, FakeElement[]>();
  const el = (
    tagName: string,
    parent: FakeElement | null,
    { selector, ...props }: Partial<FakeElement> & { selector?: string } = {},
  ): FakeElement => {
    const box = props.box ?? { left: 0, top: 0, width: 100, height: 100 };
    const element: FakeElement = {
      tagName,
      namespaceURI: 'http://www.w3.org/1999/xhtml',
      parentElement: parent,
      ownerDocument: owner,
      computed: {},
      box,
      clientLeft: 0,
      clientTop: 0,
      scrollLeft: 0,
      scrollTop: 0,
      scrollWidth: box.width,
      scrollHeight: box.height,
      clientWidth: box.width,
      clientHeight: box.height,
      style: { setProperty: vi.fn() },
      getBoundingClientRect: () => element.box,
      ...props,
    };
    if (selector) matches.set(selector, [...(matches.get(selector) ?? []), element]);
    return element;
  };
  owner.documentElement = el('HTML', null);
  owner.body = el('BODY', owner.documentElement);
  const doc = {
    defaultView: {
      scrollX: scroll.x,
      scrollY: scroll.y,
      getComputedStyle: (element: FakeElement) => ({
        position: 'static',
        display: 'block',
        overflowX: 'visible',
        overflowY: 'visible',
        ...element.computed,
      }),
    },
    querySelectorAll: (selector: string) => {
      if (selector.startsWith('>')) throw new SyntaxError(selector);
      return matches.get(selector) ?? [];
    },
  };
  return { body: owner.body, el, locate: locateInDocument(doc as unknown as Document) };
}

describe('placeClicks', () => {
  const sidebar = { part: 'sidebar' };
  const boxes: Record<string, LocatedElement<typeof sidebar>> = {
    'button#buy': { host: null, left: 300, top: 1000, width: 120, height: 40 },
    'nav > a.pricing': { host: sidebar, left: 10, top: 500, width: 100, height: 20 },
  };
  const locate = vi.fn((selector: string) => boxes[selector] ?? null);

  beforeEach(() => locate.mockClear());

  it('puts a click on its element by its offset inside it', () => {
    const { layers } = placeClicks([anchor('button#buy', { offsetX: 0.25, offsetY: 1, count: 3 })], locate);
    expect(layers.get(null)).toEqual([{ x: 330, y: 1040, count: 3 }]);
  });

  it('groups clicks by the host their element moves with', () => {
    const { layers } = placeClicks([anchor('nav > a.pricing', { fixed: true }), anchor('button#buy')], locate);
    expect(layers.get(sidebar)).toEqual([{ x: 60, y: 510, count: 1 }]);
    expect(layers.get(null)).toEqual([{ x: 360, y: 1020, count: 1 }]);
  });

  it('falls back to the page position when the element is missing', () => {
    const { layers } = placeClicks([anchor('a.renamed', { x: 100, y: 200 })], locate);
    expect(layers.get(null)).toEqual([{ x: 100, y: 200, count: 1 }]);
  });

  it('places clicks on the page itself by their page position', () => {
    const { layers } = placeClicks([anchor('', { onPage: true, offsetX: 0, offsetY: 0, x: 640, y: 90 })], locate);
    expect(layers.get(null)).toEqual([{ x: 640, y: 90, count: 1 }]);
    expect(locate).not.toHaveBeenCalled();
  });

  it('only counts fixed clicks on the page itself', () => {
    const result = placeClicks([anchor('', { onPage: true, fixed: true, count: 2 })], locate);
    expect(result.unplacedFixed).toBe(2);
    expect(result.layers.size).toBe(0);
  });

  it('only counts fixed clicks whose element is missing', () => {
    const result = placeClicks(
      [anchor('nav.sticky', { fixed: true, count: 4 }), anchor('button#buy', { fixed: true, count: 2 })],
      locate,
    );
    expect(result.unplacedFixed).toBe(4);
    expect(result.layers.get(null)).toEqual([{ x: 360, y: 1020, count: 2 }]);
  });

  it('looks each selector up once', () => {
    placeClicks([anchor('button#buy'), anchor('button#buy', { offsetX: 0.1 }), anchor('a.renamed')], locate);
    expect(locate).toHaveBeenCalledTimes(2);
  });
});

describe('locateInDocument', () => {
  it('measures an element in a fixed part from that part, whatever the page scroll', () => {
    const page = fakePage({ x: 0, y: 500 });
    const sidebar = page.el('ASIDE', page.body, { computed: { position: 'fixed' } });
    page.el('A', sidebar, { selector: 'a', box: { left: 20, top: 300, width: 100, height: 20 } });
    const located = page.locate('a');
    expect(located?.host).toBe(sidebar);
    expect(located).toMatchObject({ left: 20, top: 300, width: 100, height: 20 });
    expect(sidebar.style.setProperty).not.toHaveBeenCalled();
  });

  it('measures inside the innermost scrolling part, counting its border and scroll', () => {
    const page = fakePage();
    const sidebar = page.el('ASIDE', page.body, { computed: { position: 'fixed' } });
    const list = page.el('NAV', sidebar, {
      computed: { overflowY: 'auto' },
      box: { left: 0, top: 60, width: 250, height: 400 },
      clientTop: 1,
      scrollTop: 120,
      scrollHeight: 900,
      clientHeight: 398,
    });
    page.el('A', list, { selector: 'a', box: { left: 10, top: 200, width: 100, height: 20 } });
    const located = page.locate('a');
    expect(located?.host).toBe(list);
    expect(located).toMatchObject({ left: 10, top: 259 });
    expect(list.style.setProperty).toHaveBeenCalledWith('position', 'relative', 'important');
    expect(list.style.setProperty).toHaveBeenCalledWith('inset', 'auto', 'important');
  });

  it('keeps an element on the page when nothing around it scrolls or stays put', () => {
    const page = fakePage({ x: 5, y: 500 });
    const box = page.el('DIV', page.body, { computed: { overflowY: 'auto' } });
    const field = page.el('TEXTAREA', box, { computed: { overflowY: 'auto' }, scrollHeight: 400 });
    page.el('SPAN', field, { selector: 'span', box: { left: 30, top: 40, width: 10, height: 10 } });
    expect(page.locate('span')).toEqual({ host: null, left: 35, top: 540, width: 10, height: 10 });
  });

  it('stands in for a sticky table header with the cell the element is in', () => {
    const page = fakePage();
    const table = page.el('TABLE', page.body);
    const head = page.el('THEAD', table, { computed: { position: 'sticky' } });
    const row = page.el('TR', head);
    const cell = page.el('TH', row, { box: { left: 100, top: 0, width: 80, height: 30 } });
    page.el('SPAN', cell, { selector: 'span', computed: { display: 'inline' }, box: { left: 110, top: 5, width: 40, height: 20 } });
    const located = page.locate('span');
    expect(located?.host).toBe(cell);
    expect(located).toMatchObject({ left: 10, top: 5 });
  });

  it('leaves a sticky inline element without anything inside it on the page', () => {
    const page = fakePage();
    const label = page.el('SPAN', page.body, { computed: { position: 'sticky', display: 'inline' } });
    page.el('B', label, { selector: 'b', computed: { display: 'inline' } });
    expect(page.locate('b')?.host).toBeNull();
  });

  it('finds nothing for missing, repeated, invalid or empty elements', () => {
    const page = fakePage();
    page.el('A', page.body, { selector: 'a' });
    page.el('A', page.body, { selector: 'a' });
    page.el('I', page.body, { selector: 'i', box: { left: 0, top: 0, width: 0, height: 0 } });
    expect(page.locate('a')).toBeNull();
    expect(page.locate('i')).toBeNull();
    expect(page.locate('nav')).toBeNull();
    expect(page.locate('> a')).toBeNull();
  });
});

describe('snapshotEvents', () => {
  const T = 1_755_600_000_000;
  const event = (type: EventType, timestamp: number) => ({ type, timestamp, data: {} }) as unknown as eventWithTime;

  it('starts at the snapshot and keeps the changes made shortly after it', () => {
    const events = [
      event(EventType.IncrementalSnapshot, T - 500),
      event(EventType.Meta, T),
      event(EventType.FullSnapshot, T),
      event(EventType.IncrementalSnapshot, T + 1000),
      event(EventType.IncrementalSnapshot, T + SNAPSHOT_SETTLE_MS + 1),
    ];
    expect(snapshotEvents(events, T)?.map((e) => e.timestamp)).toEqual([T, T, T + 1000]);
  });

  it('stops at the next page', () => {
    const events = [
      event(EventType.Meta, T),
      event(EventType.FullSnapshot, T),
      event(EventType.Meta, T + 100),
      event(EventType.FullSnapshot, T + 100),
    ];
    expect(snapshotEvents(events, T)).toHaveLength(2);
    expect(snapshotEvents(events, T + 100)?.[0].timestamp).toBe(T + 100);
  });

  it('refuses a segment without a full snapshot', () => {
    expect(snapshotEvents([event(EventType.Meta, T), event(EventType.IncrementalSnapshot, T)], T)).toBeNull();
    expect(snapshotEvents([event(EventType.IncrementalSnapshot, T)], T)).toBeNull();
  });
});
