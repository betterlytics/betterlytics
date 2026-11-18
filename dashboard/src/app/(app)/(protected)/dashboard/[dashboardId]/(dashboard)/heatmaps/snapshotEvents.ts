import { EventType, type eventWithTime } from '@rrweb/types';

// Changes right after a snapshot are applied too: an in-app navigation snapshots the page
// before the new route has rendered, and lazy content arrives just after load
export const SNAPSHOT_SETTLE_MS = 3000;

/** A full snapshot with its Meta, plus what changed in the moments after it, up to the next page */
export function snapshotEvents(events: eventWithTime[], snapshotMs: number): eventWithTime[] | null {
  let start = events.findIndex((event) => event.type === EventType.Meta && event.timestamp === snapshotMs);
  if (start === -1) start = events.findIndex((event) => event.type === EventType.Meta);
  if (start === -1 || events[start + 1]?.type !== EventType.FullSnapshot) return null;

  const until = events[start].timestamp + SNAPSHOT_SETTLE_MS;
  const slice = events.slice(start, start + 2);
  for (const event of events.slice(start + 2)) {
    if (event.type === EventType.Meta || event.timestamp > until) break;
    slice.push(event);
  }
  return slice;
}
