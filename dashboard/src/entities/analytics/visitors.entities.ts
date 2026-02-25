import { z } from "zod";

export const DailyUniqueVisitorsRowSchema = z.object({
  date: z.string(),
  unique_visitors: z.preprocess(val => Number(val), z.number()),
});

export type DailyUniqueVisitorsRow = z.infer<typeof DailyUniqueVisitorsRowSchema>; 
