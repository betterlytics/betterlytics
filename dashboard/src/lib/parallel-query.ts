import type { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

type Compareable = { main: BASiteQuery; compare: BASiteQuery | null };

export async function compareable<T>(
  queries: Compareable,
  on: (query: BASiteQuery) => T,
): Promise<{ main: Awaited<T>; compare: Awaited<T | null> }> {
  const [main, compare] = await Promise.all([on(queries.main), queries.compare && on(queries.compare)]);

  return { main, compare };
}
