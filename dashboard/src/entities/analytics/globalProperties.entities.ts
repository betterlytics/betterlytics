import { z } from 'zod';

export const GlobalPropertyKeyCountRowSchema = z.object({
  property_key: z.string(),
  visitors: z.number(),
});

export type GlobalPropertyKeyCountRow = z.infer<typeof GlobalPropertyKeyCountRowSchema>;

export const GlobalPropertyKeyValueRowSchema = z.object({
  property_key: z.string(),
  value: z.string(),
  visitors: z.number(),
});

export type GlobalPropertyKeyValueRow = z.infer<typeof GlobalPropertyKeyValueRowSchema>;
