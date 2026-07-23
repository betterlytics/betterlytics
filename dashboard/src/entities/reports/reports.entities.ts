import { z } from 'zod';

export const TopPageWithPageviewsSchema = z.object({
  url: z.string(),
  pageviews: z.number(),
});

export type TopPageWithPageviews = z.infer<typeof TopPageWithPageviewsSchema>;
