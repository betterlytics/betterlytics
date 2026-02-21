import { z } from "zod";

export const TotalPageViewRowSchema = z.object({
  date: z.string(),
  views: z.coerce.number(),
});


export const DailyPageViewRowSchema = z.object({
  date: z.string(),
  url: z.string(),
  views: z.coerce.number(),
});

export const PageviewsCountRowSchema = z.object({
    total: z.coerce.number(),
});

export type TotalPageViewsRow = z.infer<typeof TotalPageViewRowSchema>;
export type PageviewsCountRow = z.infer<typeof PageviewsCountRowSchema>;
export type DailyPageViewRow = z.infer<typeof DailyPageViewRowSchema>;