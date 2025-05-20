import { z } from "zod";

export const FunnelSchema = z.object({
  id: z.string(),
  name: z.string(),
  pages: z.string().array(),
});

export const FunnelDetailsSchema = FunnelSchema.extend({
  visitors: z.number().array()
});

export const CreateFunnelSchema = z.object({
  name: z.string(),
  pages: z.string().array(),
  siteId: z.string(),
});

export type Funnel = z.infer<typeof FunnelSchema>;
export type FunnelDetails = z.infer<typeof FunnelDetailsSchema>;
export type CreateFunnel = z.infer<typeof CreateFunnelSchema>;
