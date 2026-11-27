import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventType, type eventWithTime } from '@rrweb/types';
import { SNAPSHOT_SETTLE_MS, type HeatmapClickAnchor } from '@/entities/analytics/clickHeatmap.entities';
import {
  findInDocument,
  findInFrame,
  placeClicks,
  type Candidate,
  type ElementBox,
  type LocatedElement,
} from './placeClicks';
import { snapshotEvents } from './snapshotEvents';

const PAGE_HEIGHT = 4000;

function anchor(selector: string, overrides: Partial<HeatmapClickAnchor> = {}): HeatmapClickAnchor {
  return {
    selector,
    offsetX: 0.5,
    offsetY: 0.5,
    x: 100,
    y: 200,
    relY: 200 / PAGE_HEIGHT,
    fixed: false,
    onPage: false,
    count: 1,
    ...overrides,
  };
}

// A match drawn where its clicks were made, unless it is located elsewhere
function candidate<Host>(area: ElementBox, located: LocatedElement<Host> = { host: null, ...area }): Candidate<Host> {
  return { area, locate: vi.fn(() => located) };
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

// Just the parts of a laid out page that finding reads
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
  return { body: owner.body, el, find: findInDocument(doc as unknown as Document) };
}

describe('placeClicks', () => {
  const sidebar = { part: 'sidebar' };
  const buy = candidate<typeof sidebar>({ left: 300, top: 1000, width: 120, height: 40 });
  const pricing = candidate<typeof sidebar>(
    { left: 10, top: 500, width: 100, height: 20 },
    { host: sidebar, left: 10, top: 500, width: 100, height: 20 },
  );
  const matches: Record<string, Candidate<typeof sidebar>[]> = {
    'button#buy': [buy],
    'nav > a.pricing': [pricing],
  };
  const find = vi.fn((selector: string) => matches[selector] ?? []);
  // Where the clicks on the buy button were made
  const onBuy = { x: 360, y: 1020, relY: 1020 / PAGE_HEIGHT };

  beforeEach(() => vi.clearAllMocks());

  it('puts a click on its element by its offset inside it', () => {
    const layers = placeClicks(
      [anchor('button#buy', { ...onBuy, offsetX: 0.25, offsetY: 1, count: 3 })],
      find,
      PAGE_HEIGHT,
    );
    expect(layers.get(null)).toEqual([{ x: 330, y: 1040, count: 3 }]);
  });

  it('groups clicks by the host their element moves with', () => {
    const layers = placeClicks(
      [anchor('nav > a.pricing', { fixed: true }), anchor('button#buy', onBuy)],
      find,
      PAGE_HEIGHT,
    );
    expect(layers.get(sidebar)).toEqual([{ x: 60, y: 510, count: 1 }]);
    expect(layers.get(null)).toEqual([{ x: 360, y: 1020, count: 1 }]);
  });

  it('leaves out clicks whose element is missing instead of drawing them at their page position', () => {
    const layers = placeClicks(
      [anchor('a.renamed', { count: 2 }), anchor('nav.sticky', { fixed: true, count: 4 })],
      find,
      PAGE_HEIGHT,
    );
    expect(layers.size).toBe(0);
  });

  it('keeps the clicks it cannot place at their page position when asked to, except fixed ones', () => {
    const layers = placeClicks(
      [
        anchor('a.renamed', { x: 640, y: 900, count: 2 }),
        anchor('nav.sticky', { fixed: true, count: 4 }),
        anchor('button#buy', onBuy),
      ],
      find,
      PAGE_HEIGHT,
      { keepUnplaced: true },
    );
    expect(layers.get(null)).toEqual([
      { x: 640, y: 900, count: 2 },
      { x: 360, y: 1020, count: 1 },
    ]);
  });

  it('places clicks on the page itself by their page position', () => {
    const layers = placeClicks(
      [anchor('', { onPage: true, offsetX: 0, offsetY: 0, x: 640, y: 90 })],
      find,
      PAGE_HEIGHT,
    );
    expect(layers.get(null)).toEqual([{ x: 640, y: 90, count: 1 }]);
    expect(find).not.toHaveBeenCalled();
  });

  it('leaves out fixed clicks on the page itself', () => {
    const layers = placeClicks([anchor('', { onPage: true, fixed: true, count: 2 })], find, PAGE_HEIGHT);
    expect(layers.size).toBe(0);
  });

  it('looks each selector up once and measures each element once', () => {
    placeClicks(
      [anchor('button#buy', onBuy), anchor('button#buy', { ...onBuy, offsetX: 0.1 }), anchor('a.renamed')],
      find,
      PAGE_HEIGHT,
    );
    expect(find).toHaveBeenCalledTimes(2);
    expect(buy.locate).toHaveBeenCalledTimes(1);
  });

  describe('with look-alike elements', () => {
    // The same tabs in a card near the top and in a card further down that rendered after the click
    const topCard = candidate({ left: 20, top: 960, width: 110, height: 32 });
    const lowerCard = candidate({ left: 20, top: 2600, width: 110, height: 32 });
    const onTopCard = { x: 60, y: 944, relY: 944 / 3974 };

    it('gives clicks to the one clearly closest to where they were made', () => {
      const layers = placeClicks(
        [anchor('div > button', onTopCard)],
        () => [lowerCard, topCard],
        PAGE_HEIGHT,
      );
      expect(layers.get(null)).toEqual([{ x: 75, y: 976, count: 1 }]);
      expect(lowerCard.locate).not.toHaveBeenCalled();
    });

    it('leaves out clicks on ones too close together to tell apart', () => {
      const first = candidate({ left: 20, top: 900, width: 300, height: 40 });
      const second = candidate({ left: 20, top: 940, width: 300, height: 40 });
      const layers = placeClicks([anchor('li > a', { x: 60, y: 930, relY: 930 / PAGE_HEIGHT })], () => [first, second], PAGE_HEIGHT);
      expect(layers.size).toBe(0);
    });

    it('leaves out clicks whose only match is far from where they were made', () => {
      const layers = placeClicks([anchor('div > button', onTopCard)], () => [lowerCard], PAGE_HEIGHT);
      expect(layers.size).toBe(0);
    });

    it('leaves out fixed clicks on a repeated element, whose page position includes the scroll', () => {
      const layers = placeClicks([anchor('header a', { fixed: true, count: 3 })], () => [topCard, lowerCard], PAGE_HEIGHT);
      expect(layers.size).toBe(0);
    });
  });

  it('compares a match inside a scrolling part by the whole part, whose scroll the click position includes', () => {
    // A button 2000 px down a panel that scrolls in a 768 px window, clicked after scrolling the panel
    const panel = { part: 'panel' };
    const save = candidate<typeof panel>(
      { left: 0, top: 60, width: 1024, height: 708 },
      { host: panel, left: 20, top: 2000, width: 120, height: 40 },
    );
    const layers = placeClicks([anchor('main button.save', { x: 80, y: 320, relY: 320 / 768 })], () => [save], 768);
    expect(layers.get(panel)).toEqual([{ x: 80, y: 2020, count: 1 }]);
  });

  it('keeps a match that moved with the page height, or stayed while the page grew below it', () => {
    // Made 3200 px down a page that is 4000 px tall on this layout and was 6400 px for the visitor
    const stretched = candidate({ left: 20, top: 1990, width: 110, height: 32 });
    // Made 300 px down while the rest of the page was still loading
    const loading = candidate({ left: 20, top: 290, width: 110, height: 32 });
    const layers = placeClicks(
      [anchor('a.stretched', { x: 60, y: 3200, relY: 0.5 }), anchor('a.loading', { x: 60, y: 300, relY: 0.6 })],
      (selector) => (selector === 'a.stretched' ? [stretched] : [loading]),
      PAGE_HEIGHT,
    );
    expect(layers.get(null)).toEqual([
      { x: 75, y: 2006, count: 1 },
      { x: 75, y: 306, count: 1 },
    ]);
  });
});

describe('findInDocument', () => {
  it('locates an element in a fixed part from that part, whatever the page scroll', () => {
    const page = fakePage({ x: 0, y: 500 });
    const sidebar = page.el('ASIDE', page.body, { computed: { position: 'fixed' } });
    page.el('A', sidebar, { selector: 'a', box: { left: 20, top: 300, width: 100, height: 20 } });
    const located = page.find('a')[0].locate();
    expect(located.host).toBe(sidebar);
    expect(located).toMatchObject({ left: 20, top: 300, width: 100, height: 20 });
    expect(sidebar.style.setProperty).not.toHaveBeenCalled();
  });

  it('locates inside the innermost scrolling part, counting its border and scroll', () => {
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
    const located = page.find('a')[0].locate();
    expect(located.host).toBe(list);
    expect(located).toMatchObject({ left: 10, top: 259 });
    expect(list.style.setProperty).toHaveBeenCalledWith('position', 'relative', 'important');
    expect(list.style.setProperty).toHaveBeenCalledWith('inset', 'auto', 'important');
  });

  it('keeps an element on the page when nothing around it scrolls or stays put', () => {
    const page = fakePage({ x: 5, y: 500 });
    const box = page.el('DIV', page.body, { computed: { overflowY: 'auto' } });
    const field = page.el('TEXTAREA', box, { computed: { overflowY: 'auto' }, scrollHeight: 400 });
    page.el('SPAN', field, { selector: 'span', box: { left: 30, top: 40, width: 10, height: 10 } });
    const [found] = page.find('span');
    expect(found.area).toEqual({ left: 35, top: 540, width: 10, height: 10 });
    expect(found.locate()).toEqual({ host: null, left: 35, top: 540, width: 10, height: 10 });
  });

  it('stands in for a sticky table header with the cell the element is in', () => {
    const page = fakePage();
    const table = page.el('TABLE', page.body);
    const head = page.el('THEAD', table, { computed: { position: 'sticky' } });
    const row = page.el('TR', head);
    const cell = page.el('TH', row, { box: { left: 100, top: 0, width: 80, height: 30 } });
    page.el('SPAN', cell, { selector: 'span', computed: { display: 'inline' }, box: { left: 110, top: 5, width: 40, height: 20 } });
    const located = page.find('span')[0].locate();
    expect(located.host).toBe(cell);
    expect(located).toMatchObject({ left: 10, top: 5 });
  });

  it('leaves a sticky inline element without anything inside it on the page', () => {
    const page = fakePage();
    const label = page.el('SPAN', page.body, { computed: { position: 'sticky', display: 'inline' } });
    page.el('B', label, { selector: 'b', computed: { display: 'inline' } });
    expect(page.find('b')[0].locate().host).toBeNull();
  });

  it('finds every visible match, compared by the scrolling part it is in, and changes a part only for a located one', () => {
    const page = fakePage({ x: 0, y: 100 });
    const list = page.el('NAV', page.body, {
      computed: { overflowY: 'auto' },
      box: { left: 0, top: 0, width: 250, height: 400 },
      scrollHeight: 900,
      clientHeight: 400,
    });
    page.el('A', list, { selector: 'a', box: { left: 0, top: 10, width: 50, height: 20 } });
    page.el('A', page.body, { selector: 'a', box: { left: 0, top: 700, width: 50, height: 20 } });
    page.el('A', page.body, { selector: 'a', box: { left: 0, top: 0, width: 0, height: 0 } });
    const found = page.find('a');
    expect(found.map((match) => match.area.top)).toEqual([100, 800]);
    expect(list.style.setProperty).not.toHaveBeenCalled();
    found[0].locate();
    expect(list.style.setProperty).toHaveBeenCalledWith('position', 'relative', 'important');
  });

  it('compares by the outermost scrolling part, or by the body when it scrolls in place of the page', () => {
    const page = fakePage();
    const panel = page.el('MAIN', page.body, {
      computed: { overflowY: 'auto' },
      box: { left: 0, top: 50, width: 800, height: 700 },
      scrollHeight: 3000,
      clientHeight: 700,
    });
    const list = page.el('UL', panel, {
      computed: { overflowY: 'auto' },
      box: { left: 10, top: 900, width: 300, height: 200 },
      scrollHeight: 800,
      clientHeight: 200,
    });
    page.el('LI', list, { selector: 'li', box: { left: 10, top: 950, width: 300, height: 20 } });
    expect(page.find('li')[0].area).toEqual({ left: 0, top: 50, width: 800, height: 700 });

    const shell = fakePage();
    Object.assign(shell.body, { box: { left: 0, top: 0, width: 1000, height: 800 }, scrollHeight: 3000, clientHeight: 800 });
    shell.body.computed.overflowY = 'auto';
    shell.el('BUTTON', shell.body, { selector: 'button', box: { left: 20, top: 2400, width: 80, height: 30 } });
    expect(shell.find('button')[0].area).toEqual({ left: 0, top: 0, width: 1000, height: 800 });
  });

  it('finds nothing for missing or invalid selectors, or ones matching too many elements', () => {
    const page = fakePage();
    for (let i = 0; i < 21; i++) page.el('LI', page.body, { selector: 'li' });
    expect(page.find('li')).toEqual([]);
    expect(page.find('nav')).toEqual([]);
    expect(page.find('> a')).toEqual([]);
  });
});

describe('findInFrame', () => {
  const page = { width: 1440, height: 1732 };
  // A button in a centered 1100 px column of the 1440 px frame
  const box = { left: 194, top: 1158, width: 120, height: 48 };

  it('finds the elements the frame reported, located on the page itself', () => {
    const area = { left: 170, top: 1100, width: 1100, height: 200 };
    const find = findInFrame(new Map([['button#plan-a', [{ box, area }]]]), page);
    const [found] = find('button#plan-a');
    expect(found.area).toEqual(area);
    expect(found.locate()).toEqual({ host: null, ...box });
    expect(find('button#gone')).toEqual([]);
  });

  it('puts a click from a wider and taller window on its element in the frame', () => {
    // Made at 594,1358 in a 1905 x 1080 window on a 1927 px page; the x is scaled to the frame
    const find = findInFrame(new Map([['button#plan-a', [{ box, area: box }]]]), page);
    const layers = placeClicks(
      [anchor('button#plan-a', { x: 449, y: 1358, relY: 1358 / 1927 })],
      find,
      page.height,
      { keepUnplaced: true },
    );
    expect(layers.get(null)).toEqual([{ x: 254, y: 1182, count: 1 }]);
  });

  it('keeps the page position of a click whose element reaches outside the drawn page', () => {
    // The next slide of a carousel, laid out past the frame's right edge
    const slide = { left: 1500, top: 300, width: 1440, height: 600 };
    const find = findInFrame(new Map([['div.slide > a', [{ box: slide, area: slide }]]]), page);
    expect(find('div.slide > a')).toEqual([]);
    const layers = placeClicks([anchor('div.slide > a', { x: 700, y: 640, relY: 640 / 1927 })], find, page.height, {
      keepUnplaced: true,
    });
    expect(layers.get(null)).toEqual([{ x: 700, y: 640, count: 1 }]);
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
