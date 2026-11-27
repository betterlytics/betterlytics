import type { HeatmapClickAnchor, HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';

export type ElementBox = { left: number; top: number; width: number; height: number };

/** An element's box inside the host it moves with, or on the page when the host is null */
export type LocatedElement<Host> = ElementBox & { host: Host | null };

/**
 * An element a selector matches: the box on the page its clicks were made in, and how to locate it
 * where heat is drawn. The box is the element's own, or that of the scrolling part it sits in,
 * since a recorded page position includes the visitor's scroll inside that part.
 */
export type Candidate<Host> = { area: ElementBox; locate: () => LocatedElement<Host> };

/** Points per host, with the page's points under null */
export type PlacedClicks<Host> = Map<Host | null, HeatmapClickPoint[]>;

// A look-alike is only picked when every other one is at least this many times farther from where
// the clicks were made, and at least that many times CLOSE_PX
const SEPARATION = 3;
const CLOSE_PX = 50;

// Layouts drift between window widths and visits; a match farther than this share of the page's
// height from where its clicks were made is taken to be another element with the same selector
const MAX_DRIFT = 0.25;

/**
 * Puts each click on its element, by its offset inside it. When the selector matches several
 * elements, the one clearly closest to where the clicks were made gets them. Clicks whose element
 * is missing, can't be told apart from look-alikes, or sits far from where they were made are left
 * out: at their page position they would land on whatever this layout has there. With
 * `keepUnplaced` they are drawn at their page position anyway, for the live page, where no click
 * should go missing. Clicks on the page itself have no element and are drawn at their page
 * position, unless they were on a fixed part, whose page position includes the scroll.
 */
export function placeClicks<Host>(
  anchors: HeatmapClickAnchor[],
  find: (selector: string) => Candidate<Host>[],
  pageHeight: number,
  { keepUnplaced = false }: { keepUnplaced?: boolean } = {},
): PlacedClicks<Host> {
  const found = new Map<string, Candidate<Host>[]>();
  const located = new Map<Candidate<Host>, LocatedElement<Host>>();
  const layers: PlacedClicks<Host> = new Map();

  const add = (host: Host | null, point: HeatmapClickPoint) => {
    const points = layers.get(host);
    if (points) points.push(point);
    else layers.set(host, [point]);
  };

  for (const anchor of anchors) {
    if (anchor.onPage) {
      if (!anchor.fixed) add(null, { x: anchor.x, y: anchor.y, count: anchor.count });
      continue;
    }
    let candidates = found.get(anchor.selector);
    if (!candidates) {
      candidates = find(anchor.selector);
      found.set(anchor.selector, candidates);
    }
    const candidate = pick(candidates, anchor, pageHeight);
    if (!candidate) {
      if (keepUnplaced && !anchor.fixed) add(null, { x: anchor.x, y: anchor.y, count: anchor.count });
      continue;
    }
    let box = located.get(candidate);
    if (!box) {
      box = candidate.locate();
      located.set(candidate, box);
    }
    add(box.host, {
      x: box.left + anchor.offsetX * box.width,
      y: box.top + anchor.offsetY * box.height,
      count: anchor.count,
    });
  }

  return layers;
}

function pick<Host>(candidates: Candidate<Host>[], anchor: HeatmapClickAnchor, pageHeight: number) {
  // A fixed element's page position includes the visitor's scroll, so it can't be compared
  if (anchor.fixed) return candidates.length === 1 ? candidates[0] : null;
  const [best, next] = candidates
    .map((candidate) => ({ candidate, distance: distanceTo(candidate.area, anchor, pageHeight) }))
    .sort((a, b) => a.distance - b.distance);
  if (!best || verticalDistanceTo(best.candidate.area, anchor, pageHeight) > MAX_DRIFT * pageHeight) return null;
  if (next && next.distance < SEPARATION * Math.max(best.distance, CLOSE_PX)) return null;
  return best.candidate;
}

function distanceTo(box: ElementBox, anchor: HeatmapClickAnchor, pageHeight: number) {
  return Math.hypot(gap(anchor.x, box.left, box.width), verticalDistanceTo(box, anchor, pageHeight));
}

// From where the clicks were made, as recorded or scaled to this page's height, whichever is
// closer: content that loads below the clicks later moves neither, a page that is taller at this
// width moves both
function verticalDistanceTo(box: ElementBox, anchor: HeatmapClickAnchor, pageHeight: number) {
  return Math.min(gap(anchor.y, box.top, box.height), gap(anchor.relY * pageHeight, box.top, box.height));
}

// Distance from a position to a span, zero inside it
function gap(position: number, start: number, size: number) {
  return Math.max(start - position, position - (start + size), 0);
}

// A selector that matches more elements than this was made on a very different page
const MAX_CANDIDATES = 20;

/**
 * Finds a selector's elements in a rendered page, each with the box on the page its clicks were
 * made in. An element inside a fixed, sticky or scrolling part is located from that part's content
 * corner, so heat drawn inside the part stays on it. A static part is made positioned before the
 * element is located, so a layer inside it is placed against it; only an element that gets clicks
 * is located. static/capture.js finds elements on the live page by the same rules, minus the ones
 * cut off by a part around them, since heat is drawn on the page itself there.
 */
export function findInDocument(doc: Document): (selector: string) => Candidate<HTMLElement>[] {
  const view = doc.defaultView;
  return (selector) => {
    let matches: NodeListOf<Element>;
    try {
      matches = doc.querySelectorAll(selector);
    } catch {
      return [];
    }
    if (matches.length > MAX_CANDIDATES) return [];
    const candidates: Candidate<HTMLElement>[] = [];
    for (const element of Array.from(matches)) {
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;
      const box = onPage(rect, view);
      const scroller = view ? scrollingArea(element, view) : null;
      candidates.push({
        area: scroller ? onPage(scroller.getBoundingClientRect(), view) : box,
        locate: () => locate(element, view, box),
      });
    }
    return candidates;
  };
}

/** An element the framed live page found: its box on the page, and the area its clicks are compared with */
export type FrameElement = { box: ElementBox; area: ElementBox };

/**
 * Finds a selector's elements among those the framed live page reported. The frame leaves out
 * elements in fixed or sticky parts and ones cut off by a part around them, so every one is
 * located on the page itself. One that doesn't fit inside the drawn page finds nothing, so its
 * clicks keep their page position instead of being drawn where they can't be seen.
 */
export function findInFrame(
  found: ReadonlyMap<string, FrameElement[]>,
  page: { width: number; height: number },
): (selector: string) => Candidate<never>[] {
  return (selector) =>
    (found.get(selector) ?? [])
      .filter(
        ({ box }) =>
          box.left >= 0 && box.top >= 0 && box.left + box.width <= page.width && box.top + box.height <= page.height,
      )
      .map(({ box, area }) => ({ area, locate: () => ({ host: null, ...box }) }));
}

function onPage(rect: ElementBox, view: Window | null): ElementBox {
  return {
    left: rect.left + (view?.scrollX ?? 0),
    top: rect.top + (view?.scrollY ?? 0),
    width: rect.width,
    height: rect.height,
  };
}

function locate(element: Element, view: Window | null, page: ElementBox): LocatedElement<HTMLElement> {
  const host = view ? hostOf(element, view) : null;
  if (!host) return { host: null, ...page };
  if (view?.getComputedStyle(host).position === 'static') {
    host.style.setProperty('position', 'relative', 'important');
    host.style.setProperty('inset', 'auto', 'important');
  }
  const rect = element.getBoundingClientRect();
  const hostRect = host.getBoundingClientRect();
  return {
    host,
    left: rect.left - hostRect.left - host.clientLeft + host.scrollLeft,
    top: rect.top - hostRect.top - host.clientTop + host.scrollTop,
    width: rect.width,
    height: rect.height,
  };
}

const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

const SCROLLING_OVERFLOW = new Set(['auto', 'scroll', 'overlay']);

// Children of these don't show, or would be laid out as table cells
const CANNOT_HOST = new Set([
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'IMG',
  'VIDEO',
  'AUDIO',
  'CANVAS',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'TABLE',
  'THEAD',
  'TBODY',
  'TFOOT',
  'TR',
]);

/**
 * The closest part that moves apart from the page: a fixed or sticky element, or one scrolling
 * its own content. A fixed or sticky part that can't hold heat, a sticky table header say, is
 * stood in for by the outermost element inside it on the way up, which moves with it. The page
 * is null, which is also where a fixed or sticky image ends up, having nothing inside it.
 */
function hostOf(element: Element, view: Window): HTMLElement | null {
  const { body, documentElement } = element.ownerDocument;
  let inside: HTMLElement | null = null;
  for (let el: Element | null = element; el && el !== body && el !== documentElement; el = el.parentElement) {
    const style = view.getComputedStyle(el);
    const canHost = canHostHeat(el, style);
    if (style.position === 'fixed' || style.position === 'sticky') return canHost ? (el as HTMLElement) : inside;
    if (!canHost) continue;
    if (scrollsOwnContent(el, style)) return el as HTMLElement;
    inside = el as HTMLElement;
  }
  return null;
}

/**
 * The outermost part around an element that scrolls its own content, or the body when it scrolls
 * in place of the page. A position recorded inside it includes the visitor's scroll there, so only
 * the part as a whole can be compared with it.
 */
function scrollingArea(element: Element, view: Window): Element | null {
  const { body, documentElement } = element.ownerDocument;
  const pageScrolls = documentElement.scrollHeight > documentElement.clientHeight;
  if (body && !pageScrolls && scrollsOwnContent(body, view.getComputedStyle(body))) return body;
  let area: Element | null = null;
  for (let el = element.parentElement; el && el !== body && el !== documentElement; el = el.parentElement) {
    const style = view.getComputedStyle(el);
    if (canHostHeat(el, style) && scrollsOwnContent(el, style)) area = el;
  }
  return area;
}

function canHostHeat(el: Element, style: CSSStyleDeclaration) {
  return (
    el.namespaceURI === XHTML_NAMESPACE &&
    !CANNOT_HOST.has(el.tagName) &&
    style.display !== 'inline' &&
    style.display !== 'contents'
  );
}

function scrollsOwnContent(el: Element, style: CSSStyleDeclaration) {
  return (
    (SCROLLING_OVERFLOW.has(style.overflowY) && el.scrollHeight > el.clientHeight) ||
    (SCROLLING_OVERFLOW.has(style.overflowX) && el.scrollWidth > el.clientWidth)
  );
}
