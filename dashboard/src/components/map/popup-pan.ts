export type Edge = 'top' | 'right' | 'bottom' | 'left';
export type EdgePadding = Record<Edge, number>;
export type Rect = { top: number; right: number; bottom: number; left: number };
export type Overlay = { edge: Edge; rect: Rect };

const OVERLAY_GAP = 8;
const EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

const intersects = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const intrusion = (container: Rect, { edge, rect }: Overlay) => {
  if (!intersects(container, rect)) return 0;
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

// How far each edge of the map is covered by fixed UI, so a popup can be kept clear of it
export function paddingFromOverlays(container: Rect, overlays: Overlay[], sidebarOffset: number): EdgePadding {
  const sidebar = Math.max(0, sidebarOffset - container.left);
  return Object.fromEntries(
    EDGES.map((edge) => {
      const covered = overlays.filter((o) => o.edge === edge).map((o) => intrusion(container, o));
      return [edge, Math.max(edge === 'left' ? sidebar : 0, ...covered) + OVERLAY_GAP];
    }),
  ) as EdgePadding;
}

// Same rule as Leaflet's popup autopan, with per-edge padding
export function popupPanOffset(popup: Rect, container: Rect, padding: EdgePadding): { x: number; y: number } {
  const width = container.right - container.left;
  const height = container.bottom - container.top;
  const x = popup.left - container.left;
  const y = popup.top - container.top;
  const popupWidth = popup.right - popup.left;
  const popupHeight = popup.bottom - popup.top;

  let dx = 0;
  let dy = 0;
  if (x + popupWidth + padding.right > width) dx = x + popupWidth - width + padding.right;
  if (x - dx - padding.left < 0) dx = x - padding.left;
  if (y + popupHeight + padding.bottom > height) dy = y + popupHeight - height + padding.bottom;
  if (y - dy - padding.top < 0) dy = y - padding.top;
  return { x: Math.round(dx), y: Math.round(dy) };
}

export function parseCssLength(value: string, rootFontSize: number): number {
  const match = /^\s*(-?[\d.]+)(px|rem)?\s*$/.exec(value);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2] === 'rem' ? amount * rootFontSize : amount;
}

export function measureOverlayPadding(container: HTMLElement): EdgePadding {
  const overlays = Array.from(document.querySelectorAll<HTMLElement>('[data-map-overlay]')).map((element) => ({
    edge: element.dataset.mapOverlay as Edge,
    rect: element.getBoundingClientRect(),
  }));
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const sidebarOffset = parseCssLength(
    getComputedStyle(container).getPropertyValue('--sidebar-offset'),
    rootFontSize,
  );
  return paddingFromOverlays(container.getBoundingClientRect(), overlays, sidebarOffset);
}
