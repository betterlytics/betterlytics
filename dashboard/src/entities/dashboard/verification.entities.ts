import { z } from 'zod';
import { BILLABLE_EVENT_TYPES } from '@/entities/billing/billing.entities';

// Shared by install verification and the tracking-silent email, so both agree on when tracking stopped
export const TRACKING_EVENT_TYPES = BILLABLE_EVENT_TYPES;
export const TRACKING_SILENCE_HOURS = 48;

export const TrackingStatusSchema = z.object({
  isReceiving: z.boolean(),
  lastEventAt: z.date().nullable(),
});

export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;
