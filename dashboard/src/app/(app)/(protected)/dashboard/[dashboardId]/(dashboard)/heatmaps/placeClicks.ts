import type { HeatmapClickAnchor, HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';

export type ElementBox = { left: number; top: number; width: number; height: number };

/** An element's box inside the host it moves with, or on the page when the host is null */
export type LocatedElement<Host> = ElementBox & { host: Host | null };

/** Points per host, with the page's points under null */
export type PlacedClicks<Host> = { layers: Map<Host | null, HeatmapClickPoint[]>; unplacedFixed: number };

/**
 * Puts each click on its element when the selector finds exactly one element with a size,
 * otherwise at its page position. Fixed and sticky clicks have no usable page position (it
 * includes the scroll), so without their element they are only counted. An empty selector is
 * a click on the page itself, placed by its page position.
 */
export function placeClicks<Host>(
  anchors: HeatmapClickAnchor[],
  locate: (selector: string) => LocatedElement<Host> | null,
): PlacedClicks<Host> {
  const boxes = new Map<string, LocatedElement<Host> | null>();
  const layers = new Map<Host | null, HeatmapClickPoint[]>();
  let unplacedFixed = 0;

  const add = (host: Host | null, point: HeatmapClickPoint) => {
    const points = layers.get(host);
    if (points) points.push(point);
    else layers.set(host, [point]);
  };

  for (const anchor of anchors) {
    let box = boxes.get(anchor.selector);
    if (box === undefined) {
      box = anchor.selector ? locate(anchor.selector) : null;
      boxes.set(anchor.selector, box);
    }
    if (box) {
      add(box.host, {
        x: box.left + anchor.offsetX * box.width,
        y: box.top + anchor.offsetY * box.height,
        count: anchor.count,
      });
    } else if (anchor.fixed) {
      unplacedFixed += anchor.count;
    } else {
      add(null, { x: anchor.x, y: anchor.y, count: anchor.count });
    }
  }

  return { layers, unplacedFixed };
}

/**
 * Finds a selector's element in a rendered page. An element inside a fixed, sticky or scrolling
 * part is measured from that part's content corner, so heat drawn inside the part stays on it.
 */
export function locateInDocument(doc: Document): (selector: string) => LocatedElement<HTMLElement> | null {
  const view = doc.defaultView;
  return (selector) => {
    let matches: NodeListOf<Element>;
    try {
      matches = doc.querySelectorAll(selector);
    } catch {
      return null;
    }
    if (matches.length !== 1) return null;
    const rect = matches[0].getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const host = view ? hostOf(matches[0], view) : null;
    if (!host) {
      return {
        host: null,
        left: rect.left + (view?.scrollX ?? 0),
        top: rect.top + (view?.scrollY ?? 0),
        width: rect.width,
        height: rect.height,
      };
    }
    const hostRect = host.getBoundingClientRect();
    return {
      host,
      left: rect.left - hostRect.left - host.clientLeft + host.scrollLeft,
      top: rect.top - hostRect.top - host.clientTop + host.scrollTop,
      width: rect.width,
      height: rect.height,
    };
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

// The closest part that moves apart from the page: a fixed or sticky element, or one scrolling
// its own content. The page itself is null.
function hostOf(element: Element, view: Window): HTMLElement | null {
  const { body, documentElement } = element.ownerDocument;
  for (let el: Element | null = element; el && el !== body && el !== documentElement; el = el.parentElement) {
    if (el.namespaceURI !== XHTML_NAMESPACE || CANNOT_HOST.has(el.tagName)) continue;
    const style = view.getComputedStyle(el);
    if (style.display === 'inline' || style.display === 'contents') continue;
    if (style.position === 'fixed' || style.position === 'sticky') return el as HTMLElement;
    const scrollsY = SCROLLING_OVERFLOW.has(style.overflowY) && el.scrollHeight > el.clientHeight;
    const scrollsX = SCROLLING_OVERFLOW.has(style.overflowX) && el.scrollWidth > el.clientWidth;
    if (scrollsY || scrollsX) return el as HTMLElement;
  }
  return null;
}
