import { EventType, type eventWithTime } from '@rrweb/types';

// Every click reports the document height, so a median this far from the capture's suggests
// the page changed since it was captured
const PAGE_CHANGED_RATIO = 0.15;

type CapturedPage = { path: string; documentHeight: number };

/**
 * Whether the clicks since a capture suggest the page changed. A grouped page path compares one
 * real page with the whole group, and a page that fits its window reports the window's height,
 * so neither can tell.
 */
export function pageChangedSinceCapture(
  capture: CapturedPage,
  captureWindowHeight: number | undefined,
  pageHeight: number | null | undefined,
): boolean {
  if (typeof pageHeight !== 'number' || captureWindowHeight === undefined) return false;
  if (capture.path.includes('*')) return false;
  if (capture.documentHeight <= captureWindowHeight * (1 + PAGE_CHANGED_RATIO)) return false;
  return Math.abs(pageHeight - capture.documentHeight) > capture.documentHeight * PAGE_CHANGED_RATIO;
}

/** The window height the snapshot was taken at, from its Meta event */
export function snapshotWindowHeight(events: eventWithTime[] | undefined): number | undefined {
  for (const event of events ?? []) {
    if (event.type === EventType.Meta) return event.data.height;
  }
  return undefined;
}
