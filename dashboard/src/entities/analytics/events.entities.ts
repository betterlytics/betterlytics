import { z } from 'zod';
import { createSortConfigSchema, type SortConfig } from '@/entities/pagination.entities';
import type { FieldToColumnMap } from '@/lib/cursor-pagination';

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

/**
 * Event log sort field definitions for cursor pagination
 * Uses timestamp as primary sort with visitor_id as tie-breaker for deterministic ordering
 */
export const EVENT_LOG_SORT_FIELDS = ['timestamp', 'visitorId'] as const;

export const EventLogSortFieldSchema = z.enum(EVENT_LOG_SORT_FIELDS);
export type EventLogSortField = z.infer<typeof EventLogSortFieldSchema>;

export const EventLogSortConfigSchema = createSortConfigSchema(EVENT_LOG_SORT_FIELDS);
export type EventLogSortConfig = SortConfig<EventLogSortField>;

/**
 * Maps frontend sort field names to SQL column expressions
 */
export const EVENT_LOG_SORT_FIELD_TO_COLUMN: FieldToColumnMap<EventLogSortField> = {
  timestamp: 'timestamp',
  visitorId: 'visitor_id',
};

/**
 * Default sort configuration for event log
 * Primary sort: timestamp descending (most recent first)
 * Tiebreaker: visitor_id ascending (deterministic ordering for same-timestamp events)
 */
export const DEFAULT_EVENT_LOG_SORT: EventLogSortConfig = {
  fields: [
    { field: 'timestamp', direction: 'desc' },
    { field: 'visitorId', direction: 'asc' },
  ],
};
