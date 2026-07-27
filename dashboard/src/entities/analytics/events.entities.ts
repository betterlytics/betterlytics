import { z } from 'zod';

export const EventOccurrenceAggregate = z.object({
  event_name: z.string(),
  count: z.number(),
  unique_users: z.number(),
  last_seen: z.date(),
  avg_per_user: z.number(),
});

export const RawEventPropertyDataSchema = z.object({
  custom_event_json: z.string(),
});

export const RawEventPropertyDataArraySchema = z.array(RawEventPropertyDataSchema);

export const EventPropertyValueAggregateSchema = z.object({
  value: z.string(),
  count: z.number(),
  relativePercentage: z.number(),
  percentage: z.number(),
});

export const EventPropertyAnalyticsSchema = z.object({
  propertyName: z.string(),
  uniqueValueCount: z.number(),
  totalOccurrences: z.number(),
  topValues: z.array(EventPropertyValueAggregateSchema),
});

export const EventPropertiesOverviewSchema = z.object({
  eventName: z.string(),
  totalEvents: z.number(),
  properties: z.array(EventPropertyAnalyticsSchema),
});

export const EventLogEntrySchema = z.object({
  timestamp: z.date(),
  event_name: z.string(),
  visitor_id: z.string(),
  url: z.string(),
  custom_event_json: z.string(),
  country_code: z.string(),
  device_type: z.string(),
  browser: z.string(),
});

export const EventLogCursorSchema = z.object({
  timestamp: z.date(),
  skip: z.number().int().min(0),
});

export type RawEventPropertyData = z.infer<typeof RawEventPropertyDataSchema>;
export type EventTypeRow = z.infer<typeof EventOccurrenceAggregate>;
export type EventPropertyValue = z.infer<typeof EventPropertyValueAggregateSchema>;
export type EventPropertyAnalytics = z.infer<typeof EventPropertyAnalyticsSchema>;
export type EventPropertiesOverview = z.infer<typeof EventPropertiesOverviewSchema>;
export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;
export type EventLogCursor = z.infer<typeof EventLogCursorSchema>;

export type EventLogPage = {
  events: EventLogEntry[];
  nextCursor: EventLogCursor | null;
};

/**
 * Next cursor = last row's timestamp + how many delivered rows share that exact
 * second (timestamps are second-precision and rows have no unique id, so the next
 * page re-queries `timestamp <= ts` and skips the rows already delivered).
 */
export function computeNextEventLogCursor(
  events: EventLogEntry[],
  cursor: EventLogCursor | null,
  limit: number,
): EventLogCursor | null {
  if (events.length < limit) return null;
  const last = events[events.length - 1];
  let skip = events.filter((e) => e.timestamp.getTime() === last.timestamp.getTime()).length;
  if (cursor && cursor.timestamp.getTime() === last.timestamp.getTime()) {
    skip += cursor.skip;
  }
  return { timestamp: last.timestamp, skip };
}

const eventContentKey = (e: EventLogEntry) =>
  JSON.stringify([e.event_name, e.visitor_id, e.url, e.custom_event_json, e.country_code, e.device_type, e.browser]);

/**
 * The live poll queries `timestamp >= since` (a strict `>` would permanently drop
 * rows landing in the boundary second after it was read), so already-held boundary
 * rows come back again. Rows have no id, but identical rows are interchangeable and
 * the table is append-only, so subtracting held content-counts from the fetched
 * boundary second yields exactly the new rows.
 */
export function subtractHeldBoundaryEvents(
  fetched: EventLogEntry[],
  held: EventLogEntry[],
  since: Date,
): EventLogEntry[] {
  const boundary = since.getTime();
  const heldCounts = new Map<string, number>();
  for (const e of held) {
    if (e.timestamp.getTime() !== boundary) continue;
    const key = eventContentKey(e);
    heldCounts.set(key, (heldCounts.get(key) ?? 0) + 1);
  }
  return fetched.filter((e) => {
    if (e.timestamp.getTime() !== boundary) return true;
    const key = eventContentKey(e);
    const count = heldCounts.get(key) ?? 0;
    if (count === 0) return true;
    heldCounts.set(key, count - 1);
    return false;
  });
}
