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

export const GlobalPropertyEventCountRowSchema = z.object({
  property_key: z.string(),
  event_count: z.coerce.number().int().nonnegative(),
  unique_value_count: z.coerce.number().int().nonnegative(),
});

export type GlobalPropertyEventCountRow = z.infer<typeof GlobalPropertyEventCountRowSchema>;

export const GlobalPropertyEventValueRowSchema = z.object({
  property_key: z.string(),
  value: z.string(),
  event_count: z.coerce.number().int().nonnegative(),
});

export type GlobalPropertyEventValueRow = z.infer<typeof GlobalPropertyEventValueRowSchema>;
