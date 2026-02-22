import { z } from "zod";

export const DailyUniqueVisitorsRowSchema = z.object({
  date: z.string(),
  unique_visitors: z.coerce.number(),
});

export type DailyUniqueVisitorsRow = z.infer<typeof DailyUniqueVisitorsRowSchema>; 
