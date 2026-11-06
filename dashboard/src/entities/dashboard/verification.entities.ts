import { z } from 'zod';

export const TrackingStatusSchema = z.object({
  isReceiving: z.boolean(),
  lastEventAt: z.date().nullable(),
});

export type TrackingStatus = z.infer<typeof TrackingStatusSchema>;
