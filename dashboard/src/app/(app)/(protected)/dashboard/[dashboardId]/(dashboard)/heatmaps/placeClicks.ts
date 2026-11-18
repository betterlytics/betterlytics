import type { HeatmapClickAnchor, HeatmapClickPoint } from '@/entities/analytics/clickHeatmap.entities';

export type ElementBox = { left: number; top: number; width: number; height: number };

export type PlacedClicks = { points: HeatmapClickPoint[]; unplacedFixed: number };

/**
 * Puts each click on its element when the selector finds exactly one element with a size,
 * otherwise at its page position. Fixed and sticky clicks have no usable page position (it
 * includes the scroll), so without their element they are only counted.
 */
export function placeClicks(
  anchors: HeatmapClickAnchor[],
  locate: (selector: string) => ElementBox | null,
): PlacedClicks {
  const boxes = new Map<string, ElementBox | null>();
  const points: HeatmapClickPoint[] = [];
  let unplacedFixed = 0;

  for (const anchor of anchors) {
    let box = boxes.get(anchor.selector);
    if (box === undefined) {
      box = locate(anchor.selector);
      boxes.set(anchor.selector, box);
    }
    if (box) {
      points.push({
        x: box.left + anchor.offsetX * box.width,
        y: box.top + anchor.offsetY * box.height,
        count: anchor.count,
      });
    } else if (anchor.fixed) {
      unplacedFixed += anchor.count;
    } else {
      points.push({ x: anchor.x, y: anchor.y, count: anchor.count });
    }
  }

  return { points, unplacedFixed };
}

/** Finds a selector's element in a rendered page, in page coordinates */
export function locateInDocument(doc: Document): (selector: string) => ElementBox | null {
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
    return {
      left: rect.left + (view?.scrollX ?? 0),
      top: rect.top + (view?.scrollY ?? 0),
      width: rect.width,
      height: rect.height,
    };
  };
}
