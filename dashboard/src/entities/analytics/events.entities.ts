import { z } from 'zod';

export const EventOccurrenceAggregate = z.object({
  event_name: z.string(),
  count: z.coerce.number(),
  unique_users: z.coerce.number(),
  last_seen: z.date(),
  avg_per_user: z.coerce.number(),
});

export const RawEventPropertyDataSchema = z.object({
  custom_event_json: z.string(),
});

export const RawEventPropertyDataArraySchema = z.array(RawEventPropertyDataSchema);

export const EventPropertyValueAggregateSchema = z.object({
  value: z.string(),
  count: z.coerce.number(),
  relativePercentage: z.coerce.number(),
  percentage: z.coerce.number(),
});

export const EventPropertyAnalyticsSchema = z.object({
  propertyName: z.string(),
  uniqueValueCount: z.coerce.number(),
  totalOccurrences: z.coerce.number(),
  topValues: z.array(EventPropertyValueAggregateSchema),
});

export const EventPropertiesOverviewSchema = z.object({
  eventName: z.string(),
  totalEvents: z.coerce.number(),
  properties: z.array(EventPropertyAnalyticsSchema),
});

export const EventLogEntrySchema = z.object({
  timestamp: z.date(),
  event_name: z.string(),
  visitor_id: z.string(),
  url: z.string(),
  custom_event_json: z.string(),
  country_code: z.string().nullable(),
  device_type: z.string(),
  browser: z.string(),
});

export type RawEventPropertyData = z.infer<typeof RawEventPropertyDataSchema>;
export type EventTypeRow = z.infer<typeof EventOccurrenceAggregate>;
export type EventPropertyValue = z.infer<typeof EventPropertyValueAggregateSchema>;
export type EventPropertyAnalytics = z.infer<typeof EventPropertyAnalyticsSchema>;
export type EventPropertiesOverview = z.infer<typeof EventPropertiesOverviewSchema>;
export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;
