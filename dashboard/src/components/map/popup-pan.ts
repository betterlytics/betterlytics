export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type Rect = { top: number; right: number; bottom: number; left: number };
export type Overlay = { edge: Edge; rect: Rect };
export type Offset = { x: number; y: number };

const GAP = 8;
const MAX_PASSES = 3;
const EDGES: readonly Edge[] = ['top', 'right', 'bottom', 'left'];

const isEdge = (value: string | undefined): value is Edge => EDGES.includes(value as Edge);

const shift = (rect: Rect, { x, y }: Offset): Rect => ({
  top: rect.top - y,
  bottom: rect.bottom - y,
  left: rect.left - x,
  right: rect.right - x,
});

const overlapsX = (a: Rect, b: Rect) => a.left < b.right + GAP && a.right > b.left - GAP;
const overlapsY = (a: Rect, b: Rect) => a.top < b.bottom + GAP && a.bottom > b.top - GAP;
const intersects = (a: Rect, b: Rect) => overlapsX(a, b) && overlapsY(a, b);

const depthOf = (edge: Edge, container: Rect, rect: Rect) => {
  switch (edge) {
    case 'top':
      return rect.bottom - container.top;
    case 'bottom':
      return container.bottom - rect.top;
    case 'left':
      return rect.right - container.left;
    case 'right':
      return container.right - rect.left;
  }
};

// Only overlays in the popup's way count
const padding = (edge: Edge, popup: Rect, container: Rect, overlays: Overlay[]) => {
  const horizontal = edge === 'top' || edge === 'bottom';
  const depths = overlays
    .filter((o) => o.edge === edge && intersects(o.rect, container))
    .filter((o) => (horizontal ? overlapsX(popup, o.rect) : overlapsY(popup, o.rect)))
    .map((o) => depthOf(edge, container, o.rect));
  return Math.max(0, ...depths) + GAP;
};

function singlePass(popup: Rect, container: Rect, overlays: Overlay[]): Offset {
  const width = container.right - container.left;
  const height = container.bottom - container.top;
  const x = popup.left - container.left;
  const y = popup.top - container.top;
  const popupWidth = popup.right - popup.left;
  const popupHeight = popup.bottom - popup.top;
  const pad = (edge: Edge) => padding(edge, popup, container, overlays);

  let dx = 0;
  let dy = 0;
  if (x + popupWidth + pad('right') > width) dx = x + popupWidth - width + pad('right');
  if (x - dx - pad('left') < 0) dx = x - pad('left');
  if (y + popupHeight + pad('bottom') > height) dy = y + popupHeight - height + pad('bottom');
  if (y - dy - pad('top') < 0) dy = y - pad('top');
  return { x: Math.round(dx), y: Math.round(dy) };
}

// A pan can move the popup into another overlay's way
export function popupPanOffset(popup: Rect, container: Rect, overlays: Overlay[]): Offset {
  let total = { x: 0, y: 0 };
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    const step = singlePass(shift(popup, total), container, overlays);
    if (!step.x && !step.y) break;
    total = { x: total.x + step.x, y: total.y + step.y };
  }
  return total;
}

export function parseCssLength(value: string, rootFontSize: number): number {
  const match = /^\s*(-?[\d.]+)(px|rem)?\s*$/.exec(value);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2] === 'rem' ? amount * rootFontSize : amount;
}

export function sidebarOverlay(sidebarOffset: number): Overlay {
  return { edge: 'left', rect: { top: -Infinity, bottom: Infinity, left: -Infinity, right: sidebarOffset } };
}

export function measureOverlays(container: HTMLElement): Overlay[] {
  const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-map-overlay]')).flatMap((element) => {
    const edge = element.dataset.mapOverlay;
    return isEdge(edge) ? [{ edge, rect: element.getBoundingClientRect() }] : [];
  });
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const sidebarOffset = parseCssLength(
    getComputedStyle(container).getPropertyValue('--sidebar-offset'),
    rootFontSize,
  );
  return sidebarOffset > 0 ? [...marked, sidebarOverlay(sidebarOffset)] : marked;
}

// The tip sits in the popup's bottom margin
export function measurePopup(element: HTMLElement): Rect {
  const rect = element.getBoundingClientRect();
  const marginBottom = parseFloat(getComputedStyle(element).marginBottom) || 0;
  return { top: rect.top, left: rect.left, right: rect.right, bottom: rect.bottom + marginBottom };
}
