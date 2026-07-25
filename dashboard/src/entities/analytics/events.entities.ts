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
