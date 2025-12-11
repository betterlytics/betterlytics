import { z } from 'zod';

/**
 * Sort direction for ordering
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);
export type SortDirection = z.infer<typeof SortDirectionSchema>;

/**
 * A single sort field with direction
 */
export const SortFieldSchema = z.object({
  field: z.string(),
  direction: SortDirectionSchema,
});
export type SortField = z.infer<typeof SortFieldSchema>;

/**
 * Sort configuration with multiple fields (first field is primary sort)
 */
export function createSortConfigSchema<T extends string>(allowedFields: readonly T[]) {
  const fieldSchema = z.enum(allowedFields as unknown as [T, ...T[]]);
  return z.object({
    fields: z.array(
      z.object({
        field: fieldSchema,
        direction: SortDirectionSchema,
      }),
    ),
  });
}

export type SortConfig<TField extends string> = {
  fields: Array<{ field: TField; direction: SortDirection }>;
};

/**
 * Cursor data - maps sort field names to their values at a specific position
 * Values can be strings or numbers depending on the field type
 */
export const CursorValueSchema = z.union([z.string(), z.number()]);
export type CursorValue = z.infer<typeof CursorValueSchema>;

export const CursorDataSchema = z.record(z.string(), CursorValueSchema);
export type CursorData = z.infer<typeof CursorDataSchema>;

/**
 * Generic cursor-paginated result type
 * @template T The type of items in the result
 */
export type CursorPaginatedResult<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Create a Zod schema for cursor-paginated results with a specific item schema
 */
export function createCursorPaginatedResultSchema<T>(itemSchema: z.ZodType<T>) {
  return z.object({
    items: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  });
}
