import { z } from 'zod';

export const EventOccurrenceAggregate = z.object({
  event_name: z.string(),
  count: z.number(),
  unique_users: z.number(),
  last_seen: z.date(),
  avg_per_user: z.number(),
});

export const RawEventPropertySummaryRowSchema = z.object({
  key: z.string(),
  value: z.string(),
  count: z.number(),
  total_occurrences: z.number(),
  unique_value_count: z.number(),
});

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
  properties: z.array(EventPropertyAnalyticsSchema),
  maxValues: z.number(),
});

export const RawEventPropertyValueRowSchema = z.object({
  value: z.string(),
  count: z.number(),
  total_occurrences: z.number(),
  unique_value_count: z.number(),
});

export const EventPropertyValuesSchema = z.object({
  propertyName: z.string(),
  uniqueValueCount: z.number(),
  totalOccurrences: z.number(),
  values: z.array(EventPropertyValueAggregateSchema),
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

export type RawEventPropertySummaryRow = z.infer<typeof RawEventPropertySummaryRowSchema>;
export type RawEventPropertyValueRow = z.infer<typeof RawEventPropertyValueRowSchema>;
export type EventPropertyValues = z.infer<typeof EventPropertyValuesSchema>;
export type EventTypeRow = z.infer<typeof EventOccurrenceAggregate>;
export type EventPropertyValue = z.infer<typeof EventPropertyValueAggregateSchema>;
export type EventPropertyAnalytics = z.infer<typeof EventPropertyAnalyticsSchema>;
export type EventPropertiesOverview = z.infer<typeof EventPropertiesOverviewSchema>;
export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;
